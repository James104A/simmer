const CUISINE_IMAGES: Record<string, string[]> = {
  Italian: [
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1546549032-9571cd6b27df?w=600&h=400&fit=crop",
  ],
  Mexican: [
    "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?w=600&h=400&fit=crop",
  ],
  Thai: [
    "https://images.unsplash.com/photo-1455619452474-d2be8b1e70cd?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1562565652-a0d8f0c59eb4?w=600&h=400&fit=crop",
  ],
  American: [
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1476224203421-9ac39bcb3327?w=600&h=400&fit=crop",
  ],
  Mediterranean: [
    "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop",
  ],
  Indian: [
    "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=600&h=400&fit=crop",
  ],
  Japanese: [
    "https://images.unsplash.com/photo-1553621042-f6e147245754?w=600&h=400&fit=crop",
  ],
  Chinese: [
    "https://images.unsplash.com/photo-1525755662778-989d0524087e?w=600&h=400&fit=crop",
  ],
  French: [
    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=600&h=400&fit=crop",
  ],
  Korean: [
    "https://images.unsplash.com/photo-1498654896293-37aacf113fd9?w=600&h=400&fit=crop",
  ],
  Greek: [
    "https://images.unsplash.com/photo-1529059997568-3d847b1154f0?w=600&h=400&fit=crop",
  ],
  "Middle Eastern": [
    "https://images.unsplash.com/photo-1547050605-2f268cd4a4e7?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=600&h=400&fit=crop",
  ],
};

const DISH_TYPE_IMAGES: Record<string, string[]> = {
  "Breakfast/Brunch": [
    "https://images.unsplash.com/photo-1495214783159-3503fd1b572d?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1533089860892-a7c6f0a88666?w=600&h=400&fit=crop",
  ],
  Salad: [
    "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=600&h=400&fit=crop",
  ],
  "Soup/Stew": [
    "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=600&h=400&fit=crop",
  ],
  Dessert: [
    "https://images.unsplash.com/photo-1551024601-bec78aea704b?w=600&h=400&fit=crop",
  ],
  Appetizer: [
    "https://images.unsplash.com/photo-1541014741259-de529411b96a?w=600&h=400&fit=crop",
  ],
  "Drink/Cocktail": [
    "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=600&h=400&fit=crop",
  ],
  Snack: [
    "https://images.unsplash.com/photo-1599490659213-e2b9527bd087?w=600&h=400&fit=crop",
  ],
  Main: [
    "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&h=400&fit=crop",
  ],
  Side: [
    "https://images.unsplash.com/photo-1534938665420-4ca68dab746f?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1543339308-d595ab3be1b7?w=600&h=400&fit=crop",
  ],
};

const PROTEIN_IMAGES: Record<string, string[]> = {
  Chicken: [
    "https://images.unsplash.com/photo-1598103442097-8b74394b95c6?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&h=400&fit=crop",
  ],
  Beef: [
    "https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1588168333986-5078d3ae3976?w=600&h=400&fit=crop",
  ],
  Pork: [
    "https://images.unsplash.com/photo-1432139509613-5c4255a1d197?w=600&h=400&fit=crop",
  ],
  Fish: [
    "https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=600&h=400&fit=crop",
    "https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=600&h=400&fit=crop",
  ],
  Shrimp: [
    "https://images.unsplash.com/photo-1565680018434-b513d5e5fd47?w=600&h=400&fit=crop",
  ],
  Tofu: [
    "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&h=400&fit=crop",
  ],
  Lamb: [
    "https://images.unsplash.com/photo-1514516345957-556ca7d90a29?w=600&h=400&fit=crop",
  ],
};

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return Math.abs(hash);
}

const GRADIENT_PAIRS: [string, string][] = [
  ["#8b3a4a", "#d4a054"],
  ["#6b7c5e", "#d4a054"],
  ["#8b3a4a", "#6b7c5e"],
  ["#7a6850", "#d4a054"],
  ["#5a3a2a", "#8b3a4a"],
];

export type RecipeImage =
  | { type: "url"; url: string }
  | { type: "gradient"; colors: [string, string] };

export function getRecipeImage(recipe: {
  title: string;
  imageUrl?: string | null;
  cuisineTypes: string | null;
  dishTypes: string | null;
  mainIngredientTags?: string | null;
}): RecipeImage {
  // 1. Explicit image (set by extraction or manual edit)
  if (recipe.imageUrl) {
    return { type: "url", url: recipe.imageUrl };
  }

  const cuisines: string[] = recipe.cuisineTypes
    ? JSON.parse(recipe.cuisineTypes)
    : [];
  const dishTypes: string[] = recipe.dishTypes
    ? JSON.parse(recipe.dishTypes)
    : [];
  const proteins: string[] = recipe.mainIngredientTags
    ? JSON.parse(recipe.mainIngredientTags)
    : [];

  // 2. Cuisine match
  for (const cuisine of cuisines) {
    const images = CUISINE_IMAGES[cuisine];
    if (images && images.length > 0) {
      const index = hashString(recipe.title) % images.length;
      return { type: "url", url: images[index] };
    }
  }

  // 3. Dish type match
  for (const dish of dishTypes) {
    const images = DISH_TYPE_IMAGES[dish];
    if (images && images.length > 0) {
      const index = hashString(recipe.title) % images.length;
      return { type: "url", url: images[index] };
    }
  }

  // 4. Protein / main ingredient match
  for (const protein of proteins) {
    const images = PROTEIN_IMAGES[protein];
    if (images && images.length > 0) {
      const index = hashString(recipe.title) % images.length;
      return { type: "url", url: images[index] };
    }
  }

  // 5. Gradient (last resort)
  const gradientIndex = hashString(recipe.title) % GRADIENT_PAIRS.length;
  return { type: "gradient", colors: GRADIENT_PAIRS[gradientIndex] };
}
