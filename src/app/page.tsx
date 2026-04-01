import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getPartnerId } from "@/lib/partner";
import { RecipeLibrary } from "@/components/recipe-library";
import { NavBar } from "@/components/nav-bar";
import { OnboardingModal } from "@/components/onboarding-modal";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [pendingCount, partnerId] = await Promise.all([
    prisma.friendRequest.count({
      where: { receiverId: user.id, status: "pending" },
    }),
    getPartnerId(user.id),
  ]);

  const ownerIds = partnerId ? [user.id, partnerId] : [user.id];

  const [recipes, savedRecipes] = await Promise.all([
    prisma.recipe.findMany({
      where: { userId: { in: ownerIds } },
      include: { user: { select: { id: true, name: true } } },
      orderBy: [{ isFavorite: "desc" }, { createdAt: "desc" }],
    }),
    prisma.savedRecipe.findMany({
      where: { userId: user.id },
      include: {
        recipe: {
          include: { user: { select: { id: true, name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  return (
    <main className="min-h-screen">
      {!user.hasSeenOnboarding && (
        <OnboardingModal userName={user.name} />
      )}
      <NavBar
        user={{ id: user.id, name: user.name }}
        pendingRequestCount={pendingCount}
      />
      <div className="mx-auto max-w-7xl px-6 py-8">
        <RecipeLibrary
          initialRecipes={recipes}
          currentUserId={user.id}
          savedRecipes={savedRecipes.map((s) => ({
            ...s.recipe,
            savedByUser: true,
            ownerName: s.recipe.user.name,
          }))}
        />
      </div>
    </main>
  );
}
