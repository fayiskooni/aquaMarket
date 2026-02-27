import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplets, History, Star, TrendingUp } from "lucide-react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function CustomerDashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [
    activeRequestsCount,
    totalOrdersCount,
    completedRequests,
    ratingsGiven,
    recentRequests
  ] = await Promise.all([
    prisma.waterRequest.count({
      where: {
        customerId: userId,
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      }
    }),
    prisma.waterRequest.count({
      where: {
        customerId: userId,
      }
    }),
    prisma.waterRequest.findMany({
      where: {
        customerId: userId,
        status: "COMPLETED",
      },
      select: { finalPrice: true }
    }),
    prisma.rating.aggregate({
      where: { customerId: userId },
      _avg: { rating: true },
      _count: { rating: true }
    }),
    prisma.waterRequest.findMany({
      where: { customerId: userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { provider: true }
    })
  ]);

  const totalSpent = completedRequests.reduce((sum, req) => sum + (req.finalPrice || 0), 0);
  const avgRating = ratingsGiven._avg.rating?.toFixed(1) || "0.0";
  const ratingCount = ratingsGiven._count.rating || 0;

  // Favorite providers (most interacted/rated)
  const providerStats = await prisma.rating.groupBy({
    by: ['providerId'],
    where: { customerId: userId },
    _avg: { rating: true },
    _count: { providerId: true },
    orderBy: {
      _count: { providerId: 'desc' }
    },
    take: 3
  });

  const providerIds = providerStats.map(ps => ps.providerId);
  const favoriteProvidersData = await prisma.user.findMany({
    where: { id: { in: providerIds } },
    select: { id: true, name: true }
  });

  const favoriteProviders = providerStats.map(ps => ({
    ...ps,
    provider: favoriteProvidersData.find(p => p.id === ps.providerId)
  }));


  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's an overview of your water supply.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRequestsCount}</div>
            <p className="text-xs text-muted-foreground">Currently in progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <History className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrdersCount}</div>
            <p className="text-xs text-muted-foreground">Lifetime orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Spent</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpent.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Lifetime expenditure</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating Given</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgRating}</div>
            <p className="text-xs text-muted-foreground">Across {ratingCount} reviews</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Requests</CardTitle>
            <CardDescription>Your most recent water delivery requests.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentRequests.length === 0 ? (
              <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
                <p className="text-sm text-muted-foreground">No recent requests.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentRequests.map(req => (
                  <div key={req.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">
                        {req.quantity} L {req.provider ? `from ${req.provider.name}` : ''}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(req.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">${req.finalPrice || req.requestedBudget}</p>
                      <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800">
                        {req.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Favorite Providers</CardTitle>
            <CardDescription>Quickly request from past providers.</CardDescription>
          </CardHeader>
          <CardContent>
            {favoriteProviders.length === 0 ? (
              <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
                <p className="text-sm text-muted-foreground">No favorite providers yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {favoriteProviders.map((fav) => (
                  <div key={fav.providerId} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="font-medium">{fav.provider?.name || "Unknown Provider"}</p>
                      <p className="text-sm text-muted-foreground">Ordered {fav._count.providerId} times</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm font-medium">{fav._avg.rating?.toFixed(1) || "5.0"}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
