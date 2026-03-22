"use client";

import { useState } from "react";
import { getRecipeImage } from "@/lib/recipe-images";

const EVENT_LABELS: Record<string, string> = {
  cook: "cooked this",
  add_recipe: "added a new recipe",
  save_recipe: "wants to try this",
};

interface FeedItemProps {
  item: {
    id: string;
    eventType: string;
    createdAt: string;
    notes: string | null;
    user: { id: string; name: string };
    recipe: {
      id: string;
      title: string;
      imageUrl: string | null;
      descriptionShort: string | null;
      cuisineTypes: string | null;
      dishTypes: string | null;
      totalTimeMinutes: number | null;
      rating: number | null;
    };
    isSaved: boolean;
  };
}

export function FeedItem({ item }: FeedItemProps) {
  const [isSaved, setIsSaved] = useState(item.isSaved);

  const cuisines: string[] = item.recipe.cuisineTypes
    ? JSON.parse(item.recipe.cuisineTypes)
    : [];
  const dishTypes: string[] = item.recipe.dishTypes
    ? JSON.parse(item.recipe.dishTypes)
    : [];
  const tags = [...cuisines, ...dishTypes].slice(0, 3);

  const image = getRecipeImage({
    title: item.recipe.title,
    imageUrl: item.recipe.imageUrl,
    cuisineTypes: item.recipe.cuisineTypes,
    dishTypes: item.recipe.dishTypes,
  });

  async function handleToggleSave() {
    const previousState = isSaved;
    setIsSaved(!isSaved);
    try {
      await fetch("/api/saved-recipes", {
        method: previousState ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId: item.recipe.id }),
      });
    } catch {
      setIsSaved(previousState);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl card-glass">
      {/* Header: event description */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-amber/20 text-sm font-semibold text-accent-amber">
          {item.user.name.charAt(0).toUpperCase()}
        </div>
        <div>
          <span className="text-sm font-medium text-foreground">
            {item.user.name}
          </span>
          <span className="ml-1.5 text-sm text-foreground-muted">
            {EVENT_LABELS[item.eventType] ?? item.eventType}
          </span>
          <p className="text-xs text-foreground-muted/60">
            {new Date(item.createdAt).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Recipe card */}
      <a href={`/recipes/${item.recipe.id}`} className="group block">
        <div className="relative h-48 w-full overflow-hidden">
          {image.type === "url" ? (
            <img
              src={image.url}
              alt={item.recipe.title}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              loading="lazy"
            />
          ) : (
            <div
              className="h-full w-full"
              style={{
                background: `linear-gradient(135deg, ${image.colors[0]}, ${image.colors[1]})`,
              }}
            />
          )}
        </div>
        <div className="px-5 py-3">
          <h3 className="font-[family-name:var(--font-display)] text-lg font-semibold text-foreground transition-colors group-hover:text-accent-amber-light">
            {item.recipe.title}
          </h3>
          {item.recipe.descriptionShort && (
            <p className="mt-1 line-clamp-2 text-sm text-foreground-muted">
              {item.recipe.descriptionShort}
            </p>
          )}
          {tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full border border-border bg-surface-glass px-2.5 py-0.5 text-xs text-foreground-muted"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </a>

      {/* Cook notes + actions */}
      <div className="border-t border-border px-5 py-3">
        {item.eventType === "cook" && item.notes && (
          <p className="mb-3 text-sm italic text-foreground-muted">
            &ldquo;{item.notes}&rdquo;
          </p>
        )}
        <button
          onClick={handleToggleSave}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            isSaved
              ? "bg-accent-amber/20 text-accent-amber-light hover:bg-accent-amber/30"
              : "bg-background-hover text-foreground-muted hover:text-accent-amber-light"
          }`}
        >
          {isSaved ? "Saved" : "Want to Cook"}
        </button>
      </div>
    </div>
  );
}
