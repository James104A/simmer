import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { sendPushToUser } from "@/lib/push";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// PATCH /api/friends/requests/:id — Accept or decline a friend request
export async function PATCH(request: NextRequest, context: RouteContext) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const { action } = await request.json();

  if (action !== "accept" && action !== "decline") {
    return NextResponse.json(
      { error: "Action must be 'accept' or 'decline'" },
      { status: 400 }
    );
  }

  const friendRequest = await prisma.friendRequest.findUnique({
    where: { id },
  });

  if (!friendRequest || friendRequest.receiverId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (friendRequest.status !== "pending") {
    return NextResponse.json(
      { error: "Request already handled" },
      { status: 409 }
    );
  }

  const updated = await prisma.friendRequest.update({
    where: { id },
    data: { status: action === "accept" ? "accepted" : "declined" },
  });

  if (action === "accept") {
    void sendPushToUser(friendRequest.senderId, {
      title: "Friend request accepted",
      body: `${user.name} accepted your friend request`,
      data: { type: "friend_accept", userId: user.id },
    });
  }

  return NextResponse.json(updated);
}
