import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function UserRequestsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const requests = await prisma.waterRequest.findMany({
    where: { customerId: session.user.id },
    orderBy: { createdAt: 'desc' },
    include: { provider: true },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Requests</h1>
        <p className="text-muted-foreground">View and manage your water delivery requests.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All Requests</CardTitle>
          <CardDescription>A history of all your water supply requests.</CardDescription>
        </CardHeader>
        <CardContent>
          {requests.length === 0 ? (
            <div className="flex flex-col items-center justify-center space-y-3 rounded-lg border border-dashed p-8 text-center">
              <p className="text-sm text-muted-foreground">You haven't made any requests yet.</p>
            </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Provider</th>
                    <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Quantity (L)</th>
                    <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Budget</th>
                    <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Status</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {requests.map((request) => (
                    <tr key={request.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-4 align-middle">{new Date(request.createdAt).toLocaleDateString()}</td>
                      <td className="p-4 align-middle">{request.provider?.name || "Pending Assignment"}</td>
                      <td className="p-4 align-middle text-center font-medium">{request.quantity}L</td>
                      <td className="p-4 align-middle text-center">₹{request.finalPrice || request.requestedBudget}</td>
                      <td className="p-4 align-middle text-center">
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-blue-100 text-blue-800">
                          {request.status}
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
