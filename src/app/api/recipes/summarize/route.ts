import { NextRequest, NextResponse } from "next/server";
import { extractFromUrl } from "@/lib/extract";
import { summarizeRecipeUrl, extractRecipeFromUrlViaAI } from "@/lib/ai";
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
    // Try server-side fetch first (fast path — works for most sites)
    let text: string | null = null;
    let imageUrl: string | null = null;
    let structured: Awaited<ReturnType<typeof extractFromUrl>>["structured"] =
      null;
    let fetchFailed = false;

    try {
      const extracted = await extractFromUrl(url);
      text = extracted.text;
      imageUrl = extracted.imageUrl;
      structured = extracted.structured;
    } catch {
      // Server-side fetch failed (likely Cloudflare/bot protection)
      fetchFailed = true;
    }

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

    // If fetch failed entirely, use Gemini with URL context to extract directly
    if (fetchFailed && process.env.GEMINI_API_KEY) {
      try {
        const aiResult = await extractRecipeFromUrlViaAI(url);
        if (aiResult.title) {
          return NextResponse.json({
            ...result,
            title: aiResult.title,
            descriptionShort: aiResult.descriptionShort,
            highlights: aiResult.highlights || [],
            ingredients: aiResult.ingredients,
            steps: aiResult.steps,
            prepTimeMinutes: aiResult.prepTimeMinutes,
            cookTimeMinutes: aiResult.cookTimeMinutes,
            servings: aiResult.servings,
            method: "ai-url-context",
          });
        }
      } catch {
        // AI URL context also failed — fall through to error
      }
    }

    // Try AI with extracted text to fill in gaps
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
