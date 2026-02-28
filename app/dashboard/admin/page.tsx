import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, AlertCircle, IndianRupee, Activity, CheckCircle } from "lucide-react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/ui/status-badge";
import { ProviderReviewActions } from "@/components/Admin/ProviderReviewActions";
import { Button } from "@/components/ui/button";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id || session?.user?.role !== "ADMIN") {
    redirect("/login");
  }

  const [
    completedRequests,
    pendingVerificationsCount,
    activeRequestsCount,
    openDisputesCount,
    recentTransactions,
    pendingProviders,
    recentDisputes
  ] = await Promise.all([
    prisma.waterRequest.findMany({
      where: { status: "COMPLETED" },
      select: { commissionAmount: true, finalPrice: true }
    }),
    prisma.providerProfile.count({
      where: { verificationStatus: "PENDING_VERIFICATION" }
    }),
    prisma.waterRequest.count({
      where: { status: { notIn: ["COMPLETED", "CANCELLED", "CREATED"] } }
    }),
    prisma.dispute.count({
      where: { status: "OPEN" }
    }),
    prisma.waterRequest.findMany({
      where: { status: "COMPLETED" },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: { customer: true, provider: true }
    }),
    prisma.providerProfile.findMany({
      where: { verificationStatus: "PENDING_VERIFICATION" },
      take: 3,
      include: { user: true }
    }),
    prisma.dispute.findMany({
      where: { status: "OPEN" },
      take: 3,
      include: { waterRequest: true }
    })
  ]);

  // If there's no commission amount set, we can just assume 10% of finalPrice for demo scale
  const totalRevenue = completedRequests.reduce((sum, req) => {
    return sum + (req.commissionAmount ?? ((req.finalPrice || 0) * 0.10));
  }, 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
        <p className="text-muted-foreground">Platform overview and management.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Platform Revenue</CardTitle>
            <IndianRupee className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Lifetime commissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingVerificationsCount}</div>
            <p className="text-xs text-muted-foreground">Providers awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
            <Activity className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeRequestsCount}</div>
            <p className="text-xs text-muted-foreground">Currently in progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Open Disputes</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{openDisputesCount}</div>
            <p className="text-xs text-muted-foreground">Requires immediate attention</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>Recent Transactions</CardTitle>
            <CardDescription>Latest completed water deliveries across the platform.</CardDescription>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <div className="flex h-32 items-center justify-center rounded-md border border-dashed">
                <p className="text-sm text-muted-foreground">No completed transactions yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTransactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                    <div>
                      <p className="text-sm font-medium">
                        {tx.customer?.name} → {tx.provider?.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {tx.quantity}L • {new Date(tx.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">₹{tx.finalPrice}</p>
                      <StatusBadge status={tx.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>Action Items</CardTitle>
            <CardDescription>Administrative tasks requiring your attention.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 px-4 pb-6">
             {pendingProviders.map(p => (
               <div key={p.id} className="flex items-center justify-between group p-2 rounded-xl border border-transparent hover:border-blue-100 hover:bg-blue-50/50 transition-all duration-200">
                 <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 bg-blue-100 rounded-lg flex items-center justify-center text-blue-700 font-bold group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      {p.user.name?.[0].toUpperCase() || "P"}
                    </div>
                    <div>
                       <p className="text-sm font-bold text-gray-800 leading-tight">Verify: {p.user.name}</p>
                       <p className="text-[10px] text-muted-foreground mt-0.5 font-medium uppercase tracking-wider">Registered {new Date(p.createdAt).toLocaleDateString()}</p>
                    </div>
                 </div>
                 <ProviderReviewActions provider={{
                    id: p.user.id,
                    name: p.user.name,
                    email: p.user.email,
                    phone: p.user.phone,
                    verificationStatus: p.verificationStatus,
                    location: p.location
                 }} />
               </div>
             ))}
             {recentDisputes.map(d => (
               <div key={d.id} className="flex items-center justify-between p-2 rounded-xl border border-transparent hover:bg-red-50/50 hover:border-red-100 transition-all duration-200 group">
                 <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 bg-red-100 rounded-lg flex items-center justify-center text-red-700 font-bold group-hover:bg-red-600 group-hover:text-white transition-colors">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    <div className="max-w-[150px]">
                       <p className="text-sm font-bold text-gray-800 leading-tight">Dispute: Req #{d.waterRequestId.slice(-4)}</p>
                       <p className="text-[10px] text-muted-foreground mt-0.5 truncate font-medium uppercase tracking-wider">{d.reason}</p>
                    </div>
                 </div>
                 <Button variant="ghost" size="sm" className="text-xs font-bold text-red-500 hover:text-red-700 hover:bg-red-100/50 h-8 rounded-lg px-2 shadow-none border-transparent">
                   Resolve
                 </Button>
               </div>
             ))}
             {pendingProviders.length === 0 && recentDisputes.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 opacity-60">
                   <div className="h-14 w-14 bg-gray-50 rounded-full flex items-center justify-center border border-dashed border-gray-300">
                     <CheckCircle className="h-6 w-6 text-gray-300" />
                   </div>
                   <p className="text-xs font-bold text-gray-400 mt-4 uppercase tracking-widest">All caught up!</p>
                </div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
