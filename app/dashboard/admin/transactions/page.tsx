import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { FileText } from "lucide-react";

export default async function AdminTransactionsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const transactions = await prisma.waterRequest.findMany({
    where: { status: "COMPLETED" },
    include: { 
      customer: true,
      provider: true 
    },
    orderBy: { updatedAt: 'desc' },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
        <p className="text-muted-foreground">Monitor platform revenue and completed orders.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-500" />
            Completed Orders
          </CardTitle>
          <CardDescription>A complete log of successful transactions.</CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
             <div className="flex flex-col items-center justify-center space-y-3 rounded-lg border border-dashed p-8 text-center">
               <p className="text-sm text-muted-foreground">No completed transactions found.</p>
             </div>
          ) : (
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead className="[&_tr]:border-b">
                  <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Date</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Customer</th>
                    <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Provider</th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Amount</th>
                    <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Platform Fee</th>
                  </tr>
                </thead>
                <tbody className="[&_tr:last-child]:border-0">
                  {transactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                      <td className="p-4 align-middle">{new Date(transaction.updatedAt).toLocaleDateString()}</td>
                      <td className="p-4 align-middle">{transaction.customer?.name || "Unknown"}</td>
                      <td className="p-4 align-middle">{transaction.provider?.name || "Unknown"}</td>
                      <td className="p-4 align-middle text-right font-medium">
                        ${transaction.finalPrice?.toFixed(2) || "0.00"}
                      </td>
                      <td className="p-4 align-middle text-right text-green-600">
                        +${transaction.commissionAmount?.toFixed(2) || "0.00"}
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
