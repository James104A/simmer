import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { hasPartnership } from "@/lib/partner";
import { sendPushToUser } from "@/lib/push";

// GET /api/partner — Get current partner info
export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const partnership = await prisma.partnership.findFirst({
    where: {
      status: "accepted",
      OR: [{ senderId: user.id }, { receiverId: user.id }],
    },
    include: {
      sender: { select: { id: true, name: true, email: true } },
      receiver: { select: { id: true, name: true, email: true } },
    },
  });

  if (!partnership) {
    return NextResponse.json(null);
  }

  const partner =
    partnership.senderId === user.id
      ? partnership.receiver
      : partnership.sender;

  return NextResponse.json({
    id: partnership.id,
    partner,
    createdAt: partnership.createdAt,
  });
}

// POST /api/partner — Send partner invite
export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { email } = await request.json();
  if (!email) {
    return NextResponse.json(
      { error: "Email is required" },
      { status: 400 }
    );
  }

  // Check current user doesn't already have a partnership
  if (await hasPartnership(user.id)) {
    return NextResponse.json(
      { error: "You already have a partner or pending invite" },
      { status: 400 }
    );
  }

  // Find target user
  const target = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
  });
  if (!target) {
    return NextResponse.json(
      { error: "No user found with that email" },
      { status: 404 }
    );
  }
  if (target.id === user.id) {
    return NextResponse.json(
      { error: "You can't partner with yourself" },
      { status: 400 }
    );
  }

  // Check target doesn't already have a partnership
  if (await hasPartnership(target.id)) {
    return NextResponse.json(
      { error: "That user already has a partner or pending invite" },
      { status: 400 }
    );
  }

  const partnership = await prisma.partnership.create({
    data: {
      senderId: user.id,
      receiverId: target.id,
      status: "pending",
    },
  });

  void sendPushToUser(target.id, {
    title: "Partner invitation",
    body: `${user.name} invited you to share a cookbook`,
    data: { type: "partner_invite", senderId: user.id },
  });

  return NextResponse.json(partnership, { status: 201 });
}

// DELETE /api/partner — Unlink from partner
export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const partnership = await prisma.partnership.findFirst({
    where: {
      status: { in: ["pending", "accepted"] },
      OR: [{ senderId: user.id }, { receiverId: user.id }],
    },
  });

  if (!partnership) {
    return NextResponse.json(
      { error: "No partnership found" },
      { status: 404 }
    );
  }

  await prisma.partnership.delete({ where: { id: partnership.id } });

  return NextResponse.json({ success: true });
}
