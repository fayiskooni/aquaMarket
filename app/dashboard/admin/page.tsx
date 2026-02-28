import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, AlertCircle, IndianRupee, Activity, CheckCircle, TrendingUp, Star } from "lucide-react";
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
      select: { 
        id: true,
        commissionAmount: true, 
        finalPrice: true, 
        requestedBudget: true,
        provider: { select: { name: true } }
      }
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

  // 5% Admin Commission fallback for older or manual records
  const totalRevenue = completedRequests.reduce((sum, req) => {
    const basePrice = req.finalPrice || req.requestedBudget || 0;
    const commission = req.commissionAmount ?? (basePrice * 0.05);
    return sum + (commission > 0 ? commission : 0);
  }, 0);

  const providerStats = await prisma.user.findMany({
    where: { role: 'PROVIDER' },
    include: {
      providerProfile: true,
      providerRequests: {
        select: { status: true, finalPrice: true, requestedBudget: true }
      }
    }
  });

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-gray-900">Admin Central</h1>
        <p className="text-muted-foreground font-medium mt-1">Platform-wide overview, revenue tracking, and provider management.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-2xl shadow-green-500/10 bg-gradient-to-br from-green-600 to-green-700 text-white rounded-[2rem] overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest opacity-80">Platform Revenue</CardTitle>
            <IndianRupee className="h-5 w-5 opacity-50" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black antialiased">₹{totalRevenue.toFixed(2)}</div>
            <p className="text-[10px] uppercase font-bold opacity-60 mt-2 tracking-tighter">Lifetime Commissions</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden border-b-4 border-b-blue-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-gray-400">Verifications</CardTitle>
            <Users className="h-5 w-5 text-blue-600 opacity-50" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-gray-900">{pendingVerificationsCount}</div>
            <p className="text-[10px] uppercase font-bold text-blue-600/60 mt-2 tracking-tighter">Providers Awaiting</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden border-b-4 border-b-orange-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-gray-400">Live Traffic</CardTitle>
            <Activity className="h-5 w-5 text-orange-600 opacity-50" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-gray-900">{activeRequestsCount}</div>
            <p className="text-[10px] uppercase font-bold text-orange-600/60 mt-2 tracking-tighter">Jobs in Progress</p>
          </CardContent>
        </Card>
        <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden border-b-4 border-b-red-500/20">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-gray-400">Escalations</CardTitle>
            <AlertCircle className="h-5 w-5 text-red-500 opacity-50" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-gray-900">{openDisputesCount}</div>
            <p className="text-[10px] uppercase font-bold text-red-600/60 mt-2 tracking-tighter">Requires Action</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100 p-6">
            <CardTitle className="text-xl font-black">Recent Transactions</CardTitle>
            <CardDescription>Latest completed water deliveries across the platform.</CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            {recentTransactions.length === 0 ? (
              <div className="flex h-32 items-center justify-center rounded-2xl border-2 border-dashed border-gray-100 italic font-bold text-gray-300 uppercase tracking-widest text-xs">
                No completed transactions yet.
              </div>
            ) : (
              <div className="space-y-6">
                {recentTransactions.map(tx => (
                  <div key={tx.id} className="flex items-center justify-between border-b border-gray-50 pb-4 last:border-0 last:pb-0 group">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 bg-blue-50 rounded-xl flex items-center justify-center text-blue-600 font-black text-xs group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:scale-110">
                        {tx.customer?.name?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-black text-gray-800">
                          {tx.customer?.name} → {tx.provider?.name}
                        </p>
                        <p className="text-[10px] font-black uppercase text-muted-foreground tracking-tighter">
                          {tx.quantity}L • {new Date(tx.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-black text-blue-600 text-lg">₹{(tx.finalPrice || tx.requestedBudget || 0).toFixed(2)}</p>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">+₹{(tx.commissionAmount || ((tx.finalPrice || tx.requestedBudget || 0) * 0.05)).toFixed(2)} Yield</span>
                        <span className="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter">Source: {tx.provider?.name || "Hub"}</span>
                      </div>
                      <StatusBadge status={tx.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-3 border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
          <CardHeader className="bg-gray-50/50 border-b border-gray-100 p-6">
            <CardTitle className="text-xl font-black">Action Items</CardTitle>
            <CardDescription>Tasks requiring immediate attention.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5 p-6">
             {pendingProviders.map(p => (
               <div key={p.id} className="flex items-center justify-between group p-3 rounded-2xl border border-transparent hover:border-blue-100 hover:bg-blue-50/50 transition-all duration-300">
                 <div className="flex items-center gap-4 text-left">
                    <div className="h-10 w-10 shrink-0 bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 font-black text-xs group-hover:bg-blue-600 group-hover:text-white transition-colors">
                      {p.user.name?.[0].toUpperCase() || "P"}
                    </div>
                    <div>
                       <p className="text-sm font-black text-gray-800 leading-tight">Verify Provider</p>
                       <p className="text-[10px] text-muted-foreground mt-0.5 font-bold uppercase tracking-widest">{p.user.name}</p>
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
               <div key={d.id} className="flex items-center justify-between p-3 rounded-2xl border border-transparent hover:bg-red-50/50 hover:border-red-100 transition-all duration-300 group text-left">
                 <div className="flex items-center gap-4">
                    <div className="h-10 w-10 shrink-0 bg-red-100 rounded-xl flex items-center justify-center text-red-700 font-black group-hover:bg-red-600 group-hover:text-white transition-colors">
                      <AlertCircle className="h-5 w-5" />
                    </div>
                    <div className="max-w-[150px]">
                       <p className="text-sm font-black text-gray-800 leading-tight">Active Dispute</p>
                       <p className="text-[10px] text-muted-foreground mt-0.5 truncate font-bold uppercase tracking-widest">Req #{d.waterRequestId.slice(-4)}</p>
                    </div>
                 </div>
                 <Button variant="ghost" size="sm" className="text-[10px] font-black uppercase tracking-widest text-red-500 hover:text-red-700 hover:bg-red-100/50 h-10 rounded-xl px-4 shadow-none">
                   Resolve
                 </Button>
               </div>
             ))}
             {pendingProviders.length === 0 && recentDisputes.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 opacity-60">
                   <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center border-2 border-dashed border-gray-200">
                     <CheckCircle className="h-6 w-6 text-gray-200" />
                   </div>
                   <p className="text-[10px] font-black text-gray-300 mt-4 uppercase tracking-widest">Command Clear</p>
                </div>
             )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl bg-white rounded-[3rem] overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50/50 to-transparent border-b border-gray-100 p-8">
          <CardTitle className="text-2xl font-black uppercase tracking-tight">Provider Intelligence Matrix</CardTitle>
          <CardDescription className="text-gray-500 font-medium tracking-tight">Comprehensive performance analytics and fulfillment auditing per provider.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative w-full overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  <th className="h-14 px-8 text-left align-middle font-black uppercase tracking-widest text-[11px] text-gray-400">Identity</th>
                  <th className="h-14 px-8 text-center align-middle font-black uppercase tracking-widest text-[11px] text-gray-400">Success Rate</th>
                  <th className="h-14 px-8 text-center align-middle font-black uppercase tracking-widest text-[11px] text-gray-400">Cancelled</th>
                  <th className="h-14 px-8 text-center align-middle font-black uppercase tracking-widest text-[11px] text-gray-400">Reputation</th>
                  <th className="h-14 px-8 text-right align-middle font-black uppercase tracking-widest text-[11px] text-gray-400">Yield (Total)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {providerStats.map(p => {
                  const completed = p.providerRequests.filter(r => r.status === 'COMPLETED').length;
                  const cancelled = p.providerRequests.filter(r => r.status === 'CANCELLED').length;
                  const revenue = p.providerRequests
                    .filter(r => r.status === 'COMPLETED')
                    .reduce((sum, r) => sum + (r.finalPrice || r.requestedBudget || 0), 0);

                  return (
                    <tr key={p.id} className="hover:bg-blue-50/20 transition-all group">
                      <td className="px-8 py-6 font-black text-gray-700 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{p.name}</td>
                      <td className="px-8 py-6 text-center">
                        <span className="bg-green-100 text-green-700 px-3 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest">{completed} Jobs</span>
                      </td>
                      <td className="px-8 py-6 text-center">
                        <span className="bg-red-100 text-red-700 px-3 py-1.5 rounded-2xl text-[10px] font-black uppercase tracking-widest">{cancelled} Fail</span>
                      </td>
                      <td className="px-8 py-6 text-center font-black text-blue-600 flex items-center justify-center gap-1">
                        <span className="text-gray-900">{p.providerProfile?.ratingAverage.toFixed(1) || "5.0"}</span>
                        <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      </td>
                      <td className="px-8 py-6 text-right font-black text-blue-700 text-lg tracking-tighter">
                        ₹{revenue.toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
