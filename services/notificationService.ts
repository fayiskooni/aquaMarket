import { prisma } from "@/lib/prisma";

export async function createNotification({
  receiverId,
  message,
  type,
  link
}: {
  receiverId: string;
  message: string;
  type?: string;
  link?: string;
}) {
  const notification = await prisma.notification.create({
    data: {
      receiverId,
      message,
      type,
      link,
    } as any,
  });

  return notification;
}
