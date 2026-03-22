import { prisma } from "@/lib/prisma";

/**
 * Get the active partner's user ID for a given user, or null if no partner.
 */
export async function getPartnerId(
  userId: string
): Promise<string | null> {
  const partnership = await getPartnership(userId);
  if (!partnership) return null;
  return partnership.senderId === userId
    ? partnership.receiverId
    : partnership.senderId;
}

/**
 * Get the active (accepted) partnership for a user, or null.
 */
export async function getPartnership(userId: string) {
  return prisma.partnership.findFirst({
    where: {
      status: "accepted",
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
  });
}

/**
 * Check if a user has any existing partnership (pending or accepted).
 */
export async function hasPartnership(userId: string) {
  const count = await prisma.partnership.count({
    where: {
      status: { in: ["pending", "accepted"] },
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
  });
  return count > 0;
}
