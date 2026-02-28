import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { StatusBadge } from "@/components/ui/status-badge";

export default async function ProviderProfilePage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: { providerProfile: true }
  });

  if (!user || user.role !== "PROVIDER") {
    redirect("/dashboard");
  }

  const profile = user.providerProfile;

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile Settings</h1>
        <p className="text-muted-foreground">Manage your provider profile and availability.</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your contact details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Full Name</p>
              <p className="font-medium">{user.name || "Not provided"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Email Address</p>
              <p className="font-medium">{user.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Phone Number</p>
              <p className="font-medium">{user.phone || "Not provided"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Join Date</p>
              <p className="font-medium">{new Date(user.createdAt).toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Provider Details</CardTitle>
            <CardDescription>Your business information on the platform.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Verification Status</p>
              <div className="mt-1">
                <StatusBadge status={profile?.verificationStatus || "PENDING_VERIFICATION"} />
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Base Price (Per Liter)</p>
              <p className="font-medium">${profile?.pricePerLiter?.toFixed(2) || "0.00"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Service Location</p>
              <p className="font-medium">{profile?.location || "Not specified"}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground">Performance Rating</p>
              <p className="font-medium flex items-center gap-1">
                ⭐ {profile?.ratingAverage?.toFixed(1) || "0.0"} ({profile?.totalRatings || 0} reviews)
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
