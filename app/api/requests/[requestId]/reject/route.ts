import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { rejectRequest } from "@/services/requestService";
import * as z from "zod";

const idSchema = z.string().cuid();

export async function POST(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  try {
    const { requestId } = await params;
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "PROVIDER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const validation = idSchema.safeParse(requestId);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid request ID" }, { status: 400 });
    }

    await rejectRequest(requestId, session.user.id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
