import { prisma } from "./prisma";

/** Returns an array of user IDs that are accepted friends of the given user. */
export async function getFriendIds(userId: string): Promise<string[]> {
  const requests = await prisma.friendRequest.findMany({
    where: {
      status: "accepted",
      OR: [{ senderId: userId }, { receiverId: userId }],
    },
    select: { senderId: true, receiverId: true },
  });

  return requests.map((r) =>
    r.senderId === userId ? r.receiverId : r.senderId
  );
}
