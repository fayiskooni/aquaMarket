import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Droplets, IndianRupee, Star, TrendingUp } from "lucide-react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AcceptJobButton } from "@/components/AcceptJobButton";

export default async function ProviderDashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = session.user.id;

  const results = await Promise.all([
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
      select: { finalPrice: true, requestedBudget: true }
    }),
    prisma.waterRequest.findMany({
      where: { providerId: userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: { customer: true }
    }),
    prisma.waterRequest.findMany({
      where: { 
        status: "CREATED",
        providerId: null
      },
      include: { customer: true },
      orderBy: { createdAt: 'desc' }
    })
  ]);

  const profile = results[0];
  const activeJobsCount = results[1];
  const completedJobs = results[2];
  const recentJobs = results[3];
  const availableRequests = results[4];


  const totalEarnings = completedJobs.reduce((sum, req) => sum + (req.finalPrice || req.requestedBudget || 0), 0);
  const completedCount = completedJobs.length;
  const isAvailable = profile?.isAvailable || false;
  const verificationStatus = profile?.verificationStatus || "PENDING_VERIFICATION";
  const avgRating = profile?.ratingAverage?.toFixed(1) || "0.0";
  const totalRatings = profile?.totalRatings || 0;

  const cancelledCount = await prisma.waterRequest.count({
    where: { providerId: userId, status: "CANCELLED" }
  });

  const pendingEarnings = await prisma.waterRequest.aggregate({
    where: { 
      providerId: userId, 
      status: { in: ["ASSIGNED", "APPROVED", "IN_TRANSIT", "DELIVERED"] } 
    },
    _sum: { finalPrice: true }
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900">Provider Console</h1>
          <p className="text-muted-foreground font-medium mt-1">Track your performance, earnings, and active delivery fleet.</p>
        </div>
        <div className="group transition-transform hover:scale-110 duration-500">
          <StatusBadge status={verificationStatus} />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-2xl shadow-blue-500/10 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-[2rem] overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest opacity-80">Wallet Balance</CardTitle>
            <IndianRupee className="h-5 w-5 opacity-50 group-hover:rotate-12 transition-transform" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black antialiased">₹{totalEarnings.toFixed(2)}</div>
            <p className="text-[10px] uppercase font-bold opacity-60 mt-2 tracking-tighter">Fulfilled {completedCount} Deliveries</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden border-b-4 border-b-orange-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-gray-400">In Progress</CardTitle>
            <Droplets className="h-5 w-5 text-orange-500 opacity-50" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-gray-900">{activeJobsCount}</div>
            <p className="text-[10px] uppercase font-bold text-orange-600/60 mt-2 tracking-tighter">Est. Value: ₹{pendingEarnings._sum.finalPrice || 0}</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden border-b-4 border-b-red-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-gray-400">Cancelled</CardTitle>
            <TrendingUp className="h-5 w-5 text-red-500 opacity-50 -rotate-90" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-gray-900">{cancelledCount}</div>
            <p className="text-[10px] uppercase font-bold text-red-600/60 mt-2 tracking-tighter">Failed or Revoked</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden border-b-4 border-b-yellow-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-gray-400">Trust Score</CardTitle>
            <Star className="h-5 w-5 text-yellow-500 opacity-50" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-gray-900">{avgRating}</div>
            <p className="text-[10px] uppercase font-bold text-yellow-600/60 mt-2 tracking-tighter">From {totalRatings} Customers</p>
          </CardContent>
        </Card>
      </div>


      {verificationStatus === "APPROVED" && availableRequests.length > 0 && (
        <Card className="border-blue-200 bg-blue-50/50">
          <CardHeader>
            <CardTitle className="text-blue-700 flex items-center gap-2">
              <Droplets className="h-5 w-5" />
              Available Jobs (Broadcast)
            </CardTitle>
            <CardDescription>First provider to accept these jobs gets assigned.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {availableRequests.map((req: any) => (
                <Card key={req.id} className="bg-white">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-bold text-lg">{req.quantity} L</p>
                        <p className="text-sm text-muted-foreground">From {req.customer?.name || "Customer"}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">₹{req.requestedBudget}</p>
                        <p className="text-[10px] text-muted-foreground">Budgeted Price</p>
                      </div>
                    </div>
                    <AcceptJobButton requestId={req.id} />
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

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
                      <div className="font-medium">₹{job.finalPrice || job.requestedBudget}</div>
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
