// services/orderService.ts

import { prisma } from "@/lib/prisma";
import { RequestStatus } from "@prisma/client";
import * as z from "zod";

/**
 * Zod schema for allowed status transitions.
 * Adjust as needed to reflect the business rules.
 */
const statusSchema = z.enum([
  "CREATED",
  "ASSIGNED",
  "APPROVED",
  "IN_TRANSIT",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
]);

/**
 * Cancel an order. Only the customer who created the request can cancel,
 * and only if the order has not progressed beyond the water‑filled stage.
 * For this implementation we treat statuses `IN_TRANSIT` and beyond as
 * water‑filled, so cancellation is allowed for `CREATED`, `ASSIGNED`, and `APPROVED`.
 */
export async function cancelOrder(orderId: string, customerId: string): Promise<void> {
  await prisma.$transaction(async (tx) => {
    const request = await tx.waterRequest.findUnique({
      where: { id: orderId },
      select: { status: true, customerId: true },
    });
    if (!request) {
      throw new Error("Order not found");
    }
    if (request.customerId !== customerId) {
      throw new Error("Unauthorized: not the owner of the order");
    }
    // Disallow cancellation after water is filled (treated as IN_TRANSIT or later)
    if (["IN_TRANSIT", "DELIVERED", "COMPLETED", "CANCELLED"].includes(request.status)) {
      throw new Error("Cancellation not allowed at this stage");
    }
    await tx.waterRequest.update({
      where: { id: orderId },
      data: { status: RequestStatus.CANCELLED },
    });
  });
}

/**
 * Advance or change the status of an order.
 * Validates the new status with Zod and ensures logical progression.
 */
export async function updateOrderStatus(orderId: string, newStatus: string): Promise<void> {
  const parsed = statusSchema.safeParse(newStatus);
  if (!parsed.success) {
    throw new Error("Invalid status value");
  }

  await prisma.$transaction(async (tx) => {
    const request = await tx.waterRequest.findUnique({
      where: { id: orderId },
      select: { finalPrice: true, status: true },
    });
    if (!request) {
      throw new Error("Order not found");
    }
    const data: any = { status: parsed.data as RequestStatus };
    if (parsed.data === "COMPLETED") {
      const finalPrice = request.finalPrice ?? 0;
      const commissionRate = Number(process.env.COMMISSION_RATE) || 0.1;
      data.commissionAmount = finalPrice * commissionRate;
    }
    await tx.waterRequest.update({
      where: { id: orderId },
      data,
    });
  });
}
