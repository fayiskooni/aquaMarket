import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AlertCircle, History, Filter } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { ResolveDisputeAction } from "@/components/Admin/ResolveDisputeAction";

export default async function AdminDisputesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id || session?.user?.role !== "ADMIN") {
    redirect("/login");
  }

  const disputes = await prisma.dispute.findMany({
    include: { 
      raisedBy: true,
      waterRequest: {
        include: {
          provider: true
        }
      } 
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-gray-900 uppercase italic underline decoration-red-500/20 underline-offset-8">System Disputes</h1>
          <p className="text-muted-foreground font-medium mt-2">Manage ongoing and past disputes reported by users across the platform.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-red-600/5 text-red-600 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-red-600/10 shadow-sm flex items-center gap-2">
            <AlertCircle className="h-3 w-3" />
            {disputes.filter(d => d.status === 'OPEN').length} Active Issues
          </div>
        </div>
      </div>

      <Card className="border-none shadow-xl bg-white rounded-[3rem] overflow-hidden border-b-4 border-b-red-500/5">
        <CardHeader className="bg-gradient-to-r from-red-50/50 to-transparent border-b border-gray-100 p-8 flex flex-row items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-black flex items-center gap-3">
              <History className="h-6 w-6 text-red-500" />
              Fulfillment Audit Log
            </CardTitle>
            <CardDescription className="text-gray-500 font-medium italic lowercase tracking-tight">Review and resolve user complaints regarding water quality or delivery conduct.</CardDescription>
          </div>
          <Filter className="h-5 w-5 text-gray-300 hover:text-gray-500 transition-colors cursor-pointer" />
        </CardHeader>
        <CardContent className="p-0">
          {disputes.length === 0 ? (
             <div className="flex flex-col items-center justify-center p-24 text-center bg-gray-50/30">
               <div className="h-24 w-24 bg-white rounded-[2rem] flex items-center justify-center shadow-inner mb-6 opacity-40 border-2 border-dashed border-gray-100 italic font-black text-gray-200">
                 NULL
               </div>
               <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Platform status: perfectly clear.</p>
             </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-400">
                    <th className="h-14 px-8 text-left align-middle font-black uppercase tracking-widest text-[11px] tabular-nums">Closing Edge</th>
                    <th className="h-14 px-8 text-left align-middle font-black uppercase tracking-widest text-[11px] tabular-nums">Complainant</th>
                    <th className="h-14 px-8 text-left align-middle font-black uppercase tracking-widest text-[11px] tabular-nums">Reason / Complaint</th>
                    <th className="h-14 px-8 text-center align-middle font-black uppercase tracking-widest text-[11px] tabular-nums">Status</th>
                    <th className="h-14 px-8 text-right align-middle font-black uppercase tracking-widest text-[11px] tabular-nums">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {disputes.map((dispute) => (
                    <tr key={dispute.id} className="group transition-all hover:bg-red-50/10 cursor-default">
                      <td className="px-8 py-6 align-middle font-bold text-gray-500 tabular-nums">
                        {new Date(dispute.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-8 py-6 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 font-black text-xs group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:scale-105">
                            {dispute.raisedBy?.name?.[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-black text-gray-900 uppercase tracking-tight">{dispute.raisedBy?.name || "Global User"}</p>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-60">ID: {dispute.raisedBy?.id.slice(-8)}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 align-middle">
                        <div className="max-w-[300px]">
                          <p className="text-sm font-medium text-gray-800 line-clamp-2 leading-relaxed italic caret-red-500">"{dispute.reason}"</p>
                          <p className="text-[9px] mt-2 font-black text-red-500/60 uppercase tracking-tighter">Job: {dispute.waterRequest?.provider?.name || "Unknown Provider"}</p>
                        </div>
                      </td>
                      <td className="px-8 py-6 align-middle text-center">
                        <div className="flex justify-center scale-110">
                          <StatusBadge status={dispute.status as any} />
                        </div>
                      </td>
                      <td className="px-8 py-6 align-middle text-right min-w-[120px]">
                        {dispute.status === 'OPEN' ? (
                          <div className="flex justify-end pr-2">
                             <ResolveDisputeAction disputeId={dispute.id} requestId={dispute.waterRequestId} />
                          </div>
                        ) : (
                          <span className="text-[10px] font-black uppercase text-gray-300 tracking-widest mr-4">Resolved</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
