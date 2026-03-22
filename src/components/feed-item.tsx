"use client";

import { useState } from "react";
import { getRecipeImage } from "@/lib/recipe-images";

const EVENT_LABELS: Record<string, string> = {
  cook: "cooked this",
  cook_favorite: "cooked this and added it to favorites",
  cook_discard: "cooked this and discarded it",
  add_recipe: "added a new recipe",
  save_recipe: "wants to try this",
};

const EVENT_COLORS: Record<string, string> = {
  cook: "bg-accent-sage/20 text-accent-sage",
  cook_favorite: "bg-accent-amber/20 text-accent-amber",
  cook_discard: "bg-foreground-muted/20 text-foreground-muted",
  add_recipe: "bg-accent-amber/20 text-accent-amber",
  save_recipe: "bg-accent-amber/20 text-accent-amber",
};

interface FeedItemProps {
  item: {
    id: string;
    eventType: string;
    createdAt: string;
    notes: string | null;
    metadata: string | null;
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
    } | null;
    isSaved: boolean;
  };
}

export function FeedItem({ item }: FeedItemProps) {
  const [isSaved, setIsSaved] = useState(item.isSaved);

  // Resolve recipe display data — fall back to metadata snapshot for deleted recipes
  const meta = item.metadata ? JSON.parse(item.metadata) : {};
  const recipeDisplay = item.recipe ?? {
    id: null as string | null,
    title: (meta.title as string) ?? "Deleted recipe",
    imageUrl: (meta.imageUrl as string | null) ?? null,
    descriptionShort: (meta.descriptionShort as string | null) ?? null,
    cuisineTypes: (meta.cuisineTypes as string | null) ?? null,
    dishTypes: (meta.dishTypes as string | null) ?? null,
    totalTimeMinutes: null as number | null,
    rating: null as number | null,
  };

  const cuisines: string[] = recipeDisplay.cuisineTypes
    ? JSON.parse(recipeDisplay.cuisineTypes)
    : [];
  const dishTypes: string[] = recipeDisplay.dishTypes
    ? JSON.parse(recipeDisplay.dishTypes)
    : [];
  const tags = [...cuisines, ...dishTypes].slice(0, 3);

  const image = getRecipeImage({
    title: recipeDisplay.title,
    imageUrl: recipeDisplay.imageUrl,
    cuisineTypes: recipeDisplay.cuisineTypes,
    dishTypes: recipeDisplay.dishTypes,
  });

  const avatarColor = EVENT_COLORS[item.eventType] ?? "bg-accent-amber/20 text-accent-amber";

  async function handleToggleSave() {
    const previousState = isSaved;
    setIsSaved(!isSaved);
    try {
      await fetch("/api/saved-recipes", {
        method: previousState ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recipeId: item.recipe!.id }),
      });
    } catch {
      setIsSaved(previousState);
    }
  }

  return (
    <div className="overflow-hidden rounded-xl card-glass">
      {/* Header: event description */}
      <div className="flex items-center gap-3 px-5 pt-4 pb-3">
        <div className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold ${avatarColor}`}>
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
      {(() => {
        const cardContent = (
          <>
            <div className="relative h-48 w-full overflow-hidden">
              {image.type === "url" ? (
                <img
                  src={image.url}
                  alt={recipeDisplay.title}
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
                {recipeDisplay.title}
              </h3>
              {recipeDisplay.descriptionShort && (
                <p className="mt-1 line-clamp-2 text-sm text-foreground-muted">
                  {recipeDisplay.descriptionShort}
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
          </>
        );

        return recipeDisplay.id ? (
          <a href={`/recipes/${recipeDisplay.id}`} className="group block">
            {cardContent}
          </a>
        ) : (
          <div className="group block">{cardContent}</div>
        );
      })()}

      {/* Cook notes + actions */}
      <div className="border-t border-border px-5 py-3">
        {item.eventType === "cook" && item.notes && (
          <p className="mb-3 text-sm italic text-foreground-muted">
            &ldquo;{item.notes}&rdquo;
          </p>
        )}
        {item.eventType !== "cook_discard" && recipeDisplay.id && (
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
        )}
      </div>
    </div>
  );
}
