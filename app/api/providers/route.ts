import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== "CUSTOMER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get verified providers only
    const providers = await prisma.user.findMany({
      where: {
        role: "PROVIDER",
        providerProfile: {
          verificationStatus: "APPROVED",
          isAvailable: true,
        },
      },
      include: {
        providerProfile: true,
      },
    });

    return NextResponse.json(providers);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
