import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";

// GET /api/recipes — List current user's recipes
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const recipes = await prisma.recipe.findMany({
    where: { userId: user.id },
    orderBy: [{ isFavorite: "desc" }, { createdAt: "desc" }],
  });
  return NextResponse.json(recipes);
}

// POST /api/recipes — Create a new recipe
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const [recipe] = await prisma.$transaction([
    prisma.recipe.create({
      data: {
        userId: user.id,
        title: body.title,
        recipeType: body.recipeType,
        url: body.url ?? null,
        imageUrl: body.imageUrl ?? null,
        descriptionShort: body.descriptionShort ?? null,
        highlights: body.highlights ? JSON.stringify(body.highlights) : null,
        ingredients: body.ingredients ? JSON.stringify(body.ingredients) : null,
        steps: body.steps ? JSON.stringify(body.steps) : null,
        personalNotes: body.personalNotes ?? null,
        seasonTags: body.seasonTags ? JSON.stringify(body.seasonTags) : null,
        dishTypes: body.dishTypes ? JSON.stringify(body.dishTypes) : null,
        cuisineTypes: body.cuisineTypes
          ? JSON.stringify(body.cuisineTypes)
          : null,
        goodForTags: body.goodForTags
          ? JSON.stringify(body.goodForTags)
          : null,
        dietaryTags: body.dietaryTags
          ? JSON.stringify(body.dietaryTags)
          : null,
        mainIngredientTags: body.mainIngredientTags
          ? JSON.stringify(body.mainIngredientTags)
          : null,
        prepTimeMinutes: body.prepTimeMinutes ?? null,
        cookTimeMinutes: body.cookTimeMinutes ?? null,
        totalTimeMinutes: body.totalTimeMinutes ?? null,
        servings: body.servings ?? null,
      },
    }),
  ]);

  // Create feed event outside transaction (recipe.id needed)
  await prisma.feedEvent.create({
    data: {
      userId: user.id,
      eventType: "add_recipe",
      recipeId: recipe.id,
    },
  });

  return NextResponse.json(recipe, { status: 201 });
}
