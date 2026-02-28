import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { DollarSign, TrendingUp } from "lucide-react";

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

  const totalEarnings = completedJobs.reduce((sum, job) => sum + (job.finalPrice || 0), 0);
  const totalCommission = completedJobs.reduce((sum, job) => sum + (job.commissionAmount || 0), 0);
  const netEarnings = totalEarnings - totalCommission;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Earnings</h1>
        <p className="text-muted-foreground">Track your revenue and completed transactions.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Gross Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Total revenue before commission</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Platform Fees</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">${totalCommission.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Commission deducted</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Net Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${netEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">Your take-home amount</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Earning History</CardTitle>
          <CardDescription>Breakdown of earnings from completed jobs.</CardDescription>
        </CardHeader>
        <CardContent>
          {completedJobs.length === 0 ? (
            <div className="flex flex-col items-center justify-center space-y-3 rounded-lg border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">You haven't completed any jobs yet to earn revenue.</p>
            </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Job Details</th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Amount</th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Fee</th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Net</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {completedJobs.map((job) => (
                    <tr key={job.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-4 align-middle">{new Date(job.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 align-middle">
                        {job.quantity}L to {job.customer?.name || "Customer"}
                      </td>
                      <td className="p-4 align-middle text-right font-medium">${job.finalPrice?.toFixed(2) || "0.00"}</td>
                      <td className="p-4 align-middle text-right text-red-500">-${job.commissionAmount?.toFixed(2) || "0.00"}</td>
                      <td className="p-4 align-middle text-right text-green-600 font-bold">
                        ${((job.finalPrice || 0) - (job.commissionAmount || 0)).toFixed(2)}
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
