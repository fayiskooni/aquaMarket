import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { RequestStatus } from "@prisma/client";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ requestId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { requestId } = await params;

    // Verify order exists and belongs to customer, and is NOT out for delivery
    const request = await prisma.waterRequest.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }

    if (request.customerId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Cancellation check: only if status is before IN_TRANSIT
    const nonCancellableStatuses: RequestStatus[] = [
      RequestStatus.IN_TRANSIT,
      RequestStatus.DELIVERED,
      RequestStatus.COMPLETED,
      RequestStatus.CANCELLED,
    ];

    if (nonCancellableStatuses.includes(request.status)) {
      return NextResponse.json({ 
        error: "Request cannot be cancelled at this stage." 
      }, { status: 400 });
    }

    const cancelledRequest = await prisma.waterRequest.update({
      where: { id: requestId },
      data: { status: RequestStatus.CANCELLED },
    });

    // Notify provider if any was assigned
    if (request.providerId) {
      await prisma.notification.create({
        data: {
          receiverId: request.providerId,
          message: `The water request from ${session.user.name} has been cancelled.`,
          type: "REQUEST_CANCELLED",
          link: "/dashboard/provider/jobs",
        } as any
      });
    }

    return NextResponse.json(cancelledRequest);
  } catch (error) {
    console.error("Cancellation error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
