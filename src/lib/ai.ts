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

/** Parse JSON from Gemini text response, handling markdown code fences and refusals.
 *  Throws if the response isn't valid recipe JSON (must have title + ingredients). */
function parseGeminiJson(text: string): AISummaryResult {
  const fenceMatch = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/i);
  const cleaned = fenceMatch ? fenceMatch[1].trim() : text.trim();

  if (!cleaned.startsWith("{") && !cleaned.startsWith("[")) {
    throw new Error(`Gemini did not return JSON. Response: ${cleaned.slice(0, 200)}`);
  }

  const parsed = JSON.parse(cleaned) as AISummaryResult;

  // Validate the result actually contains recipe data — Gemini sometimes returns
  // error JSON like {"error": "Could not access..."} which parses fine but is useless
  if (!parsed.title || !parsed.ingredients || parsed.ingredients.length === 0) {
    throw new Error(`Gemini returned JSON but no recipe data. Keys: ${Object.keys(parsed).join(", ")}`);
  }

  return parsed;
}

/** Derive a site name and recipe name from a URL for search queries.
 *  e.g. "https://www.seriouseats.com/english-pea-salad-with-bacon-recipe-11938180"
 *  → { site: "Serious Eats", name: "English Pea Salad With Bacon" } */
function recipeInfoFromUrl(url: string): { site: string; name: string } {
  try {
    const parsed = new URL(url);
    // "seriouseats.com" → "Serious Eats", "bonappetit.com" → "Bon Appetit"
    const rawHost = parsed.hostname.replace(/^www\./, "").replace(/\.com$|\.org$|\.net$/, "");
    // Split compound names: "seriouseats" → "serious eats", "bonappetit" → "bon appetit"
    const site = rawHost
      .replace(/[.-]/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2") // camelCase
      .replace(/(serious)(eats)/i, "$1 $2")
      .replace(/(bon)(appetit)/i, "$1 $2")
      .replace(/(all)(recipes)/i, "$1 $2")
      .replace(/(food)(network)/i, "$1 $2")
      .replace(/(budget)(bytes)/i, "$1 $2")
      .replace(/(simply)(recipes)/i, "$1 $2")
      .replace(/(taste)(of)(home)/i, "$1 $2 $3")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    const slug = parsed.pathname
      .split("/")
      .filter(Boolean)
      .pop() || "";
    const name = slug
      .replace(/[-_]/g, " ")
      .replace(/\b\d{5,}\b/g, "") // remove long numeric IDs
      .replace(/\brecipe\b/gi, "") // remove noise word "recipe"
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (c) => c.toUpperCase()); // Title Case
    return { site, name };
  } catch {
    return { site: "", name: url };
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
  const { site, name } = recipeInfoFromUrl(url);
  const searchQuery = site ? `the ${site} recipe called "${name}"` : `the recipe "${name}"`;
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `Search for ${searchQuery} and extract ALL of its details into this exact JSON format:\n\n${AI_JSON_FORMAT}\n\nRespond ONLY with the JSON object, no markdown fences, no explanation.`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  return parseGeminiJson(response.text || "");
}
