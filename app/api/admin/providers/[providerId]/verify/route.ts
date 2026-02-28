import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import * as z from "zod";

const verifySchema = z.object({
  status: z.enum(["APPROVED", "REJECTED", "SUSPENDED", "PENDING_VERIFICATION"]),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ providerId: string }> }
) {
  try {
    const { providerId } = await params;
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = verifySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const { status } = parsed.data;

    const updatedProfile = await prisma.providerProfile.update({
      where: { userId: providerId },
      data: { verificationStatus: status },
      include: { user: true }
    });

    // Notify provider
    let message = "";
    if (status === "APPROVED") message = "Congratulations! Your provider profile has been approved.";
    if (status === "REJECTED") message = "Your provider profile was rejected. Please contact support.";
    if (status === "SUSPENDED") message = "Your provider account has been suspended.";

    if (message) {
      await prisma.notification.create({
        data: {
          receiverId: providerId,
          message,
          type: "VERIFICATION_UPDATE",
          link: "/dashboard/provider/profile",
        } as any
      });
    }

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
