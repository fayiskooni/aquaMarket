import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "PROVIDER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.providerProfile.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          select: { name: true }
        }
      }
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(profile);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "PROVIDER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { pricePerLiter, isAvailable, location } = body;

    // Use findFirst to double check profile exists
    const profile = await prisma.providerProfile.findUnique({
      where: { userId: session.user.id }
    });

    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    const updatedProfile = await prisma.providerProfile.update({
      where: { userId: session.user.id },
      data: {
        ...(typeof pricePerLiter === "number" && !isNaN(pricePerLiter) && { pricePerLiter }),
        ...(typeof isAvailable === "boolean" && { isAvailable }),
        ...(typeof location === "string" && { location }),
      },
    });

    return NextResponse.json({ success: true, profile: updatedProfile });
  } catch (error: any) {
    console.error("Pricing update error:", error);
    return NextResponse.json({ 
      error: "Internal Server Error", 
      details: error?.message || "Unknown error" 
    }, { status: 500 });
  }
}
