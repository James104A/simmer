import { GoogleGenAI } from "@google/genai";

export interface AISummaryResult {
  title: string;
  descriptionShort: string;
  highlights: string[];
  ingredients: string[];
  steps: string[];
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  servings: string | null;
}

export async function summarizeRecipeUrl(
  extractedText: string
): Promise<AISummaryResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }

  const ai = new GoogleGenAI({ apiKey });

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `You are a recipe data extractor. Given the following text extracted from a recipe webpage, extract ALL recipe data into a JSON object. The text may include visible page content and/or JSON-LD structured data — use all available information.

Required fields (extract every field — do not leave ingredients or steps empty if they appear anywhere in the text):

- "title": The recipe title/name.
- "descriptionShort": A 1-2 sentence summary of the recipe.
- "highlights": An array of 3-5 bullet-point strings covering time/effort, key techniques, and standout flavors.
- "ingredients": An array of ALL ingredient strings with quantities (e.g. "2 tbsp olive oil", "1 lb chicken thighs"). Look in both the page text and any JSON-LD recipeIngredient data.
- "steps": An array of ALL cooking step strings in order. Each step should be a single clear instruction. Look in both the page text and any JSON-LD recipeInstructions data.
- "prepTimeMinutes": Prep time in minutes as a number, or null if not found. Convert all times to minutes (e.g., 1 hour = 60).
- "cookTimeMinutes": Cook time in minutes as a number, or null if not found. Convert all times to minutes.
- "servings": Servings as a string (e.g. "4", "6-8"), or null if not found.

Respond ONLY with valid JSON, no other text.

Recipe text:
${extractedText}`,
    config: {
      responseMimeType: "application/json",
    },
  });

  const text = response.text || "";
  return JSON.parse(text) as AISummaryResult;
}
