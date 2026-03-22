import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/partner/requests — Get pending partner invites received
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const requests = await prisma.partnership.findMany({
    where: { receiverId: user.id, status: "pending" },
    include: {
      sender: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(requests);
}

// PATCH /api/partner/requests — Accept or decline a partner invite
export async function PATCH(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { partnershipId, action } = await request.json();
  if (!partnershipId || !["accept", "decline"].includes(action)) {
    return NextResponse.json(
      { error: "partnershipId and action (accept|decline) required" },
      { status: 400 }
    );
  }

  const partnership = await prisma.partnership.findUnique({
    where: { id: partnershipId },
  });

  if (!partnership || partnership.receiverId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (partnership.status !== "pending") {
    return NextResponse.json(
      { error: "Already responded" },
      { status: 400 }
    );
  }

  if (action === "decline") {
    await prisma.partnership.delete({ where: { id: partnershipId } });
    return NextResponse.json({ success: true });
  }

  // Accept
  const updated = await prisma.partnership.update({
    where: { id: partnershipId },
    data: { status: "accepted" },
  });

  return NextResponse.json(updated);
}
