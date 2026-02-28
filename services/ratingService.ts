// services/ratingService.ts

import { prisma } from "@/lib/prisma";
import { Rating } from "@prisma/client";

/**
 * Create a rating for a completed water request.
 * Updates ProviderProfile.ratingAverage and totalRatings atomically.
 */
export async function createRating(
  requestId: string,
  customerId: string,
  ratingValue: number,
  review?: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // Verify the request exists, is completed, and belongs to the customer
    const request = await tx.waterRequest.findUnique({
      where: { id: requestId },
      select: { status: true, customerId: true, providerId: true },
    });
    if (!request) {
      throw new Error("Request not found");
    }
    if (request.status !== "COMPLETED") {
      throw new Error("Can only rate completed orders");
    }
    if (request.customerId !== customerId) {
      throw new Error("Unauthorized: not the owner of the request");
    }
    if (!request.providerId) {
      throw new Error("Provider not associated with request");
    }

    // Create rating record
    await tx.rating.create({
      data: {
        waterRequestId: requestId,
        customerId,
        providerId: request.providerId,
        rating: ratingValue,
        review,
      },
    });

    // Recalculate provider's average rating and total count
    const agg = await tx.rating.aggregate({
      where: { providerId: request.providerId },
      _avg: { rating: true },
      _count: { rating: true },
    });
    const newAvg = agg._avg.rating ?? 0;
    const newCount = agg._count.rating ?? 0;

    await tx.providerProfile.update({
      where: { userId: request.providerId },
      data: {
        ratingAverage: newAvg,
        totalRatings: newCount,
      },
    });
  });
}
