import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { IndianRupee, TrendingUp } from "lucide-react";

export default async function ProviderEarningsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const completedJobs = await prisma.waterRequest.findMany({
    where: { 
      providerId: session.user.id,
      status: "COMPLETED"
    },
    include: { customer: true },
    orderBy: { createdAt: 'desc' },
  });

  // 5% Admin Commission fallback for older records
  const totalEarnings = completedJobs.reduce((sum, job) => sum + (job.finalPrice || job.requestedBudget || 0), 0);
  const totalCommission = completedJobs.reduce((sum, job) => {
    const base = job.finalPrice || job.requestedBudget || 0;
    const commission = job.commissionAmount || (base * 0.05);
    return sum + commission;
  }, 0);
  const netEarnings = totalEarnings - totalCommission;

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-4xl font-black tracking-tight text-gray-900 uppercase">Provider Profits</h1>
        <p className="text-muted-foreground font-medium mt-1">Audit your revenue stream and track platform commissions.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-gray-50/50">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-gray-400">Gross Revenue</CardTitle>
            <TrendingUp className="h-5 w-5 text-gray-400 opacity-50" />
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-3xl font-black text-gray-900">₹{totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <p className="text-[10px] uppercase font-bold text-gray-400 mt-2 tracking-tighter">Total order value</p>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2 bg-red-50/30">
            <CardTitle className="text-xs font-black uppercase tracking-widest text-red-400">Platform Fee (5%)</CardTitle>
            <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-3xl font-black text-red-600">₹{totalCommission.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <p className="text-[10px] uppercase font-bold text-red-400 mt-2 tracking-tighter">Admin Commission</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-2xl shadow-blue-500/10 bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-[2rem] overflow-hidden group">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-xs font-black uppercase tracking-widest opacity-80">Net Take-Home</CardTitle>
            <IndianRupee className="h-5 w-5 opacity-50 group-hover:rotate-12 transition-transform" />
          </CardHeader>
          <CardContent className="pt-6">
            <div className="text-3xl font-black antialiased">₹{netEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
            <p className="text-[10px] uppercase font-bold opacity-60 mt-2 tracking-tighter">Available for Withdrawal</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl bg-white rounded-[3rem] overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50/50 to-transparent border-b border-gray-100 p-8">
          <CardTitle className="text-2xl font-black uppercase tracking-tight">Full Earning Journal</CardTitle>
          <CardDescription className="text-gray-500 font-medium tracking-tight">An itemized breakdown of every completed shipment and its associated fees.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {completedJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-8 text-center bg-gray-50/50">
              <div className="h-16 w-16 bg-white rounded-full flex items-center justify-center shadow-inner mb-4 opacity-40">
                💰
              </div>
              <p className="text-sm font-black text-gray-400 uppercase tracking-widest">No completed transactions found yet.</p>
            </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="h-14 px-8 text-left align-middle font-black uppercase tracking-widest text-[11px] text-gray-400 uppercase">Closing Date</th>
                    <th className="h-14 px-8 text-left align-middle font-black uppercase tracking-widest text-[11px] text-gray-400 uppercase">Fulfillment Details</th>
                    <th className="h-14 px-8 text-right align-middle font-black uppercase tracking-widest text-[11px] text-gray-400 uppercase">Gross</th>
                    <th className="h-14 px-8 text-right align-middle font-black uppercase tracking-widest text-[11px] text-gray-400 uppercase">Fee (5%)</th>
                    <th className="h-14 px-8 text-right align-middle font-black uppercase tracking-widest text-[11px] text-gray-400 uppercase">Net Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {completedJobs.map((job) => {
                    const gross = job.finalPrice || job.requestedBudget || 0;
                    const fee = job.commissionAmount || (gross * 0.05);
                    const net = gross - fee;

                    return (
                      <tr key={job.id} className="hover:bg-blue-50/20 transition-all group">
                        <td className="px-8 py-6 align-middle font-bold text-gray-500 tabular-nums">
                          {new Date(job.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-8 py-6 align-middle">
                          <div className="flex flex-col">
                            <span className="font-black text-gray-900 uppercase tracking-tight antialiased">{job.quantity}L Shipment</span>
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest opacity-60">Recipient: {job.customer?.name}</span>
                          </div>
                        </td>
                        <td className="px-8 py-6 align-middle text-right font-black text-gray-800 tabular-nums">₹{gross.toFixed(2)}</td>
                        <td className="px-8 py-6 align-middle text-right text-red-500 font-bold tabular-nums italic">-₹{fee.toFixed(2)}</td>
                        <td className="px-8 py-6 align-middle text-right text-blue-700 font-black text-lg tabular-nums antialiased shadow-inner-white">
                          ₹{net.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
