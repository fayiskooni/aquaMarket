import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import * as z from "zod";

const requestSchema = z.object({
  providerId: z.string().optional(),
  quantity: z.number().positive(),
  requestedBudget: z.number().positive(),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const newRequest = await prisma.waterRequest.create({
      data: {
        customerId: session.user.id,
        providerId: parsed.data.providerId || null,
        quantity: parsed.data.quantity,
        requestedBudget: parsed.data.requestedBudget,
        status: parsed.data.providerId ? "ASSIGNED" : "CREATED",
      },
    });

    // We rely on the client to emit the socket.io event after a successful response
    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = session.user.role;
    let requests = [];

    if (role === "CUSTOMER") {
      requests = await prisma.waterRequest.findMany({
        where: { customerId: session.user.id },
        include: { provider: true, customer: true },
        orderBy: { createdAt: "desc" },
      });
    } else if (role === "PROVIDER") {
      requests = await prisma.waterRequest.findMany({
        where: { providerId: session.user.id },
        include: { provider: true, customer: true },
        orderBy: { createdAt: "desc" },
      });
    } else if (role === "ADMIN") {
      requests = await prisma.waterRequest.findMany({
        include: { provider: true, customer: true },
        orderBy: { createdAt: "desc" },
      });
    }

    return NextResponse.json(requests);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
