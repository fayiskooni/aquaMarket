import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { RequestStatus } from "@prisma/client";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "PROVIDER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { jobId } = await params;
    const body = await req.json();
    const { status } = body;

    if (!Object.values(RequestStatus).includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const updatedJob = await prisma.waterRequest.update({
      where: { 
        id: jobId,
        providerId: session.user.id // Ensure provider owns the job
      },
      data: { status },
      include: { customer: true }
    });

    // Notify customer about status update
    await prisma.notification.create({
      data: {
        receiverId: updatedJob.customerId,
        message: `Your water request status has been updated to ${status}.`,
        type: "STATUS_UPDATE",
        link: "/dashboard/user/requests",
      } as any
    });

    return NextResponse.json(updatedJob);
  } catch (error) {
    console.error("Job status update error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
