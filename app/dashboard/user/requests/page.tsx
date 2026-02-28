import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/ui/status-badge";
import { CancelRequestButton } from "@/components/CancelRequestButton";
import { ReportDisputeButton } from "@/components/ReportDisputeButton";
import { RequestStatus } from "@prisma/client";

export default async function UserRequestsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const requests = await prisma.waterRequest.findMany({
    where: { customerId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: { 
      provider: true,
      disputes: true
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 font-black">My Requests</h1>
          <p className="text-muted-foreground font-medium">View and manage your water delivery requests.</p>
        </div>
        <div className="bg-blue-600/5 text-blue-600 px-4 py-2 rounded-2xl text-xs font-black uppercase tracking-widest border border-blue-600/10 shadow-sm">
          {requests.length} Total Saved
        </div>
      </div>

      <Card className="border-none shadow-xl bg-white/80 backdrop-blur-xl overflow-hidden rounded-3xl">
        <CardHeader className="bg-gradient-to-r from-blue-50/50 to-transparent border-b border-gray-100 p-8">
          <CardTitle className="text-xl font-bold tracking-tight font-black">Request History</CardTitle>
          <CardDescription className="text-gray-500 font-medium lowercase italic first-letter:uppercase tracking-tight">
            A comprehensive list of your water orders and their delivery status.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center space-y-3 p-16 text-center">
              <div className="h-20 w-20 bg-gray-50 rounded-full flex items-center justify-center opacity-30 invert shadow-inner animate-pulse">
                 ☁️
              </div>
              <p className="text-base text-muted-foreground font-bold tracking-tight">You haven't made any requests yet.</p>
            </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-400">
                    <th className="h-14 px-8 text-left align-middle font-black uppercase tracking-widest text-[11px]">Date</th>
                    <th className="h-14 px-8 text-left align-middle font-black uppercase tracking-widest text-[11px]">Provider</th>
                    <th className="h-14 px-8 text-center align-middle font-black uppercase tracking-widest text-[11px]">Capacity</th>
                    <th className="h-14 px-8 text-center align-middle font-black uppercase tracking-widest text-[11px]">Budget</th>
                    <th className="h-14 px-8 text-center align-middle font-black uppercase tracking-widest text-[11px]">Status</th>
                    <th className="h-14 px-8 text-right align-middle font-black uppercase tracking-widest text-[11px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {requests.map((request) => {
                    const hasOpenDispute = request.disputes.some(d => d.status === "OPEN");
                    const cancellableStatuses: RequestStatus[] = [
                      RequestStatus.CREATED,
                      RequestStatus.ASSIGNED,
                      RequestStatus.APPROVED
                    ];
                    const canCancel = cancellableStatuses.includes(request.status) && !hasOpenDispute;
                    const canReport = request.status !== RequestStatus.CANCELLED && !hasOpenDispute;

                    return (
                      <tr 
                        key={request.id} 
                        className="group transition-all hover:bg-blue-50/30 cursor-default"
                      >
                        <td className="px-8 py-5 align-middle whitespace-nowrap">
                          <div className="flex flex-col">
                            <span className="font-bold text-gray-800 leading-none antialiased">
                              {new Date(request.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </span>
                            <span className="text-[10px] text-muted-foreground mt-1 uppercase font-black tracking-widest opacity-60">
                              {new Date(request.createdAt).getFullYear()}
                            </span>
                          </div>
                        </td>
                        <td className="px-8 py-5 align-middle">
                          {request.provider ? (
                            <div className="flex items-center gap-3 group">
                              <div className="h-10 w-10 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-600 font-black text-sm uppercase shadow-inner group-hover:scale-110 transition-transform duration-300">
                                {request.provider?.name?.[0] || 'P'}
                              </div>
                              <span className="font-bold text-gray-900 group-hover:text-blue-700 transition-colors uppercase tracking-tight antialiased">
                                {request.provider?.name}
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-3">
                              <div className="h-10 w-10 rounded-2xl bg-gray-50 flex items-center justify-center opacity-40 border-2 border-dashed border-gray-200">
                                ⏳
                              </div>
                              <span className="text-xs font-black text-muted-foreground uppercase tracking-widest opacity-60 italic">
                                Pending Assign
                              </span>
                            </div>
                          )}
                        </td>
                        <td className="px-8 py-5 align-middle text-center">
                          <div className="inline-flex items-center px-4 py-1.5 rounded-2xl text-[11px] font-black bg-gray-100 text-gray-700 border border-gray-200/50 uppercase tracking-widest shadow-sm">
                            {request.quantity}L
                          </div>
                        </td>
                        <td className="px-8 py-5 align-middle text-center">
                          <span className="font-black text-blue-600 text-lg antialiased tracking-tighter">
                            ₹{(request.finalPrice || request.requestedBudget || 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="px-8 py-5 align-middle text-center">
                          <div className="flex justify-center flex-shrink-0 scale-110">
                            <StatusBadge status={hasOpenDispute ? "DISPUTED" : request.status as any} />
                          </div>
                        </td>
                        <td className="px-8 py-5 align-middle text-right min-w-[200px]">
                          <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                            {canCancel && (
                              <CancelRequestButton requestId={request.id} />
                            )}
                            {canReport && (
                              <ReportDisputeButton 
                                requestId={request.id} 
                                providerName={request.provider?.name || "Provider"} 
                              />
                            )}
                            {!canCancel && !canReport && (
                              <span className="text-[10px] uppercase font-black text-gray-300 tracking-widest">
                                {hasOpenDispute ? "Under Review" : "Fixed Entry"}
                              </span>
                            )}
                          </div>
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
