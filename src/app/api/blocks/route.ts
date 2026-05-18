import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/blocks — list users the current user has blocked
export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const blocks = await prisma.block.findMany({
    where: { blockerId: user.id },
    include: { blocked: { select: { id: true, name: true, email: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(blocks);
}

// POST /api/blocks — block a user
export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { userId } = await request.json();
  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }
  if (userId === user.id) {
    return NextResponse.json(
      { error: "Cannot block yourself" },
      { status: 400 }
    );
  }

  const block = await prisma.block.upsert({
    where: {
      blockerId_blockedId: { blockerId: user.id, blockedId: userId },
    },
    update: {},
    create: { blockerId: user.id, blockedId: userId },
  });

  // Blocking implies tearing down any friendship/partnership
  await prisma.friendRequest.deleteMany({
    where: {
      OR: [
        { senderId: user.id, receiverId: userId },
        { senderId: userId, receiverId: user.id },
      ],
    },
  });
  await prisma.partnership.deleteMany({
    where: {
      OR: [
        { senderId: user.id, receiverId: userId },
        { senderId: userId, receiverId: user.id },
      ],
    },
  });

  return NextResponse.json(block, { status: 201 });
}

// DELETE /api/blocks?userId=... — unblock
export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = request.nextUrl.searchParams.get("userId");
  if (!userId) {
    return NextResponse.json({ error: "userId is required" }, { status: 400 });
  }

  await prisma.block.deleteMany({
    where: { blockerId: user.id, blockedId: userId },
  });

  return NextResponse.json({ success: true });
}
