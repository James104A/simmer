import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getFriendIds } from "@/lib/friends";
import { NavBar } from "@/components/nav-bar";
import { FeedList } from "@/components/feed-list";

export const dynamic = "force-dynamic";

export default async function FeedPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const [pendingCount, friendIds] = await Promise.all([
    prisma.friendRequest.count({
      where: { receiverId: user.id, status: "pending" },
    }),
    getFriendIds(user.id),
  ]);

  const feedUserIds = [user.id, ...friendIds];

  const events = await prisma.feedEvent.findMany({
    where: { userId: { in: feedUserIds } },
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

  // Get user's saved recipe IDs for marking saved state
  const savedRecipeIds = new Set(
    (
      await prisma.savedRecipe.findMany({
        where: { userId: user.id },
        select: { recipeId: true },
      })
    ).map((s) => s.recipeId)
  );

  const feedItems = events.map((event) => {
    const parsedMeta = event.metadata ? JSON.parse(event.metadata) : {};
    return {
      id: event.id,
      eventType: event.eventType,
      createdAt: event.createdAt.toISOString(),
      notes: parsedMeta.notes ?? null,
      metadata: event.metadata,
      user: event.user,
      recipe: event.recipe,
      isSaved: event.recipe ? savedRecipeIds.has(event.recipe.id) : false,
    };
  });

  return (
    <main className="min-h-screen">
      <NavBar
        user={{ id: user.id, name: user.name }}
        pendingRequestCount={pendingCount}
      />
      <div className="mx-auto max-w-2xl px-6 py-8">
        <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold tracking-tight text-foreground">
          Feed
        </h2>
        <p className="mt-1 text-sm text-foreground-muted">
          See what your friends have been up to
        </p>
        <div className="mt-8">
          <FeedList items={feedItems} />
        </div>
      </div>
    </main>
  );
}
