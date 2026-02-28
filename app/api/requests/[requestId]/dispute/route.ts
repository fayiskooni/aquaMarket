import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { requestId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { reason } = await request.json();
    if (!reason) {
      return new NextResponse("Reason is required", { status: 400 });
    }

    const { requestId } = params;

    // Verify request exists and belongs to the user or involves the user's provider
    const waterRequest = await prisma.waterRequest.findUnique({
      where: { id: requestId },
      select: { 
        id: true, 
        customerId: true, 
        providerId: true,
        quantity: true
      },
    });

    if (!waterRequest) {
      return new NextResponse("Water request not found", { status: 404 });
    }

    // Only allow users who are involved in the request to raise a dispute
    if (waterRequest.customerId !== session.user.id && waterRequest.providerId !== session.user.id) {
        return new NextResponse("Unauthorized", { status: 403 });
    }

    // Create the dispute
    const dispute = await prisma.dispute.create({
      data: {
        waterRequestId: requestId,
        raisedById: session.user.id,
        reason,
        status: "OPEN",
      },
      include: {
        waterRequest: {
          include: {
            provider: true,
            customer: true
          }
        }
      }
    });

    // Notify the other party
    const recipientId = session.user.id === waterRequest.customerId ? waterRequest.providerId : waterRequest.customerId;
    if (recipientId) {
        await prisma.notification.create({
            data: {
                receiverId: recipientId,
                message: `A dispute has been raised for the ${waterRequest.quantity}L request. Reason: ${reason}`,
                type: "DISPUTE_RAISED",
                link: `/dashboard/${session.user.role === 'CUSTOMER' ? 'provider' : 'user'}/requests` // Approximation
            } as any
        });
    }

    // Notify Admins
    const admins = await prisma.user.findMany({ where: { role: 'ADMIN' } });
    for (const admin of admins) {
        await prisma.notification.create({
            data: {
                receiverId: admin.id,
                message: `URGENT: New platform dispute raised for Request #${requestId.slice(-4)}`,
                type: "ADMIN_DISPUTE",
                link: "/dashboard/admin"
            } as any
        });
    }

    return NextResponse.json(dispute);
  } catch (error) {
    console.error("[DISPUTE_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
