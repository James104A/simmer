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

const RECIPE_EXTRACTION_PROMPT = `You are a recipe data extractor. Extract ALL recipe data into a JSON object.

Required fields (extract every field — do not leave ingredients or steps empty if they appear anywhere in the text):

- "title": The recipe title/name.
- "descriptionShort": A 1-2 sentence summary of the recipe.
- "highlights": An array of 3-5 bullet-point strings covering time/effort, key techniques, and standout flavors.
- "ingredients": An array of ALL ingredient strings with quantities (e.g. "2 tbsp olive oil", "1 lb chicken thighs"). Look in both the page text and any JSON-LD recipeIngredient data.
- "steps": An array of ALL cooking step strings in order. Each step should be a single clear instruction. Look in both the page text and any JSON-LD recipeInstructions data.
- "prepTimeMinutes": Prep time in minutes as a number, or null if not found. Convert all times to minutes (e.g., 1 hour = 60).
- "cookTimeMinutes": Cook time in minutes as a number, or null if not found. Convert all times to minutes.
- "servings": Servings as a string (e.g. "4", "6-8"), or null if not found.

Respond ONLY with valid JSON, no other text.`;

function getGenAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not set");
  }
  return new GoogleGenAI({ apiKey });
}

export async function summarizeRecipeUrl(
  extractedText: string
): Promise<AISummaryResult> {
  const ai = getGenAI();

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `${RECIPE_EXTRACTION_PROMPT}

Recipe text:
${extractedText}`,
    config: {
      responseMimeType: "application/json",
    },
  });

  const text = response.text || "";
  return JSON.parse(text) as AISummaryResult;
}

/** Use Gemini with URL context tool to extract recipe data directly from a URL.
 *  This bypasses Cloudflare and other bot protection since Google fetches the page.
 *  Note: responseMimeType cannot be used with tools in the Gemini API, so we
 *  parse the JSON from the text response manually. */
export async function extractRecipeFromUrlViaAI(
  url: string
): Promise<AISummaryResult> {
  const ai = getGenAI();

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `${RECIPE_EXTRACTION_PROMPT}

Recipe URL: ${url}`,
    config: {
      // responseMimeType cannot be combined with tools in the Gemini API
      tools: [{ urlContext: {} }],
    },
  });

  const text = response.text || "";
  // Strip markdown code fences if present (Gemini often wraps JSON in ```json...```)
  const cleaned = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/, "").trim();
  return JSON.parse(cleaned) as AISummaryResult;
}
