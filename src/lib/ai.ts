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

/** Parse JSON from Gemini text response, handling markdown code fences and refusals */
function parseGeminiJson(text: string): AISummaryResult {
  const fenceMatch = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/i);
  const cleaned = fenceMatch ? fenceMatch[1].trim() : text.trim();

  if (!cleaned.startsWith("{") && !cleaned.startsWith("[")) {
    throw new Error(`Gemini did not return JSON. Response: ${cleaned.slice(0, 200)}`);
  }

  return JSON.parse(cleaned) as AISummaryResult;
}

/** Derive a human-readable recipe name from a URL slug.
 *  e.g. "https://www.seriouseats.com/english-pea-salad-with-bacon-recipe-11938180"
 *  → "serious eats english pea salad with bacon recipe" */
function recipeNameFromUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "").replace(/\.\w+$/, "").replace(/[.-]/g, " ");
    const slug = parsed.pathname
      .split("/")
      .filter(Boolean)
      .pop() || "";
    const name = slug
      .replace(/[-_]/g, " ")
      .replace(/\b\d{5,}\b/g, "") // remove long numeric IDs
      .replace(/\brecipe\b/gi, "") // remove noise word "recipe"
      .replace(/\s+/g, " ")
      .trim();
    return `${host} ${name}`.trim();
  } catch {
    return url;
  }
}

const AI_JSON_FORMAT = `{
  "title": "recipe name",
  "descriptionShort": "1-2 sentence summary",
  "highlights": ["3-5 bullet points about the recipe"],
  "ingredients": ["all ingredients with quantities"],
  "steps": ["all cooking steps in order"],
  "prepTimeMinutes": null,
  "cookTimeMinutes": null,
  "servings": null
}`;

/** Use Gemini to extract recipe data directly from a URL when server-side fetch fails.
 *  Tries urlContext first (direct page access — works on many sites), then falls back
 *  to googleSearch by recipe name (works even on Cloudflare-protected sites).
 *  Note: responseMimeType cannot be combined with tools in the Gemini API. */
export async function extractRecipeFromUrlViaAI(
  url: string
): Promise<AISummaryResult> {
  const ai = getGenAI();

  // Tier 1: urlContext — Google fetches the page directly (works on non-Cloudflare sites)
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `${RECIPE_EXTRACTION_PROMPT}\n\nExtract the recipe from this URL: ${url}\n\nRespond ONLY with the JSON object, no markdown fences, no explanation.`,
      config: {
        tools: [{ urlContext: {} }],
      },
    });
    return parseGeminiJson(response.text || "");
  } catch (err) {
    console.error("Gemini urlContext failed, falling back to googleSearch:", err);
  }

  // Tier 2: googleSearch — search by recipe name derived from URL slug
  const recipeName = recipeNameFromUrl(url);
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Search for the recipe "${recipeName}" and extract ALL of its details into this exact JSON format:\n\n${AI_JSON_FORMAT}\n\nRespond ONLY with the JSON object, no markdown fences, no explanation.`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  return parseGeminiJson(response.text || "");
}
