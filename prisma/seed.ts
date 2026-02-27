import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash("password123", 10);

  // Clean DB
  await prisma.user.deleteMany();

  // 1. Admin
  await prisma.user.create({
    data: {
      email: "admin123@gmail.com",
      name: "System Admin",
      password: await bcrypt.hash("admin123", 10),
      role: "ADMIN",
    },
  });

  // 2. Customer
  await prisma.user.create({
    data: {
      email: "customer@aquamarket.com",
      name: "John Doe",
      password: password,
      role: "CUSTOMER",
    },
  });

  // 3. Provider
  const provider = await prisma.user.create({
    data: {
      email: "provider@aquamarket.com",
      name: "AquaCorp Delivery",
      password: password,
      role: "PROVIDER",
    },
  });

  await prisma.providerProfile.create({
    data: {
      userId: provider.id,
      pricePerLiter: 0.15,
      location: "Downtown",
      isAvailable: true,
      verificationStatus: "APPROVED",
      ratingAverage: 4.9,
      totalRatings: 38,
    },
  });

  console.log("✅ Seed complete! You can now log in via the demo buttons.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
