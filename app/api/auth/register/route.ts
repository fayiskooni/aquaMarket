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

      if (admins.length > 0) {
        await prisma.notification.createMany({
          data: admins.map(admin => ({
            receiverId: admin.id,
            message: `New provider signup: ${name}. Pending verification.`,
            type: "NEW_SIGNUP",
            link: "/dashboard/admin/providers",
          })) as any
        });
      }
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
