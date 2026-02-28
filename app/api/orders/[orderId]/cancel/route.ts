// app/api/orders/[orderId]/cancel/route.ts

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { cancelOrder } from "@/services/orderService";
import * as z from "zod";

// Validate orderId (CUID format)
const idSchema = z.string().cuid();

export async function POST(request: Request, { params }: { params: { orderId: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || session.user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const validation = idSchema.safeParse(params.orderId);
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid order ID" }, { status: 400 });
    }

    await cancelOrder(params.orderId, session.user.id);
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    if (error.message === "Order not found" || error.message.startsWith("Cancellation")) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
