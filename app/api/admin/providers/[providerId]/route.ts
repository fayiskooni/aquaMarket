// app/api/admin/providers/[providerId]/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { verifyProvider, suspendProvider } from "@/services/providerService";
import * as z from "zod";

// Schema for verification request
const verifySchema = z.object({
  approve: z.boolean(),
});

export async function POST(request: Request, { params }: { params: { providerId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = verifySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { approve } = parsed.data;
    await verifyProvider(params.providerId, approve);
    return NextResponse.json({ success: true, approved: approve }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Optional: admin can suspend a provider via DELETE method
export async function DELETE(request: Request, { params }: { params: { providerId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    await suspendProvider(params.providerId);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
