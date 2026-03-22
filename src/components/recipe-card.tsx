"use client";

import { Recipe } from "@/generated/prisma/client";
import { getRecipeImage } from "@/lib/recipe-images";

interface RecipeCardProps {
  recipe: Recipe;
  viewMode: "grid" | "list";
  ownerName?: string;
  onCooked?: (recipeId: string) => void;
}

export function RecipeCard({ recipe, viewMode, ownerName, onCooked }: RecipeCardProps) {
  const cuisines: string[] = recipe.cuisineTypes
    ? JSON.parse(recipe.cuisineTypes)
    : [];
  const dishTypes: string[] = recipe.dishTypes
    ? JSON.parse(recipe.dishTypes)
    : [];
  const goodFor: string[] = recipe.goodForTags
    ? JSON.parse(recipe.goodForTags)
    : [];
  const seasons: string[] = recipe.seasonTags
    ? JSON.parse(recipe.seasonTags)
    : [];

  const tags = [...cuisines, ...dishTypes, ...goodFor, ...seasons];
  const image = getRecipeImage(recipe);

  return (
    <a
      href={`/recipes/${recipe.id}`}
      className={`group block overflow-hidden rounded-xl card-glass ${
        viewMode === "list" ? "flex items-stretch" : ""
      }`}
    >
      {/* Thumbnail */}
      <div
        className={
          viewMode === "list"
            ? "relative h-auto w-40 shrink-0 overflow-hidden"
            : "relative h-56 w-full overflow-hidden"
        }
      >
        {image.type === "url" ? (
          <img
            src={image.url}
            alt={recipe.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div
            className="h-full w-full transition-transform duration-500 group-hover:scale-105"
            style={{
              background: `linear-gradient(135deg, ${image.colors[0]}, ${image.colors[1]})`,
            }}
          />
        )}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background-elevated via-background-elevated/60 to-transparent" />
        {recipe.isFavorite && (
          <span className="absolute right-2.5 top-2.5 text-lg text-accent-copper drop-shadow-lg">
            &#9733;
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-4">
        <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground transition-colors group-hover:text-accent-amber-light">
          {recipe.title}
        </h3>

        {ownerName && (
          <p className="mt-0.5 text-xs text-accent-sage-light">
            from {ownerName}
          </p>
        )}

        {recipe.descriptionShort && (
          <p className="mt-1 line-clamp-2 text-sm text-foreground-muted">
            {recipe.descriptionShort}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-1.5">
          {tags.slice(0, 4).map((tag: string) => (
            <span
              key={tag}
              className="rounded-full border border-border bg-surface-glass px-2.5 py-0.5 text-xs text-foreground-muted"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="mt-3 flex items-center gap-3 text-xs text-foreground-muted">
          {recipe.totalTimeMinutes != null && recipe.totalTimeMinutes > 0 && (
            <span>{recipe.totalTimeMinutes} min</span>
          )}
          {recipe.rating != null && (
            <span className="text-accent-copper">
              {"★".repeat(recipe.rating)}
            </span>
          )}
          {recipe.cookCount > 0 && <span>Cooked {recipe.cookCount}x</span>}
        </div>

        {onCooked && (
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onCooked(recipe.id);
            }}
            className="mt-3 w-full rounded-lg bg-accent-sage/20 px-3 py-1.5 text-sm font-medium text-accent-sage-light transition-colors hover:bg-accent-sage/30"
          >
            Cooked
          </button>
        )}
      </div>
    </a>
  );
}
