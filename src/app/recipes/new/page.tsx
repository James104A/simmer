import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { NavBar } from "@/components/nav-bar";
import { RecipeForm } from "@/components/recipe-form";

export const dynamic = "force-dynamic";

export default async function NewRecipePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <main className="min-h-screen">
      <NavBar user={{ id: user.id, name: user.name }} />
      <div className="mx-auto max-w-3xl px-6 py-8">
        <a
          href="/"
          className="text-sm text-accent-amber hover:text-accent-amber-light"
        >
          &larr; Back to Library
        </a>
        <h1 className="mt-4 font-[family-name:var(--font-display)] text-2xl font-bold text-foreground">
          Add a Recipe
        </h1>
        <div className="mt-6">
          <RecipeForm />
        </div>
      </div>
    </main>
  );
}
