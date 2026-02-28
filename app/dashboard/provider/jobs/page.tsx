import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/ui/status-badge";
import { JobActionMenu } from "@/components/JobActionMenu";

export default async function ProviderJobsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const jobs = await prisma.waterRequest.findMany({
    where: { providerId: session.user.id },
    include: { 
      customer: true,
      disputes: true
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Active Jobs</h1>
        <p className="text-muted-foreground">Manage your assigned and completed water delivery requests.</p>
      </div>

      <Card className="border-none shadow-xl bg-white/80 backdrop-blur-xl overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-blue-50/50 to-transparent border-b border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl">Job History</CardTitle>
              <CardDescription>A complete list of your assigned and delivered water requests.</CardDescription>
            </div>
            <div className="bg-blue-600/5 text-blue-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider border border-blue-600/10">
              {jobs.length} Total Jobs
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center space-y-3 p-12 text-center">
              <div className="h-16 w-16 bg-gray-50 rounded-full flex items-center justify-center mb-2">
                <p className="text-2xl opacity-20 text-gray-400 font-bold tracking-tighter uppercase whitespace-pre-wrap leading-tight text-center">Empty</p>
              </div>
              <p className="text-sm text-muted-foreground font-medium">You don't have any jobs assigned yet.</p>
            </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50/50 border-b border-gray-100">
                    <th className="h-12 px-6 text-left align-middle font-bold text-gray-500 uppercase tracking-wider text-[11px]">Date</th>
                    <th className="h-12 px-6 text-left align-middle font-bold text-gray-500 uppercase tracking-wider text-[11px]">Customer</th>
                    <th className="h-12 px-6 text-center align-middle font-bold text-gray-500 uppercase tracking-wider text-[11px]">Quantity</th>
                    <th className="h-12 px-6 text-center align-middle font-bold text-gray-500 uppercase tracking-wider text-[11px]">Earning</th>
                    <th className="h-12 px-6 text-center align-middle font-bold text-gray-500 uppercase tracking-wider text-[11px]">Status</th>
                    <th className="h-12 px-6 text-right align-middle font-bold text-gray-500 uppercase tracking-wider text-[11px]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {jobs.map((job) => (
                    <tr 
                      key={job.id} 
                      className="group transition-all hover:bg-blue-50/30 cursor-default"
                    >
                      <td className="px-6 py-4 align-middle whitespace-nowrap">
                        <div className="flex flex-col">
                          <span className="font-semibold text-gray-900 leading-none">
                            {new Date(job.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </span>
                          <span className="text-[10px] text-muted-foreground mt-1 uppercase font-bold tracking-tighter">
                            {new Date(job.createdAt).getFullYear()}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-black text-xs uppercase shadow-inner">
                            {job.customer?.name?.[0] || 'C'}
                          </div>
                          <span className="font-bold text-gray-800">{job.customer?.name || "Unknown"}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle text-center">
                        <div className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200 uppercase tracking-tight">
                          {job.quantity}L
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle text-center">
                        <span className="font-black text-blue-600 text-base">
                          ₹{(job.finalPrice || job.requestedBudget || 0).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 align-middle text-center">
                        <div className="flex justify-center">
                          <StatusBadge status={job.disputes.some(d => d.status === "OPEN") ? "DISPUTED" : job.status as any} />
                        </div>
                      </td>
                      <td className="px-6 py-4 align-middle text-right">
                        <div className="flex justify-end min-w-[100px]">
                          {!job.disputes.some(d => d.status === "OPEN") ? (
                            <JobActionMenu jobId={job.id} currentStatus={job.status} />
                          ) : (
                            <span className="text-[10px] font-black uppercase text-red-500 tracking-widest italic py-2">Job Locked</span>
                          ) }
                        </div>
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
