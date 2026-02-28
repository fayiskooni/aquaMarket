import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import * as z from "zod";

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  phone: z.string().optional(),
  role: z.enum(["CUSTOMER", "PROVIDER", "ADMIN"]),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data provided" }, { status: 400 });
    }

    const { name, email, password, phone, role } = parsed.data;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone,
        role,
      },
    });

    // If role is provider, initialize an empty profile
    if (role === "PROVIDER") {
      await prisma.providerProfile.create({
        data: {
          userId: user.id,
          pricePerLiter: 0,
          location: "Not set",
        },
      });

      // Notify all admins
      const admins = await prisma.user.findMany({
        where: { role: "ADMIN" }
      });

      for (const admin of admins) {
        await prisma.notification.create({
          data: {
            receiverId: admin.id,
            message: `New provider registration: ${name}. Click to verify.`,
            type: "NEW_SIGNUP",
            link: "/dashboard/admin/providers",
          } as any
        });
      }

      // Notify the provider
      await prisma.notification.create({
        data: {
          receiverId: user.id,
          message: `Welcome ${name}! Your profile is pending admin verification.`,
          type: "WELCOME_PROVIDER",
          link: "/dashboard/provider/profile",
        } as any
      });
    }

    return NextResponse.json(
      { message: "User created successfully", user: { id: user.id, email: user.email } },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
