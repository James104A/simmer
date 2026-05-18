import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { sendPushToUser } from "@/lib/push";

// GET /api/friends — List accepted friends
export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requests = await prisma.friendRequest.findMany({
    where: {
      status: "accepted",
      OR: [{ senderId: user.id }, { receiverId: user.id }],
    },
    include: {
      sender: { select: { id: true, name: true, email: true } },
      receiver: { select: { id: true, name: true, email: true } },
    },
  });

  const friends = requests.map((r) =>
    r.senderId === user.id ? r.receiver : r.sender
  );

  return NextResponse.json(friends);
}

// POST /api/friends — Send a friend request
export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email } = await request.json();
  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { email } });
  if (!target) {
    return NextResponse.json(
      { error: "No user found with that email" },
      { status: 404 }
    );
  }

  if (target.id === user.id) {
    return NextResponse.json(
      { error: "You can't add yourself" },
      { status: 400 }
    );
  }

  // Check for existing request in either direction
  const existing = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { senderId: user.id, receiverId: target.id },
        { senderId: target.id, receiverId: user.id },
      ],
    },
  });

  if (existing) {
    if (existing.status === "accepted") {
      return NextResponse.json(
        { error: "You're already friends" },
        { status: 409 }
      );
    }
    if (existing.status === "pending") {
      return NextResponse.json(
        { error: "Friend request already pending" },
        { status: 409 }
      );
    }
    // If declined, allow re-sending by updating the existing request
    if (existing.status === "declined") {
      const updated = await prisma.friendRequest.update({
        where: { id: existing.id },
        data: { senderId: user.id, receiverId: target.id, status: "pending" },
      });
      return NextResponse.json(updated, { status: 201 });
    }
  }

  const friendRequest = await prisma.friendRequest.create({
    data: {
      senderId: user.id,
      receiverId: target.id,
      status: "pending",
    },
  });

  void sendPushToUser(target.id, {
    title: "New friend request",
    body: `${user.name} wants to add you as a friend`,
    data: { type: "friend_request", senderId: user.id },
  });

  return NextResponse.json(friendRequest, { status: 201 });
}
