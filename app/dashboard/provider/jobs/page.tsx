import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/ui/status-badge";

export default async function ProviderJobsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const jobs = await prisma.waterRequest.findMany({
    where: { providerId: session.user.id },
    include: { customer: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Active Jobs</h1>
        <p className="text-muted-foreground">Manage your assigned and completed water delivery requests.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job History</CardTitle>
          <CardDescription>A complete list of your assigned jobs.</CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center space-y-3 rounded-lg border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">You don't have any jobs assigned yet.</p>
            </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Customer</th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Quantity (L)</th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Earning</th>
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {jobs.map((job) => (
                    <tr key={job.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-4 align-middle">{new Date(job.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 align-middle">{job.customer?.name || "Unknown"}</td>
                      <td className="p-4 align-middle text-right font-medium">{job.quantity}L</td>
                      <td className="p-4 align-middle text-right">${job.finalPrice || job.requestedBudget}</td>
                      <td className="p-4 align-middle">
                        <StatusBadge status={job.status} />
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
