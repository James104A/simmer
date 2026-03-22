import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getFriendIds } from "@/lib/friends";
import { getPartnerId } from "@/lib/partner";
import { RecipeDetail } from "@/components/recipe-detail";
import { NavBar } from "@/components/nav-bar";

export const dynamic = "force-dynamic";

interface RecipePageProps {
  params: Promise<{ id: string }>;
}

export default async function RecipePage({ params }: RecipePageProps) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const recipe = await prisma.recipe.findUnique({
    where: { id },
    include: {
      cookLogs: {
        where: { userId: user.id },
        orderBy: { cookedAt: "desc" },
      },
      user: { select: { id: true, name: true } },
    },
  });

  if (!recipe) {
    notFound();
  }

  const isOwner = recipe.userId === user.id;
  const partnerId = await getPartnerId(user.id);
  const isPartner = !isOwner && partnerId === recipe.userId;

  // Check access for non-owned, non-partner recipes
  if (!isOwner && !isPartner) {
    const friendIds = await getFriendIds(user.id);
    const isFriend = friendIds.includes(recipe.userId);
    const isSaved = await prisma.savedRecipe.findUnique({
      where: { userId_recipeId: { userId: user.id, recipeId: id } },
    });
    if (!isFriend && !isSaved) {
      notFound();
    }
  }

  const canEdit = isOwner || isPartner;

  // Check if already saved (only for non-owner/non-partner recipes)
  const savedRecipe = !canEdit
    ? await prisma.savedRecipe.findUnique({
        where: { userId_recipeId: { userId: user.id, recipeId: id } },
      })
    : null;

  const pendingCount = await prisma.friendRequest.count({
    where: { receiverId: user.id, status: "pending" },
  });

  return (
    <main className="min-h-screen">
      <NavBar
        user={{ id: user.id, name: user.name }}
        pendingRequestCount={pendingCount}
      />
      <RecipeDetail
        recipe={recipe}
        canEdit={canEdit}
        isOwner={isOwner || isPartner}
        ownerName={recipe.user.name}
        isSaved={!!savedRecipe}
      />
    </main>
  );
}
