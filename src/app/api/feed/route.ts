import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getFriendIds } from "@/lib/friends";

// POST /api/feed — Create a feed event
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { recipeId, eventType } = body;

  if (!recipeId || !eventType) {
    return NextResponse.json({ error: "Missing recipeId or eventType" }, { status: 400 });
  }

  const event = await prisma.feedEvent.create({
    data: {
      userId: user.id,
      eventType,
      recipeId,
    },
  });

  return NextResponse.json(event, { status: 201 });
}

// GET /api/feed — Get activity feed from friends
export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const friendIds = await getFriendIds(user.id);
  const feedUserIds = [user.id, ...friendIds];

  const since = request.nextUrl.searchParams.get("since");
  const where: Record<string, unknown> = {
    userId: { in: feedUserIds },
  };
  if (since) {
    where.createdAt = { gt: new Date(since) };
  }

  const events = await prisma.feedEvent.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      recipe: {
        select: {
          id: true,
          title: true,
          imageUrl: true,
          descriptionShort: true,
          cuisineTypes: true,
          dishTypes: true,
          totalTimeMinutes: true,
          rating: true,
        },
      },
      user: {
        select: { id: true, name: true },
      },
    },
  });

  return NextResponse.json(events);
}
