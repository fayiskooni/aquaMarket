import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Droplets, History, Star, TrendingUp } from "lucide-react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function CustomerDashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const results = await Promise.all([
    // Index 0: activeRequestsCount
    prisma.waterRequest.count({
      where: {
        customerId: userId,
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      }
    }),
    // Index 1: totalOrdersCount
    prisma.waterRequest.count({
      where: { customerId: userId }
    }),
    // Index 2: completedRequests
    prisma.waterRequest.findMany({
      where: { customerId: userId, status: "COMPLETED" },
      select: { finalPrice: true, requestedBudget: true, quantity: true }
    }),
    // Index 3: ratingsGiven
    prisma.rating.aggregate({
      where: { customerId: userId },
      _avg: { rating: true },
      _count: { rating: true }
    }),
    // Index 4: recentRequests
    prisma.waterRequest.findMany({
      where: { customerId: userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { provider: true }
    }),
    // Index 5: providerStats (for favorites)
    prisma.rating.groupBy({
      by: ['providerId'],
      where: { customerId: userId },
      _avg: { rating: true },
      _count: { providerId: true },
      orderBy: {
        _count: { providerId: 'desc' }
      },
      take: 3
    })
  ]);

  const activeRequestsCount = results[0] as number;
  const totalOrdersCount = results[1] as number;
  const completedRequests = results[2] as any[];
  const ratingsGiven = results[3] as any;
  const recentRequests = results[4] as any[];
  const providerStats = results[5] as any[];

  // Use requestedBudget as fallback if finalPrice is missing
  const totalSpent = completedRequests.reduce((sum, req) => sum + (req.finalPrice || req.requestedBudget || 0), 0);
  const totalLiters = completedRequests.reduce((sum, req) => sum + (req.quantity || 0), 0);
  const avgRating = ratingsGiven._avg.rating?.toFixed(1) || "0.0";
  const ratingCount = ratingsGiven._count.rating || 0;

  // Favorite providers (fetch user names in parallel if needed, or already got via include?)
  const providerIds = providerStats.map(ps => ps.providerId);
  const favoriteProvidersData = await prisma.user.findMany({
    where: { id: { in: providerIds } },
    select: { id: true, name: true }
  });

  const favoriteProviders = providerStats.map(ps => ({
    ...ps,
    provider: favoriteProvidersData.find(u => u.id === ps.providerId)
  }));



  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-gray-900">Consumer Panel</h1>
        <p className="text-muted-foreground font-medium mt-1">Manage your water supply and track delivery performance.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-2xl shadow-blue-500/10 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-[2rem] overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest opacity-80">Total Liters</CardTitle>
            <Droplets className="h-5 w-5 opacity-50 group-hover:animate-bounce" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black antialiased">{totalLiters.toLocaleString()} L</div>
            <p className="text-[10px] uppercase font-bold opacity-60 mt-2 tracking-tighter">Across {totalOrdersCount} Deliveries</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden border-b-4 border-b-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-gray-400">Total Expenditure</CardTitle>
            <TrendingUp className="h-5 w-5 text-blue-500 opacity-50" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-gray-900">₹{totalSpent.toFixed(2)}</div>
            <p className="text-[10px] uppercase font-bold text-blue-600/60 mt-2 tracking-tighter">Paid via Cash/Wallet</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden border-b-4 border-b-orange-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-gray-400">Active Pipeline</CardTitle>
            <History className="h-5 w-5 text-orange-500 opacity-50" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-gray-900">{activeRequestsCount}</div>
            <p className="text-[10px] uppercase font-bold text-orange-600/60 mt-2 tracking-tighter">Pending Shipments</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden border-b-4 border-b-yellow-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-gray-400">Feedback Avg</CardTitle>
            <Star className="h-5 w-5 text-yellow-500 opacity-50" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-gray-900">{avgRating}</div>
            <p className="text-[10px] uppercase font-bold text-yellow-600/60 mt-2 tracking-tighter">Based on {ratingCount} Starred Jobs</p>
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
                      <p className="font-medium">₹{req.finalPrice || req.requestedBudget}</p>
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
