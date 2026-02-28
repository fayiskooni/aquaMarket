// services/requestService.ts

import { prisma } from "@/lib/prisma";
import { RequestStatus } from "@prisma/client";

/**
 * Provider accepts a water request.
 * This operation must be atomic to avoid race conditions where multiple providers
 * accept the same request. It uses a Prisma transaction with a conditional update.
 */
export async function acceptRequest(
  requestId: string,
  providerUserId: string
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const request = await tx.waterRequest.findUnique({
      where: { id: requestId },
      select: { providerId: true, status: true, customerId: true, quantity: true },
    });

    if (!request) {
      throw new Error("Request not found");
    }
    if (request.providerId) {
      throw new Error("Request already assigned");
    }
    if (request.status !== "CREATED") {
      throw new Error("Request cannot be accepted in its current state");
    }

    const provider = await tx.user.findUnique({
      where: { id: providerUserId },
      include: { providerProfile: true },
    });

    const calculatedPrice = request.quantity * (provider?.providerProfile?.pricePerLiter || 0);

    // Update the request with the provider and change status atomically
    await tx.waterRequest.update({
      where: { id: requestId },
      data: {
        providerId: providerUserId,
        status: RequestStatus.ASSIGNED,
        finalPrice: calculatedPrice,
      },
    });

    // Notify customer
    await tx.notification.create({
      data: {
        receiverId: request.customerId,
        message: `Your request for ${request.quantity}L has been accepted by ${provider?.name || 'a provider'}`,
        type: "REQUEST_ACCEPTED",
        link: "/dashboard/user/requests",
      } as any,
    });

    // Optionally mark provider as unavailable (if you track availability)
    await tx.providerProfile.update({
      where: { userId: providerUserId },
      data: { isAvailable: false },
    });
  });
}

export async function updateRequestStatus(
  requestId: string,
  newStatus: RequestStatus,
  providerUserId: string
): Promise<void> {
  const request = await prisma.waterRequest.findUnique({
    where: { id: requestId },
    include: { customer: true }
  });

  if (!request) throw new Error("Request not found");
  if (request.providerId !== providerUserId) throw new Error("Unauthorized");

  let financialUpdate = {};
  if (newStatus === "COMPLETED") {
    const basePrice = request.finalPrice || request.requestedBudget || 0;
    const commission = basePrice * 0.05; // 5% Admin Commission
    financialUpdate = { 
      commissionAmount: commission,
      finalPrice: basePrice // Ensure finalPrice is never zero if budget exists
    };
  }

  await prisma.waterRequest.update({
    where: { id: requestId },
    data: { 
      status: newStatus,
      ...financialUpdate
    }
  });

  // Notify customer of status change
  let message = "";
  if (newStatus === "IN_TRANSIT") message = "Your water delivery is on the way!";
  if (newStatus === "DELIVERED") message = "Your water has been delivered! Please mark it as completed.";
  if (newStatus === "COMPLETED") message = "Order successfully completed. Thank you!";

  if (message) {
    await prisma.notification.create({
      data: {
        receiverId: request.customerId,
        message,
        type: "STATUS_UPDATE",
        link: "/dashboard/user/requests",
      } as any
    });
  }
}

export async function rejectRequest(
  requestId: string,
  providerUserId: string
): Promise<void> {
  const request = await prisma.waterRequest.findUnique({
    where: { id: requestId },
    select: { providerId: true, customerId: true, quantity: true }
  });

  if (!request) throw new Error("Request not found");
  if (request.providerId !== providerUserId) throw new Error("Unauthorized");

  // Reset to CREATED (Broadcast)
  await prisma.waterRequest.update({
    where: { id: requestId },
    data: {
      providerId: null,
      status: "CREATED"
    }
  });

  // Notify customer
  await prisma.notification.create({
    data: {
      receiverId: request.customerId,
      message: `A provider has declined your direct request for ${request.quantity}L. It is now open for other providers.`,
      type: "REQUEST_REJECTED",
      link: "/dashboard/user/requests",
    } as any
  });
}
