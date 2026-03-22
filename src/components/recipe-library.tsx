"use client";

import { useMemo, useState } from "react";
import { Recipe } from "@/generated/prisma/client";
import { SearchBar } from "./search-bar";
import { FilterPanel } from "./filter-panel";
import { RecipeCard } from "./recipe-card";
import { RecipeFilters, SortOption } from "@/types/recipe";

type RecipeWithUser = Recipe & {
  user?: { id: string; name: string };
};

type SavedRecipeWithMeta = Recipe & {
  savedByUser: boolean;
  ownerName: string;
};

interface RecipeLibraryProps {
  initialRecipes: RecipeWithUser[];
  savedRecipes?: SavedRecipeWithMeta[];
  currentUserId?: string;
}

type FilterCategory = keyof RecipeFilters;

const FILTER_TO_FIELD: [FilterCategory, keyof Recipe][] = [
  ["seasons", "seasonTags"],
  ["dishTypes", "dishTypes"],
  ["cuisines", "cuisineTypes"],
  ["goodFor", "goodForTags"],
  ["dietary", "dietaryTags"],
  ["proteins", "mainIngredientTags"],
];

type Tab = "known-delicious" | "want-to-try";

export function RecipeLibrary({
  initialRecipes,
  savedRecipes = [],
  currentUserId,
}: RecipeLibraryProps) {
  const [activeTab, setActiveTab] = useState<Tab>("known-delicious");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filters, setFilters] = useState<RecipeFilters>({});

  const knownDeliciousCount = useMemo(
    () => initialRecipes.filter((r) => r.cookCount > 0).length,
    [initialRecipes]
  );
  // "Want to Try" = user's own uncooked recipes + saved recipes from friends
  const wantToTryCount =
    initialRecipes.filter((r) => r.cookCount === 0).length +
    savedRecipes.length;

  const toggleFilter = (category: FilterCategory, value: string) => {
    setFilters((prev) => {
      const current = (prev[category] as string[] | undefined) ?? [];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      return { ...prev, [category]: next.length > 0 ? next : undefined };
    });
  };

  const clearFilters = () => setFilters({});

  const filteredRecipes = useMemo(() => {
    let results: (Recipe & { savedByUser?: boolean; ownerName?: string })[];

    if (activeTab === "known-delicious") {
      results = initialRecipes.filter((r) => r.cookCount > 0);
    } else {
      // Combine own uncooked + saved recipes
      const ownUncooked = initialRecipes
        .filter((r) => r.cookCount === 0)
        .map((r) => ({ ...r, savedByUser: false, ownerName: "" }));
      results = [...ownUncooked, ...savedRecipes];
    }

    // Text search
    if (search.trim()) {
      const q = search.toLowerCase();
      results = results.filter((r) => {
        const searchable = [
          r.title,
          r.descriptionShort ?? "",
          r.cuisineTypes ?? "",
          r.dishTypes ?? "",
          r.goodForTags ?? "",
          r.seasonTags ?? "",
          r.dietaryTags ?? "",
          r.mainIngredientTags ?? "",
        ]
          .join(" ")
          .toLowerCase();
        return searchable.includes(q);
      });
    }

    // Category filters: AND across, OR within
    for (const [filterKey, recipeField] of FILTER_TO_FIELD) {
      const selected = filters[filterKey] as string[] | undefined;
      if (selected && selected.length > 0) {
        results = results.filter((r) => {
          const raw = r[recipeField];
          const values: string[] =
            typeof raw === "string" ? JSON.parse(raw) : [];
          if (filterKey === "seasons" && values.includes("Any")) return true;
          return selected.some((s) => values.includes(s));
        });
      }
    }

    // Sort
    results = [...results].sort((a, b) => {
      if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
      switch (sortBy) {
        case "mostCooked":
          return b.cookCount - a.cookCount;
        case "highestRated":
          return (b.rating ?? 0) - (a.rating ?? 0);
        case "prepTime":
          return (a.totalTimeMinutes ?? 999) - (b.totalTimeMinutes ?? 999);
        case "recent":
        default:
          return (
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
      }
    });

    return results;
  }, [initialRecipes, savedRecipes, activeTab, search, filters, sortBy]);

  const activeFilterEntries = Object.entries(filters).filter(
    ([, v]) => Array.isArray(v) && v.length > 0
  );

  return (
    <div>
      {/* Tabs */}
      <div className="mb-8 flex gap-8 border-b border-border">
        <button
          onClick={() => setActiveTab("known-delicious")}
          className={`relative pb-3 text-sm font-medium transition-colors ${
            activeTab === "known-delicious"
              ? "text-accent-amber"
              : "text-foreground-muted hover:text-foreground"
          }`}
        >
          <span className="font-[family-name:var(--font-display)] text-base tracking-tight">
            Known Delicious
          </span>
          <span
            className={`ml-2 text-xs tabular-nums ${
              activeTab === "known-delicious"
                ? "text-accent-amber/70"
                : "text-foreground-muted/50"
            }`}
          >
            {knownDeliciousCount}
          </span>
          {activeTab === "known-delicious" && (
            <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent-amber" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("want-to-try")}
          className={`relative pb-3 text-sm font-medium transition-colors ${
            activeTab === "want-to-try"
              ? "text-accent-amber"
              : "text-foreground-muted hover:text-foreground"
          }`}
        >
          <span className="font-[family-name:var(--font-display)] text-base tracking-tight">
            Want to Try
          </span>
          <span
            className={`ml-2 text-xs tabular-nums ${
              activeTab === "want-to-try"
                ? "text-accent-amber/70"
                : "text-foreground-muted/50"
            }`}
          >
            {wantToTryCount}
          </span>
          {activeTab === "want-to-try" && (
            <span className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent-amber" />
          )}
        </button>
      </div>

      {/* Toolbar */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SearchBar value={search} onChange={setSearch} />
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
              showFilters
                ? "border-accent-amber/50 text-accent-amber"
                : "border-border text-foreground-muted hover:text-foreground"
            }`}
          >
            Filters
          </button>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="rounded-lg border border-border bg-background-elevated px-3 py-2 text-sm text-foreground-muted"
          >
            <option value="recent">Recently Added</option>
            <option value="mostCooked">Most Cooked</option>
            <option value="highestRated">Highest Rated</option>
            <option value="prepTime">Prep Time</option>
          </select>
          <button
            onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
            className="rounded-lg border border-border px-3 py-2 text-sm text-foreground-muted transition-colors hover:text-foreground"
          >
            {viewMode === "grid" ? "List" : "Grid"}
          </button>
        </div>
      </div>

      {/* Filter panel */}
      {showFilters && (
        <FilterPanel
          filters={filters}
          onToggleFilter={toggleFilter}
          onClearAll={clearFilters}
        />
      )}

      {/* Active filter chips */}
      {activeFilterEntries.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <span className="text-xs text-foreground-muted">Active:</span>
          {activeFilterEntries.map(([category, values]) =>
            (values as string[]).map((value) => (
              <button
                key={`${category}-${value}`}
                onClick={() => toggleFilter(category as FilterCategory, value)}
                className="flex items-center gap-1 rounded-full bg-accent-amber/20 px-3 py-1 text-xs text-accent-amber-light hover:bg-accent-amber/30"
              >
                {value}
                <span className="ml-0.5">&times;</span>
              </button>
            ))
          )}
          <button
            onClick={clearFilters}
            className="text-xs text-foreground-muted underline hover:text-foreground"
          >
            Clear all
          </button>
        </div>
      )}

      {/* Recipe grid / list */}
      <div
        className={
          viewMode === "grid"
            ? "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            : "flex flex-col gap-4"
        }
      >
        {filteredRecipes.map((recipe) => (
          <RecipeCard
            key={recipe.id}
            recipe={recipe}
            viewMode={viewMode}
            ownerName={
              "ownerName" in recipe && recipe.ownerName
                ? (recipe.ownerName as string)
                : currentUserId &&
                    (recipe as RecipeWithUser).user &&
                    (recipe as RecipeWithUser).user!.id !== currentUserId
                  ? (recipe as RecipeWithUser).user!.name
                  : undefined
            }
          />
        ))}
      </div>

      {filteredRecipes.length === 0 && (
        <p className="py-12 text-center text-foreground-muted">
          No recipes found. Try adjusting your filters or add a new recipe.
        </p>
      )}
    </div>
  );
}
