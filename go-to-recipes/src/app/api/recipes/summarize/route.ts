import { NextRequest, NextResponse } from "next/server";
import { extractFromUrl } from "@/lib/extract";
import { summarizeRecipeUrl } from "@/lib/ai";
import { getCurrentUser } from "@/lib/auth";

// POST /api/recipes/summarize — Extract recipe data from URL
export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { url } = await request.json();

  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const { text, imageUrl, structured } = await extractFromUrl(url);

    // Start with structured data if available (even if incomplete)
    const result: Record<string, unknown> = {
      title: structured?.title ?? null,
      descriptionShort: structured?.descriptionShort ?? null,
      highlights: [],
      ingredients: structured?.ingredients ?? null,
      steps: structured?.steps ?? null,
      prepTimeMinutes: structured?.prepTimeMinutes ?? null,
      cookTimeMinutes: structured?.cookTimeMinutes ?? null,
      servings: structured?.servings ?? null,
      imageUrl,
      sourceUrl: url,
      fetchedAt: new Date().toISOString(),
      method: "structured",
    };

    // If structured data is complete (has title + ingredients + steps), return it
    const hasFullStructured =
      result.title &&
      Array.isArray(result.ingredients) &&
      (result.ingredients as string[]).length > 0 &&
      Array.isArray(result.steps) &&
      (result.steps as string[]).length > 0;

    if (hasFullStructured) {
      return NextResponse.json(result);
    }

    // Try AI to fill in gaps (or extract everything if no structured data)
    if (text && process.env.GEMINI_API_KEY) {
      try {
        const aiResult = await summarizeRecipeUrl(text);
        // Merge: prefer structured data, fill gaps with AI
        result.title = result.title || aiResult.title;
        result.descriptionShort =
          result.descriptionShort || aiResult.descriptionShort;
        result.highlights = aiResult.highlights || [];
        result.ingredients =
          (result.ingredients as string[] | null)?.length
            ? result.ingredients
            : aiResult.ingredients;
        result.steps =
          (result.steps as string[] | null)?.length
            ? result.steps
            : aiResult.steps;
        result.prepTimeMinutes =
          result.prepTimeMinutes ?? aiResult.prepTimeMinutes;
        result.cookTimeMinutes =
          result.cookTimeMinutes ?? aiResult.cookTimeMinutes;
        result.servings = result.servings ?? aiResult.servings;
        result.method = structured ? "structured+ai" : "ai";
      } catch {
        // AI failed — continue with whatever structured data we have
      }
    }

    // Return whatever we have (even if partial)
    if (result.title) {
      return NextResponse.json(result);
    }

    throw new Error(
      "Could not extract recipe data from this URL. Try a different recipe site."
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Failed to extract recipe data";
    return NextResponse.json(
      { error: message, fallback: true },
      { status: 422 }
    );
  }
}
