import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getFriendIds } from "@/lib/friends";
import { getPartnerId } from "@/lib/partner";

interface RouteContext {
  params: Promise<{ id: string }>;
}

// GET /api/recipes/:id — Get a single recipe (own, partner's, friend's, or saved)
export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const user = await getCurrentUser();

  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: { user: { select: { id: true, name: true } } },
  });

  if (!recipe) {
    return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
  }

  // Check access for non-owner
  if (user && recipe.userId !== user.id) {
    const partnerId = await getPartnerId(user.id);
    const isPartner = partnerId === recipe.userId;

    if (!isPartner) {
      const friendIds = await getFriendIds(user.id);
      const isFriend = friendIds.includes(recipe.userId);
      const isSaved = await prisma.savedRecipe.findUnique({
        where: { userId_recipeId: { userId: user.id, recipeId: id } },
      });

      if (!isFriend && !isSaved) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }

      // Hide personal notes for non-owner/non-partner
      recipe.personalNotes = null;
    }
    // Partners can see personal notes (shared vault)
  }

  return NextResponse.json(recipe);
}

// PATCH /api/recipes/:id — Update a recipe (owner or partner)
export async function PATCH(request: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = await prisma.recipe.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const partnerId = await getPartnerId(user.id);
  const isOwnerOrPartner =
    existing.userId === user.id || existing.userId === partnerId;
  if (!isOwnerOrPartner) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json();
  const recipe = await prisma.recipe.update({
    where: { id },
    data: body,
  });

  return NextResponse.json(recipe);
}

// DELETE /api/recipes/:id — Delete a recipe (owner or partner)
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const existing = await prisma.recipe.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const partnerId = await getPartnerId(user.id);
  const isOwnerOrPartner =
    existing.userId === user.id || existing.userId === partnerId;
  if (!isOwnerOrPartner) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.recipe.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
