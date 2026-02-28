import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import * as z from "zod";

const disputeSchema = z.object({
  requestId: z.string().cuid(),
  reason: z.string().min(5),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = disputeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data provided" }, { status: 400 });
    }

    const { requestId, reason } = parsed.data;

    // Create the dispute
    const dispute = await prisma.dispute.create({
      data: {
        waterRequestId: requestId,
        raisedById: session.user.id,
        reason,
        status: "OPEN",
      },
    });

    // Notify all admins
    const admins = await prisma.user.findMany({
      where: { role: "ADMIN" }
    });

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map(admin => ({
          receiverId: admin.id,
          message: `New dispute raised by ${session.user.name} for Request ${requestId.substring(0,8)}`,
          type: "DISPUTE",
          link: "/dashboard/admin/disputes",
        })) as any
      });
    }

    return NextResponse.json(dispute, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
