import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, AlertCircle, DollarSign, Activity } from "lucide-react";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/ui/status-badge";

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
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Lifetime commissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Pending Verifications</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingVerificationsCount}</div>
            <p className="text-xs text-muted-foreground">Providers awaiting approval</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Requests</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
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
                      <p className="font-medium">${tx.finalPrice}</p>
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
          <CardContent className="space-y-4">
             {pendingProviders.map(p => (
               <div key={p.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                 <div>
                    <p className="text-sm font-medium">Verify: {p.user.name}</p>
                    <p className="text-xs text-muted-foreground">Registered {new Date(p.createdAt).toLocaleDateString()}</p>
                 </div>
                 <div className="text-sm text-blue-500 cursor-pointer font-medium hover:underline">Review</div>
               </div>
             ))}
             {recentDisputes.map(d => (
               <div key={d.id} className="flex items-center justify-between border-b pb-4 last:border-0 last:pb-0">
                 <div>
                    <p className="text-sm font-medium">Dispute: Req #{d.waterRequestId.slice(-4)}</p>
                    <p className="text-xs text-muted-foreground truncate w-40">{d.reason}</p>
                 </div>
                 <div className="text-sm text-red-500 cursor-pointer font-medium hover:underline">Resolve</div>
               </div>
             ))}
             {pendingProviders.length === 0 && recentDisputes.length === 0 && (
                <div className="flex items-center justify-center py-4">
                  <p className="text-sm text-muted-foreground">All caught up!</p>
                </div>
             )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
