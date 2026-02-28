import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  { params }: { params: { disputeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const { status, resolutionNote } = await request.json(); // status could be 'RESOLVED' or 'REJECTED'
    if (!status || !['RESOLVED', 'REJECTED'].includes(status)) {
        return new NextResponse("Invalid status provided", { status: 400 });
    }

    const { disputeId } = params;

    const dispute = await prisma.dispute.findUnique({
      where: { id: disputeId },
      include: { 
        waterRequest: true,
        raisedBy: true
      },
    });

    if (!dispute) {
      return new NextResponse("Dispute not found", { status: 404 });
    }

    // Update the dispute status
    const updatedDispute = await prisma.dispute.update({
      where: { id: disputeId },
      data: { 
        status: status as any,
        // We could also add a resolutionNote to the Dispute model if it existed,
        // but for now we just status change.
      }
    });

    // Notify the user who raised it
    await prisma.notification.create({
        data: {
            receiverId: dispute.raisedById,
            message: `Your dispute for order #${dispute.waterRequestId.slice(-4)} has been ${status.toLowerCase()}. ${resolutionNote || ""}`,
            type: "DISPUTE_UPDATE",
            link: "/dashboard/user/requests"
        } as any
    });

    // Notify the other party
    const otherPartyId = dispute.raisedById === dispute.waterRequest.customerId ? dispute.waterRequest.providerId : dispute.waterRequest.customerId;
    if (otherPartyId) {
        await prisma.notification.create({
            data: {
                receiverId: otherPartyId,
                message: `The dispute on order #${dispute.waterRequestId.slice(-4)} has been closed by admin as ${status.toLowerCase()}.`,
                type: "DISPUTE_UPDATE",
                link: `/dashboard`
            } as any
        });
    }

    return NextResponse.json(updatedDispute);
  } catch (error) {
    console.error("[DISPUTE_RESOLVE_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
