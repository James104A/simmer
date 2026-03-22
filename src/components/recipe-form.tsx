"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Recipe } from "@/generated/prisma/client";
import { RecipeType } from "@/types/recipe";
import {
  SEASON_OPTIONS,
  DISH_TYPE_OPTIONS,
  CUISINE_OPTIONS,
  GOOD_FOR_OPTIONS,
  DIETARY_OPTIONS,
  PROTEIN_OPTIONS,
} from "@/lib/constants";

interface RecipeFormProps {
  recipe?: Recipe;
}

function parseJsonArray(value: string | null | undefined): string[] {
  if (!value) return [];
  try {
    return JSON.parse(value);
  } catch {
    return [];
  }
}

function TagSelector({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onToggle: (tag: string) => void;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground-muted mb-2">
        {label}
      </label>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => onToggle(option)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              selected.includes(option)
                ? "bg-accent-amber text-background"
                : "border border-border text-foreground-muted hover:border-accent-amber/50 hover:text-foreground"
            }`}
          >
            {option}
          </button>
        ))}
      </div>
    </div>
  );
}

export function RecipeForm({ recipe }: RecipeFormProps) {
  const router = useRouter();
  const isEditing = !!recipe;

  const [recipeType, setRecipeType] = useState<RecipeType>(
    (recipe?.recipeType as RecipeType) ?? "native"
  );
  const [url, setUrl] = useState(recipe?.url ?? "");
  const [title, setTitle] = useState(recipe?.title ?? "");
  const [descriptionShort, setDescriptionShort] = useState(
    recipe?.descriptionShort ?? ""
  );
  const [ingredients, setIngredients] = useState(
    parseJsonArray(recipe?.ingredients).join("\n")
  );
  const [steps, setSteps] = useState(
    parseJsonArray(recipe?.steps).join("\n")
  );
  const [personalNotes, setPersonalNotes] = useState(
    recipe?.personalNotes ?? ""
  );
  const [prepTime, setPrepTime] = useState(
    recipe?.prepTimeMinutes?.toString() ?? ""
  );
  const [cookTime, setCookTime] = useState(
    recipe?.cookTimeMinutes?.toString() ?? ""
  );
  const [servings, setServings] = useState(recipe?.servings ?? "");

  const [seasonTags, setSeasonTags] = useState<string[]>(
    parseJsonArray(recipe?.seasonTags)
  );
  const [dishTypes, setDishTypes] = useState<string[]>(
    parseJsonArray(recipe?.dishTypes)
  );
  const [cuisineTypes, setCuisineTypes] = useState<string[]>(
    parseJsonArray(recipe?.cuisineTypes)
  );
  const [goodForTags, setGoodForTags] = useState<string[]>(
    parseJsonArray(recipe?.goodForTags)
  );
  const [dietaryTags, setDietaryTags] = useState<string[]>(
    parseJsonArray(recipe?.dietaryTags)
  );
  const [mainIngredientTags, setMainIngredientTags] = useState<string[]>(
    parseJsonArray(recipe?.mainIngredientTags)
  );

  const [imageUrl, setImageUrl] = useState(recipe?.imageUrl ?? "");
  const [extracting, setExtracting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function toggleTag(
    current: string[],
    setter: (v: string[]) => void,
    tag: string
  ) {
    setter(
      current.includes(tag)
        ? current.filter((t) => t !== tag)
        : [...current, tag]
    );
  }

  async function handleExtractFromUrl() {
    if (!url.trim()) {
      setError("Enter a URL first.");
      return;
    }
    setError("");
    setExtracting(true);

    try {
      const res = await fetch("/api/recipes/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: url.trim() }),
      });

      if (res.status === 401) {
        setError("You must be logged in to extract recipes.");
        return;
      }

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to extract recipe data.");
        return;
      }

      const data = await res.json();

      if (data.title) setTitle(data.title);
      if (data.descriptionShort) setDescriptionShort(data.descriptionShort);
      if (data.ingredients?.length) setIngredients(data.ingredients.join("\n"));
      if (data.steps?.length) setSteps(data.steps.join("\n"));
      if (data.prepTimeMinutes != null) setPrepTime(String(data.prepTimeMinutes));
      if (data.cookTimeMinutes != null) setCookTime(String(data.cookTimeMinutes));
      if (data.servings) setServings(data.servings);
      if (data.imageUrl) setImageUrl(data.imageUrl);
    } catch {
      setError("Something went wrong extracting the recipe.");
    } finally {
      setExtracting(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Title is required.");
      return;
    }
    setError("");
    setSaving(true);

    const prep = prepTime ? parseInt(prepTime, 10) : null;
    const cook = cookTime ? parseInt(cookTime, 10) : null;
    const total =
      prep != null || cook != null ? (prep ?? 0) + (cook ?? 0) : null;

    const body = {
      title: title.trim(),
      recipeType,
      url: recipeType === "linked" ? url.trim() || null : null,
      imageUrl: imageUrl.trim() || null,
      descriptionShort: descriptionShort.trim() || null,
      ingredients: ingredients.trim()
        ? ingredients
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean)
        : null,
      steps: steps.trim()
        ? steps
            .split("\n")
            .map((l) => l.trim())
            .filter(Boolean)
        : null,
      personalNotes: personalNotes.trim() || null,
      seasonTags: seasonTags.length ? seasonTags : null,
      dishTypes: dishTypes.length ? dishTypes : null,
      cuisineTypes: cuisineTypes.length ? cuisineTypes : null,
      goodForTags: goodForTags.length ? goodForTags : null,
      dietaryTags: dietaryTags.length ? dietaryTags : null,
      mainIngredientTags: mainIngredientTags.length
        ? mainIngredientTags
        : null,
      prepTimeMinutes: prep,
      cookTimeMinutes: cook,
      totalTimeMinutes: total,
      servings: servings.trim() || null,
    };

    try {
      const endpoint = isEditing
        ? `/api/recipes/${recipe.id}`
        : "/api/recipes";
      const method = isEditing ? "PATCH" : "POST";

      // For PATCH, stringify arrays to match DB format
      const payload = isEditing
        ? {
            ...body,
            ingredients: body.ingredients
              ? JSON.stringify(body.ingredients)
              : null,
            steps: body.steps ? JSON.stringify(body.steps) : null,
            seasonTags: body.seasonTags
              ? JSON.stringify(body.seasonTags)
              : null,
            dishTypes: body.dishTypes
              ? JSON.stringify(body.dishTypes)
              : null,
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
          }
        : body;

      const res = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        setError("You must be logged in to save recipes.");
        setSaving(false);
        return;
      }

      if (!res.ok) {
        setError("Failed to save recipe. Please try again.");
        setSaving(false);
        return;
      }

      const saved = await res.json();
      router.push(`/recipes/${saved.id}`);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
      setSaving(false);
    }
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-border bg-background-elevated px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-accent-amber/50 focus:outline-none focus:ring-1 focus:ring-accent-amber/30";

  return (
    <div className="space-y-6">
      {/* Recipe type selector (only for new recipes) */}
      {!isEditing && (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setRecipeType("native")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              recipeType === "native"
                ? "bg-accent-amber text-background"
                : "border border-border text-foreground-muted hover:text-foreground"
            }`}
          >
            Native Recipe
          </button>
          <button
            type="button"
            onClick={() => setRecipeType("linked")}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              recipeType === "linked"
                ? "bg-accent-amber text-background"
                : "border border-border text-foreground-muted hover:text-foreground"
            }`}
          >
            Linked Recipe
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Linked: URL input + Extract button */}
        {recipeType === "linked" && (
          <div>
            <label className="block text-sm font-medium text-foreground-muted">
              Recipe URL
            </label>
            <div className="mt-1 flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://example.com/recipe..."
                className="flex-1 rounded-lg border border-border bg-background-elevated px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-accent-amber/50 focus:outline-none focus:ring-1 focus:ring-accent-amber/30"
              />
              <button
                type="button"
                onClick={handleExtractFromUrl}
                disabled={extracting || !url.trim()}
                className="shrink-0 rounded-lg bg-accent-amber/20 px-4 py-2 text-sm font-medium text-accent-amber transition-colors hover:bg-accent-amber/30 disabled:opacity-50"
              >
                {extracting ? "Extracting..." : "Extract from URL"}
              </button>
            </div>
          </div>
        )}

        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-foreground-muted">
            Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Recipe title"
            className={inputClass}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-foreground-muted">
            Short Description
          </label>
          <textarea
            rows={2}
            value={descriptionShort}
            onChange={(e) => setDescriptionShort(e.target.value)}
            placeholder="A brief description of this recipe..."
            className={inputClass}
          />
        </div>

        {/* Ingredients + Steps */}
        <div>
          <label className="block text-sm font-medium text-foreground-muted">
            Ingredients (one per line)
          </label>
          <textarea
            rows={6}
            value={ingredients}
            onChange={(e) => setIngredients(e.target.value)}
            placeholder={"1 lb chicken thighs\n2 tbsp olive oil\nSalt and pepper"}
            className={inputClass + " font-mono"}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground-muted">
            Steps (one per line)
          </label>
          <textarea
            rows={6}
            value={steps}
            onChange={(e) => setSteps(e.target.value)}
            placeholder={"Preheat oven to 400°F.\nSeason the chicken.\nRoast for 25 minutes."}
            className={inputClass}
          />
        </div>

        {/* Personal Notes */}
        <div>
          <label className="block text-sm font-medium text-foreground-muted">
            Personal Notes
          </label>
          <textarea
            rows={3}
            value={personalNotes}
            onChange={(e) => setPersonalNotes(e.target.value)}
            placeholder="Tips, substitutions, what you'd do differently..."
            className={inputClass}
          />
        </div>

        {/* Time & Servings */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground-muted">
              Prep (min)
            </label>
            <input
              type="number"
              value={prepTime}
              onChange={(e) => setPrepTime(e.target.value)}
              min="0"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground-muted">
              Cook (min)
            </label>
            <input
              type="number"
              value={cookTime}
              onChange={(e) => setCookTime(e.target.value)}
              min="0"
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground-muted">
              Servings
            </label>
            <input
              type="text"
              value={servings}
              onChange={(e) => setServings(e.target.value)}
              placeholder="4"
              className={inputClass}
            />
          </div>
        </div>

        {/* Tags section */}
        <div className="space-y-4 rounded-xl border border-border bg-background-elevated/50 p-4">
          <h3 className="text-sm font-medium text-foreground">
            Tags & Categories
          </h3>

          <TagSelector
            label="Good For"
            options={GOOD_FOR_OPTIONS}
            selected={goodForTags}
            onToggle={(t) => toggleTag(goodForTags, setGoodForTags, t)}
          />
          <TagSelector
            label="Season"
            options={SEASON_OPTIONS}
            selected={seasonTags}
            onToggle={(t) => toggleTag(seasonTags, setSeasonTags, t)}
          />
          <TagSelector
            label="Dish Type"
            options={DISH_TYPE_OPTIONS}
            selected={dishTypes}
            onToggle={(t) => toggleTag(dishTypes, setDishTypes, t)}
          />
          <TagSelector
            label="Cuisine"
            options={CUISINE_OPTIONS}
            selected={cuisineTypes}
            onToggle={(t) => toggleTag(cuisineTypes, setCuisineTypes, t)}
          />
          <TagSelector
            label="Dietary"
            options={DIETARY_OPTIONS}
            selected={dietaryTags}
            onToggle={(t) => toggleTag(dietaryTags, setDietaryTags, t)}
          />
          <TagSelector
            label="Main Protein"
            options={PROTEIN_OPTIONS}
            selected={mainIngredientTags}
            onToggle={(t) =>
              toggleTag(mainIngredientTags, setMainIngredientTags, t)
            }
          />
        </div>

        {error && (
          <p className="text-sm text-accent-wine-light">{error}</p>
        )}

        <div className="flex gap-2 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-accent-amber px-6 py-2 text-sm font-medium text-background transition-colors hover:bg-accent-amber-light disabled:opacity-50"
          >
            {saving
              ? "Saving..."
              : isEditing
                ? "Save Changes"
                : "Add Recipe"}
          </button>
          <a
            href={isEditing ? `/recipes/${recipe.id}` : "/"}
            className="rounded-lg border border-border px-6 py-2 text-sm font-medium text-foreground-muted transition-colors hover:bg-background-hover hover:text-foreground"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  );
}
