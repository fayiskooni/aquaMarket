import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/ui/status-badge";
import { Users } from "lucide-react";

export default async function AdminProvidersPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Assuming an extra check here if we strictly enforce Admin roles 
  // if (session.user.role !== "ADMIN") redirect("/dashboard");

  const providers = await prisma.user.findMany({
    where: { role: "PROVIDER" },
    include: { providerProfile: true },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Providers</h1>
        <p className="text-muted-foreground">Manage and verify water delivery providers.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-500" />
            Registered Providers
          </CardTitle>
          <CardDescription>All providers registered on the platform.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative w-full overflow-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="[&_tr]:border-b">
                <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Email</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Joined</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground text-center">Price / L</th>
                  <th className="h-12 px-4 align-middle font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {providers.map((provider) => (
                  <tr key={provider.id} className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                    <td className="p-4 align-middle font-medium">{provider.name || "N/A"}</td>
                    <td className="p-4 align-middle text-muted-foreground">{provider.email}</td>
                    <td className="p-4 align-middle">{new Date(provider.createdAt).toLocaleDateString()}</td>
                    <td className="p-4 align-middle text-center">
                      ${provider.providerProfile?.pricePerLiter?.toFixed(2) || "N/A"}
                    </td>
                    <td className="p-4 align-middle">
                      <StatusBadge status={provider.providerProfile?.verificationStatus || "PENDING_VERIFICATION"} />
                    </td>
                  </tr>
                ))}
                {providers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-muted-foreground">
                      No providers found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
