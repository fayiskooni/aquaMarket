import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { AlertCircle } from "lucide-react";

export default async function AdminDisputesPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const disputes = await prisma.dispute.findMany({
    include: { 
      raisedBy: true,
      waterRequest: true 
    },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Disputes</h1>
        <p className="text-muted-foreground">Manage ongoing and past disputes reported by users.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            All Disputes
          </CardTitle>
          <CardDescription>Review and resolve user complaints.</CardDescription>
        </CardHeader>
        <CardContent>
          {disputes.length === 0 ? (
             <div className="flex flex-col items-center justify-center space-y-3 rounded-lg border border-dashed p-8 text-center">
               <p className="text-sm text-muted-foreground">No disputes have been registered.</p>
             </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Reported On</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Raised By</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Reason</th>
                    <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {disputes.map((dispute) => (
                    <tr key={dispute.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-4 align-middle">{new Date(dispute.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 align-middle font-medium">{dispute.raisedBy?.name || "Unknown"}</td>
                      <td className="p-4 align-middle max-w-[250px] truncate">{dispute.reason}</td>
                      <td className="p-4 align-middle text-center">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          dispute.status === 'OPEN' ? 'bg-red-100 text-red-800' :
                          dispute.status === 'RESOLVED' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                         }`}>
                          {dispute.status}
                        </span>
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
