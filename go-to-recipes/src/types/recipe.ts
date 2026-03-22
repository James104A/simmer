export type RecipeType = "linked" | "native";

export interface Recipe {
  id: string;
  title: string;
  recipeType: RecipeType;

  // Linked recipe fields
  url: string | null;
  descriptionShort: string | null;
  highlights: string[];
  ingredients: string[];
  steps: string[];

  // Common fields
  personalNotes: string | null;
  seasonTags: string[];
  dishTypes: string[];
  cuisineTypes: string[];
  goodForTags: string[];
  dietaryTags: string[];
  mainIngredientTags: string[];

  // Time
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  totalTimeMinutes: number | null;
  servings: string | null;

  // Go-to signals
  rating: number | null;
  isFavorite: boolean;
  cookCount: number;
  lastCookedAt: string | null;

  createdAt: string;
  updatedAt: string;
}

export interface RecipeFilters {
  search?: string;
  seasons?: string[];
  dishTypes?: string[];
  cuisines?: string[];
  goodFor?: string[];
  dietary?: string[];
  proteins?: string[];
  timeRange?: { min?: number; max?: number };
}

export type SortOption = "recent" | "mostCooked" | "highestRated" | "prepTime";
