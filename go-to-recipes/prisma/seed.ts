import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is not set");
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const seedRecipes = [
  {
    title: "Classic Margherita Pizza",
    recipeType: "native",
    descriptionShort:
      "Simple, perfect Margherita pizza with San Marzano tomatoes, fresh mozzarella, and basil.",
    ingredients: JSON.stringify([
      "1 lb pizza dough",
      "1/2 cup San Marzano tomato sauce",
      "8 oz fresh mozzarella, sliced",
      "Fresh basil leaves",
      "2 tbsp olive oil",
      "Salt to taste",
    ]),
    steps: JSON.stringify([
      "Preheat oven to 500°F with a pizza stone or baking sheet inside.",
      "Stretch dough into a 12-inch round on a floured surface.",
      "Spread tomato sauce evenly, leaving a 1-inch border.",
      "Arrange mozzarella slices over the sauce.",
      "Bake for 10–12 minutes until crust is golden and cheese is bubbly.",
      "Top with fresh basil and a drizzle of olive oil. Serve immediately.",
    ]),
    seasonTags: JSON.stringify(["Any"]),
    dishTypes: JSON.stringify(["Main"]),
    cuisineTypes: JSON.stringify(["Italian"]),
    goodForTags: JSON.stringify(["Weeknight", "Kid-Friendly"]),
    dietaryTags: JSON.stringify(["Vegetarian"]),
    mainIngredientTags: JSON.stringify([]),
    prepTimeMinutes: 15,
    cookTimeMinutes: 12,
    totalTimeMinutes: 27,
    servings: "2–3",
    rating: 5,
    isFavorite: true,
    cookCount: 12,
  },
  {
    title: "Thai Green Curry",
    recipeType: "native",
    descriptionShort:
      "Fragrant coconut green curry with chicken, bamboo shoots, and Thai basil.",
    ingredients: JSON.stringify([
      "1 lb chicken thighs, sliced",
      "2 tbsp green curry paste",
      "1 can (14 oz) coconut milk",
      "1 cup bamboo shoots",
      "1 cup Thai eggplant or regular eggplant, cubed",
      "1 tbsp fish sauce",
      "1 tsp sugar",
      "Thai basil leaves",
      "Jasmine rice for serving",
    ]),
    steps: JSON.stringify([
      "Heat a splash of coconut milk in a pan. Add curry paste and fry for 1 minute.",
      "Add chicken and cook until no longer pink on the outside.",
      "Pour in remaining coconut milk and bring to a simmer.",
      "Add bamboo shoots and eggplant. Cook 10 minutes.",
      "Season with fish sauce and sugar. Stir in Thai basil.",
      "Serve over jasmine rice.",
    ]),
    seasonTags: JSON.stringify(["Any"]),
    dishTypes: JSON.stringify(["Main"]),
    cuisineTypes: JSON.stringify(["Thai"]),
    goodForTags: JSON.stringify(["Weeknight", "Comfort Food"]),
    dietaryTags: JSON.stringify(["Gluten-Free", "Dairy-Free"]),
    mainIngredientTags: JSON.stringify(["Chicken"]),
    prepTimeMinutes: 10,
    cookTimeMinutes: 20,
    totalTimeMinutes: 30,
    servings: "4",
    rating: 4,
    cookCount: 8,
  },
  {
    title: "Summer Tomato Salad with Burrata",
    recipeType: "native",
    descriptionShort:
      "Peak-season tomatoes with creamy burrata, basil, and a balsamic drizzle.",
    ingredients: JSON.stringify([
      "2 lbs heirloom tomatoes, sliced",
      "8 oz burrata cheese",
      "Fresh basil leaves",
      "3 tbsp extra virgin olive oil",
      "1 tbsp balsamic vinegar",
      "Flaky sea salt and black pepper",
    ]),
    steps: JSON.stringify([
      "Arrange tomato slices on a platter.",
      "Tear burrata and place over tomatoes.",
      "Scatter basil leaves on top.",
      "Drizzle with olive oil and balsamic vinegar.",
      "Season with flaky salt and pepper. Serve immediately.",
    ]),
    seasonTags: JSON.stringify(["Summer"]),
    dishTypes: JSON.stringify(["Salad", "Appetizer"]),
    cuisineTypes: JSON.stringify(["Italian", "Mediterranean"]),
    goodForTags: JSON.stringify(["Dinner Party", "Date Night", "Healthy-ish"]),
    dietaryTags: JSON.stringify(["Vegetarian", "Gluten-Free"]),
    mainIngredientTags: JSON.stringify([]),
    prepTimeMinutes: 10,
    cookTimeMinutes: 0,
    totalTimeMinutes: 10,
    servings: "4",
    rating: 5,
    isFavorite: true,
    cookCount: 6,
  },
  {
    title: "Slow-Roasted Pork Shoulder Tacos",
    recipeType: "native",
    descriptionShort:
      "Fall-apart tender pork shoulder with citrus and spices, perfect for taco night.",
    ingredients: JSON.stringify([
      "3 lb boneless pork shoulder",
      "2 tbsp chili powder",
      "1 tbsp cumin",
      "1 tsp oregano",
      "4 cloves garlic, minced",
      "Juice of 2 oranges",
      "Juice of 2 limes",
      "Corn tortillas",
      "Diced onion, cilantro, and lime for serving",
    ]),
    steps: JSON.stringify([
      "Rub pork shoulder with chili powder, cumin, oregano, garlic, salt, and pepper.",
      "Place in a Dutch oven. Pour orange and lime juice over.",
      "Cover and roast at 300°F for 4–5 hours until fork-tender.",
      "Shred pork with two forks. Toss with pan juices.",
      "Warm tortillas and serve with onion, cilantro, and lime wedges.",
    ]),
    seasonTags: JSON.stringify(["Fall", "Winter"]),
    dishTypes: JSON.stringify(["Main"]),
    cuisineTypes: JSON.stringify(["Mexican"]),
    goodForTags: JSON.stringify(["Crowd/Potluck", "Meal Prep", "Comfort Food"]),
    dietaryTags: JSON.stringify(["Gluten-Free", "Dairy-Free"]),
    mainIngredientTags: JSON.stringify(["Pork"]),
    prepTimeMinutes: 15,
    cookTimeMinutes: 270,
    totalTimeMinutes: 285,
    servings: "8–10",
    rating: 5,
    cookCount: 4,
  },
  {
    title: "Crispy Sheet Pan Salmon",
    recipeType: "linked",
    url: "https://example.com/crispy-salmon",
    descriptionShort:
      "Quick sheet-pan salmon with crispy skin, served over greens with a lemon-herb vinaigrette.",
    highlights: JSON.stringify([
      "Ready in under 25 minutes",
      "Crispy skin technique: start skin-side down in a cold oven",
      "Bright lemon-herb vinaigrette ties it together",
    ]),
    ingredients: JSON.stringify([
      "4 salmon fillets, skin-on",
      "Mixed greens",
      "1 lemon",
      "2 tbsp Dijon mustard",
      "3 tbsp olive oil",
      "Fresh dill and parsley",
      "Salt and pepper",
    ]),
    seasonTags: JSON.stringify(["Spring", "Summer"]),
    dishTypes: JSON.stringify(["Main"]),
    cuisineTypes: JSON.stringify(["American", "Mediterranean"]),
    goodForTags: JSON.stringify(["Weeknight", "Healthy-ish", "Date Night"]),
    dietaryTags: JSON.stringify(["Gluten-Free", "Dairy-Free"]),
    mainIngredientTags: JSON.stringify(["Fish"]),
    prepTimeMinutes: 5,
    cookTimeMinutes: 18,
    totalTimeMinutes: 23,
    servings: "4",
    rating: 4,
    cookCount: 5,
  },
  {
    title: "Overnight Oats Three Ways",
    recipeType: "native",
    descriptionShort:
      "No-cook meal-prep breakfast: chocolate-peanut butter, berry-vanilla, and apple-cinnamon.",
    ingredients: JSON.stringify([
      "2 cups rolled oats",
      "2 cups milk (any kind)",
      "1 cup yogurt",
      "2 tbsp chia seeds",
      "Maple syrup to taste",
      "Toppings: PB + cocoa, berries + vanilla, apple + cinnamon",
    ]),
    steps: JSON.stringify([
      "Divide oats, milk, yogurt, and chia seeds among 3 jars.",
      "Add flavor mix-ins to each jar.",
      "Stir well, cover, and refrigerate overnight.",
      "In the morning, top and eat cold or warm briefly in microwave.",
    ]),
    seasonTags: JSON.stringify(["Any"]),
    dishTypes: JSON.stringify(["Breakfast/Brunch"]),
    cuisineTypes: JSON.stringify(["American"]),
    goodForTags: JSON.stringify(["Meal Prep", "Healthy-ish", "Kid-Friendly"]),
    dietaryTags: JSON.stringify(["Vegetarian"]),
    mainIngredientTags: JSON.stringify([]),
    prepTimeMinutes: 10,
    cookTimeMinutes: 0,
    totalTimeMinutes: 10,
    servings: "3",
    rating: 3,
    cookCount: 15,
  },
];

// Second user's recipes for testing social features
const user2Recipes = [
  {
    title: "Spicy Miso Ramen",
    recipeType: "native" as const,
    descriptionShort:
      "Rich, spicy miso broth with soft-boiled eggs, chashu pork, and fresh noodles.",
    ingredients: JSON.stringify([
      "4 packs fresh ramen noodles",
      "4 tbsp white miso paste",
      "2 tbsp chili garlic sauce",
      "4 cups chicken broth",
      "2 cups water",
      "4 soft-boiled eggs",
      "Sliced chashu pork or leftover roast pork",
      "Corn, scallions, nori for topping",
    ]),
    steps: JSON.stringify([
      "Bring broth and water to a simmer. Whisk in miso paste and chili garlic sauce.",
      "Cook noodles according to package directions.",
      "Divide noodles among bowls. Ladle hot broth over.",
      "Top with halved soft-boiled eggs, pork slices, corn, scallions, and nori.",
    ]),
    seasonTags: JSON.stringify(["Fall", "Winter"]),
    dishTypes: JSON.stringify(["Main", "Soup/Stew"]),
    cuisineTypes: JSON.stringify(["Japanese"]),
    goodForTags: JSON.stringify(["Comfort Food", "Date Night"]),
    dietaryTags: JSON.stringify(["Dairy-Free"]),
    mainIngredientTags: JSON.stringify(["Pork"]),
    prepTimeMinutes: 15,
    cookTimeMinutes: 20,
    totalTimeMinutes: 35,
    servings: "4",
    rating: 5,
    cookCount: 3,
  },
];

async function main() {
  console.log("Seeding database...");

  const passwordHash = await bcrypt.hash("password123", 12);

  // Create two users
  const user1 = await prisma.user.create({
    data: {
      email: "james@simmer.app",
      name: "James",
      passwordHash,
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: "alex@simmer.app",
      name: "Alex",
      passwordHash,
    },
  });

  // Create recipes for user 1
  for (const recipe of seedRecipes) {
    await prisma.recipe.create({
      data: { ...recipe, userId: user1.id },
    });
  }

  // Create recipes for user 2
  for (const recipe of user2Recipes) {
    await prisma.recipe.create({
      data: { ...recipe, userId: user2.id },
    });
  }

  // Create an accepted friendship between the two users
  await prisma.friendRequest.create({
    data: {
      senderId: user1.id,
      receiverId: user2.id,
      status: "accepted",
    },
  });

  // Add a cook log for user2 so user1 has something in their feed
  const ramenRecipe = await prisma.recipe.findFirst({
    where: { title: "Spicy Miso Ramen" },
  });
  if (ramenRecipe) {
    await prisma.cookLog.create({
      data: {
        recipeId: ramenRecipe.id,
        userId: user2.id,
        cookedAt: new Date(),
        notes: "Added extra chili garlic sauce - so good!",
      },
    });
  }

  console.log(
    `Seeded 2 users, ${seedRecipes.length + user2Recipes.length} recipes, 1 friendship, 1 cook log.`
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
