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

/** Use Gemini with URL context tool to extract recipe data directly from a URL.
 *  Tries urlContext first (direct fetch), then falls back to googleSearch grounding.
 *  Note: responseMimeType cannot be combined with tools in the Gemini API. */
export async function extractRecipeFromUrlViaAI(
  url: string
): Promise<AISummaryResult> {
  const ai = getGenAI();

  // Try urlContext first — Google fetches the page directly
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `${RECIPE_EXTRACTION_PROMPT}\n\nRecipe URL: ${url}`,
      config: {
        tools: [{ urlContext: {} }],
      },
    });
    return parseGeminiJson(response.text || "");
  } catch (urlContextError) {
    console.error("Gemini urlContext failed, trying googleSearch:", urlContextError);
  }

  // Fallback: use Google Search grounding to find the recipe content
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: `${RECIPE_EXTRACTION_PROMPT}\n\nSearch for and extract the complete recipe from this page: ${url}`,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });
  return parseGeminiJson(response.text || "");
}
