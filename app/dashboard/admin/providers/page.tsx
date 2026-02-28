import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/ui/status-badge";
import { Users } from "lucide-react";
import { ProviderReviewActions } from "@/components/Admin/ProviderReviewActions";

export default async function AdminProvidersPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    redirect("/login");
  }

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
                <tr className="border-b transition-colors hover:bg-muted/50">
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Name</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Email</th>
                  <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Joined</th>
                  <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Price / 1000L</th>
                  <th className="h-12 px-4 text-center align-middle font-medium text-muted-foreground">Status</th>
                  <th className="h-12 px-4 text-right align-middle font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0 px-2 lg:px-4">
                {providers.map((provider) => (
                  <tr key={provider.id} className="border-b transition-all duration-200 hover:bg-blue-50/30 group">
                    <td className="p-4 align-middle">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center text-white font-bold text-xs shadow-sm ring-2 ring-white group-hover:scale-105 transition-transform">
                          {provider.name?.[0].toUpperCase() || "P"}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-gray-900 leading-none">{provider.name || "N/A"}</span>
                          <span className="text-[10px] text-muted-foreground mt-1 uppercase tracking-tight font-medium">Provider ID: {provider.id.slice(-6)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-4 align-middle">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-700">{provider.email}</span>
                        <span className="text-xs text-muted-foreground">{provider.phone || "No phone"}</span>
                      </div>
                    </td>
                    <td className="p-4 align-middle text-sm text-gray-600 font-medium">
                      {new Date(provider.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="p-4 align-middle text-center">
                      <div className="inline-flex flex-col items-center">
                        <span className="text-sm font-bold text-blue-700">₹{((provider.providerProfile?.pricePerLiter || 0) * 1000)?.toFixed(2)}</span>
                        <span className="text-[10px] text-gray-400 font-medium">per 1000L</span>
                      </div>
                    </td>
                    <td className="p-4 align-middle text-center">
                      <StatusBadge status={provider.providerProfile?.verificationStatus || "PENDING_VERIFICATION"} />
                    </td>
                    <td className="p-4 align-middle text-right">
                       <ProviderReviewActions provider={{
                         id: provider.id,
                         name: provider.name,
                         email: provider.email,
                         phone: provider.phone,
                         verificationStatus: provider.providerProfile?.verificationStatus || "PENDING_VERIFICATION",
                         location: provider.providerProfile?.location
                       }} />
                    </td>
                  </tr>
                ))}
                {providers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="p-4 text-center text-muted-foreground">
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
