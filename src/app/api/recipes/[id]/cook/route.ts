import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/recipes/:id/cook — Get cook history for current user
export async function GET(_request: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  const logs = await prisma.cookLog.findMany({
    where: { recipeId: id, userId: user.id },
    orderBy: { cookedAt: "desc" },
  });

  return NextResponse.json(logs);
}

// POST /api/recipes/:id/cook — Log a cook
export async function POST(request: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const cookedAt = body.cookedAt ? new Date(body.cookedAt) : new Date();
  const notes = body.notes?.trim() || null;
  const favorite = body.favorite === true;

  const recipeUpdate: Record<string, unknown> = {
    cookCount: { increment: 1 },
    lastCookedAt: cookedAt,
  };
  if (favorite) {
    recipeUpdate.isFavorite = true;
  }

  const [cookLog] = await prisma.$transaction([
    prisma.cookLog.create({
      data: { recipeId: id, userId: user.id, cookedAt, notes },
    }),
    prisma.recipe.update({
      where: { id },
      data: recipeUpdate,
    }),
    prisma.feedEvent.create({
      data: {
        userId: user.id,
        eventType: favorite ? "cook_favorite" : "cook",
        recipeId: id,
        metadata: JSON.stringify({ notes, cookedAt: cookedAt.toISOString(), favorite }),
      },
    }),
  ]);

  return NextResponse.json(cookLog, { status: 201 });
}

// DELETE /api/recipes/:id/cook — Remove a cook log entry (own only)
export async function DELETE(request: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const { logId } = await request.json();

  // Verify ownership
  const log = await prisma.cookLog.findUnique({ where: { id: logId } });
  if (!log || log.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.$transaction(async (tx) => {
    await tx.cookLog.delete({ where: { id: logId } });

    const remaining = await tx.cookLog.findFirst({
      where: { recipeId: id },
      orderBy: { cookedAt: "desc" },
    });

    await tx.recipe.update({
      where: { id },
      data: {
        cookCount: { decrement: 1 },
        lastCookedAt: remaining?.cookedAt ?? null,
      },
    });
  });

  return NextResponse.json({ success: true });
}
