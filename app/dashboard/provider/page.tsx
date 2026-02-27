import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Droplets, DollarSign, Star, TrendingUp } from "lucide-react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function ProviderDashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const [
    profile,
    activeJobsCount,
    completedJobs,
    recentJobs
  ] = await Promise.all([
    prisma.providerProfile.findUnique({
      where: { userId }
    }),
    prisma.waterRequest.count({
      where: {
        providerId: userId,
        status: { notIn: ["COMPLETED", "CANCELLED", "CREATED"] }
      }
    }),
    prisma.waterRequest.findMany({
      where: {
        providerId: userId,
        status: "COMPLETED"
      },
      select: { finalPrice: true }
    }),
    prisma.waterRequest.findMany({
      where: { providerId: userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { customer: true }
    })
  ]);

  const totalEarnings = completedJobs.reduce((sum, req) => sum + (req.finalPrice || 0), 0);
  const completedCount = completedJobs.length;
  const isAvailable = profile?.isAvailable || false;
  const verificationStatus = profile?.verificationStatus || "PENDING_VERIFICATION";
  const avgRating = profile?.ratingAverage?.toFixed(1) || "0.0";
  const totalRatings = profile?.totalRatings || 0;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Provider Dashboard</h1>
          <p className="text-muted-foreground">Manage your orders and track earnings.</p>
        </div>
        <div>
          <StatusBadge status={verificationStatus} />
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Lifetime revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Jobs</CardTitle>
            <Droplets className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeJobsCount}</div>
            <p className="text-xs text-muted-foreground">Currently assigned or in transit</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Completed Deliveries</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedCount}</div>
            <p className="text-xs text-muted-foreground">Successfully fulfilled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgRating}</div>
            <p className="text-xs text-muted-foreground">From {totalRatings} reviews</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Jobs</CardTitle>
            <CardDescription>Your latest water delivery tasks.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentJobs.length === 0 ? (
              <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
                <p className="text-sm text-muted-foreground">No recent jobs assigned.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentJobs.map(job => (
                  <div key={job.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        {job.quantity} L for {job.customer?.name || "Customer"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Ordered: {new Date(job.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="font-medium">${job.finalPrice || job.requestedBudget}</div>
                      <StatusBadge status={job.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Availability Status</CardTitle>
            <CardDescription>Toggle if you are actively taking orders.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              <div className={`h-3 w-3 rounded-full ${isAvailable ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="text-sm font-medium">
                {isAvailable ? "Currently Available" : "Not Taking Orders"}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
