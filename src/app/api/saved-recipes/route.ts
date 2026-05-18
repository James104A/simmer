import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/saved-recipes — List bookmarked recipes
export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const saved = await prisma.savedRecipe.findMany({
    where: { userId: user.id },
    include: {
      recipe: {
        include: {
          user: { select: { id: true, name: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(saved);
}

// POST /api/saved-recipes — Bookmark a recipe
export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { recipeId } = await request.json();
  if (!recipeId) {
    return NextResponse.json(
      { error: "recipeId is required" },
      { status: 400 }
    );
  }

  // Check recipe exists
  const recipe = await prisma.recipe.findUnique({ where: { id: recipeId } });
  if (!recipe) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  // Prevent saving your own recipe
  if (recipe.userId === user.id) {
    return NextResponse.json(
      { error: "You can't save your own recipe" },
      { status: 400 }
    );
  }

  const saved = await prisma.savedRecipe.upsert({
    where: { userId_recipeId: { userId: user.id, recipeId } },
    create: { userId: user.id, recipeId },
    update: {},
  });

  // Create feed event for save action
  await prisma.feedEvent.create({
    data: {
      userId: user.id,
      eventType: "save_recipe",
      recipeId,
    },
  });

  return NextResponse.json(saved, { status: 201 });
}

// DELETE /api/saved-recipes — Remove a bookmark
export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { recipeId } = await request.json();

  await prisma.savedRecipe.deleteMany({
    where: { userId: user.id, recipeId },
  });

  return NextResponse.json({ success: true });
}
