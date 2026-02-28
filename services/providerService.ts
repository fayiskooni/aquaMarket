// services/providerService.ts

import { prisma } from "@/lib/prisma";
import { VerificationStatus } from "@prisma/client";

/**
 * Verify a provider (approve or reject) and update related user role if needed.
 * This function runs inside a Prisma transaction to ensure atomicity.
 */
export async function verifyProvider(
  providerUserId: string,
  approve: boolean
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Update ProviderProfile verification status
    await tx.providerProfile.update({
      where: { userId: providerUserId },
      data: {
        verificationStatus: approve
          ? VerificationStatus.APPROVED
          : VerificationStatus.REJECTED,
      },
    });

    // Optionally update the User role (keep PROVIDER, but could enforce role)
    await tx.user.update({
      where: { id: providerUserId },
      data: { role: "PROVIDER" },
    });
  });
}

/**
 * Suspend a provider (admin action).
 */
export async function suspendProvider(
  providerUserId: string,
  reason?: string
): Promise<void> {
  await prisma.providerProfile.update({
    where: { userId: providerUserId },
    data: {
      verificationStatus: VerificationStatus.SUSPENDED,
    },
  });
  // Could log suspension reason in a separate table if needed
}

/**
 * Helper to fetch pending providers for admin dashboard.
 */
export async function getPendingProviders(limit = 10) {
  return prisma.providerProfile.findMany({
    where: { verificationStatus: VerificationStatus.PENDING_VERIFICATION },
    include: { user: true },
    take: limit,
  });
}
