"use client";

import { RecipeFilters } from "@/types/recipe";
import {
  SEASON_OPTIONS,
  DISH_TYPE_OPTIONS,
  CUISINE_OPTIONS,
  GOOD_FOR_OPTIONS,
  DIETARY_OPTIONS,
  PROTEIN_OPTIONS,
} from "@/lib/constants";

interface FilterPanelProps {
  filters: RecipeFilters;
  onToggleFilter: (category: keyof RecipeFilters, value: string) => void;
  onClearAll: () => void;
}

const CATEGORIES: {
  label: string;
  key: keyof RecipeFilters;
  options: readonly string[];
}[] = [
  { label: "Good For", key: "goodFor", options: GOOD_FOR_OPTIONS },
  { label: "Season", key: "seasons", options: SEASON_OPTIONS },
  { label: "Dish Type", key: "dishTypes", options: DISH_TYPE_OPTIONS },
  { label: "Cuisine", key: "cuisines", options: CUISINE_OPTIONS },
  { label: "Dietary", key: "dietary", options: DIETARY_OPTIONS },
  { label: "Protein", key: "proteins", options: PROTEIN_OPTIONS },
];

export function FilterPanel({
  filters,
  onToggleFilter,
  onClearAll,
}: FilterPanelProps) {
  const hasActiveFilters = Object.values(filters).some(
    (v) => Array.isArray(v) && v.length > 0
  );

  return (
    <div className="mb-6 rounded-xl border border-border bg-background-elevated p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-[family-name:var(--font-display)] text-sm font-semibold text-foreground">
          Filters
        </h2>
        {hasActiveFilters && (
          <button
            onClick={onClearAll}
            className="text-xs text-foreground-muted underline hover:text-foreground"
          >
            Clear all
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {CATEGORIES.map(({ label, key, options }) => (
          <FilterGroup
            key={key}
            label={label}
            options={options}
            selected={(filters[key] as string[] | undefined) ?? []}
            onToggle={(value) => onToggleFilter(key, value)}
          />
        ))}
      </div>
    </div>
  );
}

function FilterGroup({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string;
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div>
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-foreground-muted">
        {label}
      </h3>
      <div className="flex flex-wrap gap-1.5">
        {options.map((option) => {
          const isActive = selected.includes(option);
          return (
            <button
              key={option}
              onClick={() => onToggle(option)}
              className={`rounded-full px-3 py-1 text-xs transition-all ${
                isActive
                  ? "bg-accent-amber font-medium text-background shadow-sm"
                  : "border border-border text-foreground-muted hover:border-accent-amber/50 hover:text-foreground"
              }`}
            >
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
