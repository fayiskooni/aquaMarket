// app/api/ratings/[requestId]/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { createRating } from "@/services/ratingService";
import * as z from "zod";

// Validate requestId (CUID) and rating payload
const idSchema = z.string().cuid();
const ratingSchema = z.object({
  rating: z.number().int().min(1).max(5),
  review: z.string().optional(),
});

export async function POST(request: Request, { params }: { params: { requestId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const idValidation = idSchema.safeParse(params.requestId);
    if (!idValidation.success) {
      return NextResponse.json({ error: "Invalid request ID" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = ratingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    await createRating(params.requestId, session.user.id, parsed.data.rating, parsed.data.review);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    if (error.message && (error.message.includes("Request not found") || error.message.includes("Can only rate completed"))) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
