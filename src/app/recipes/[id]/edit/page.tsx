import { notFound, redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth";
import { getPartnerId } from "@/lib/partner";
import { NavBar } from "@/components/nav-bar";
import { RecipeForm } from "@/components/recipe-form";

export const dynamic = "force-dynamic";

interface EditRecipePageProps {
  params: Promise<{ id: string }>;
}

export default async function EditRecipePage({ params }: EditRecipePageProps) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const recipe = await prisma.recipe.findUnique({ where: { id } });
  if (!recipe) notFound();

  const partnerId = await getPartnerId(user.id);
  const canEdit = recipe.userId === user.id || recipe.userId === partnerId;
  if (!canEdit) {
    notFound();
  }

  return (
    <main className="min-h-screen">
      <NavBar user={{ id: user.id, name: user.name }} />
      <div className="mx-auto max-w-3xl px-6 py-8">
        <a
          href={`/recipes/${id}`}
          className="text-sm text-accent-amber hover:text-accent-amber-light"
        >
          &larr; Back to Recipe
        </a>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-bold text-foreground">
          Edit Recipe
        </h1>
        <div className="mt-6">
          <RecipeForm recipe={recipe} />
        </div>
      </div>
    </main>
  );
}
