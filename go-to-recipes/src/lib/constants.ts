export const SEASON_OPTIONS = ["Spring", "Summer", "Fall", "Winter", "Any"] as const;

export const DISH_TYPE_OPTIONS = [
  "Appetizer",
  "Main",
  "Side",
  "Dessert",
  "Snack",
  "Breakfast/Brunch",
  "Soup/Stew",
  "Salad",
  "Drink/Cocktail",
] as const;

export const CUISINE_OPTIONS = [
  "Italian",
  "Mexican",
  "Indian",
  "Thai",
  "American",
  "Mediterranean",
  "Japanese",
  "Chinese",
  "French",
  "Korean",
  "Middle Eastern",
  "Greek",
] as const;

export const GOOD_FOR_OPTIONS = [
  "Weeknight",
  "Dinner Party",
  "Meal Prep",
  "Date Night",
  "Kid-Friendly",
  "Crowd/Potluck",
  "Healthy-ish",
  "Comfort Food",
] as const;

export const DIETARY_OPTIONS = [
  "Vegetarian",
  "Vegan",
  "Gluten-Free",
  "Dairy-Free",
  "Nut-Free",
  "Low-Carb",
  "Paleo",
  "Whole30",
] as const;

export const PROTEIN_OPTIONS = [
  "Chicken",
  "Beef",
  "Pork",
  "Fish",
  "Shrimp",
  "Tofu",
  "Lamb",
  "Turkey",
  "Eggs",
] as const;

export const TIME_FILTER_OPTIONS = [
  { label: "Under 30 min", max: 30 },
  { label: "30–60 min", min: 30, max: 60 },
  { label: "60+ min", min: 60 },
] as const;

export const SORT_OPTIONS = [
  { value: "recent", label: "Recently Added" },
  { value: "mostCooked", label: "Most Cooked" },
  { value: "highestRated", label: "Highest Rated" },
  { value: "prepTime", label: "Prep Time" },
] as const;
