import { parseHTML } from "linkedom";

export interface RecipeStructuredData {
  title: string | null;
  descriptionShort: string | null;
  ingredients: string[] | null;
  steps: string[] | null;
  prepTimeMinutes: number | null;
  cookTimeMinutes: number | null;
  servings: string | null;
  imageUrl: string | null;
}

export interface ExtractResult {
  text: string;
  imageUrl: string | null;
  structured: RecipeStructuredData | null;
}

/** Parse ISO 8601 duration (PT30M, PT1H15M, etc.) to minutes */
function parseDuration(duration: string | undefined | null): number | null {
  if (!duration || typeof duration !== "string") return null;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/i);
  if (!match) return null;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  const total = hours * 60 + minutes;
  return total > 0 ? total : null;
}

/** Extract step text from Schema.org HowToStep / HowToSection */
function parseSteps(steps: unknown): string[] | null {
  if (!steps) return null;
  const arr = Array.isArray(steps) ? steps : [steps];
  const result: string[] = [];

  for (const item of arr) {
    if (typeof item === "string") {
      result.push(item);
    } else if (item?.text) {
      result.push(item.text);
    } else if (item?.name && !item?.text) {
      // Some sites use HowToStep with only a name property
      result.push(item.name);
    } else if (item?.itemListElement) {
      const nested = parseSteps(item.itemListElement);
      if (nested) result.push(...nested);
    }
  }

  return result.length > 0 ? result : null;
}

/** Extract structured Recipe data from JSON-LD */
function extractStructuredRecipe(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  doc: any,
  baseUrl: string
): RecipeStructuredData | null {
  const ldScripts = doc.querySelectorAll('script[type="application/ld+json"]');

  for (const script of ldScripts) {
    try {
      const data = JSON.parse(script.textContent || "");
      const items = Array.isArray(data) ? data : [data];

      for (const item of items) {
        // Handle @graph arrays (common in WordPress)
        const candidates = item["@graph"]
          ? [...items, ...item["@graph"]]
          : items;

        for (const candidate of candidates) {
          const type = candidate["@type"];
          const isRecipe =
            type === "Recipe" ||
            (Array.isArray(type) && type.includes("Recipe"));
          if (!isRecipe) continue;

          // Image
          let imageUrl: string | null = null;
          const img = candidate.image;
          if (typeof img === "string" && img.startsWith("http")) {
            imageUrl = img;
          } else if (
            Array.isArray(img) &&
            typeof img[0] === "string" &&
            img[0].startsWith("http")
          ) {
            imageUrl = img[0];
          } else if (img?.url) {
            imageUrl = img.url;
          }

          // Ingredients
          const rawIngredients = candidate.recipeIngredient;
          const ingredients =
            Array.isArray(rawIngredients) && rawIngredients.length > 0
              ? rawIngredients.map(String)
              : null;

          // Servings
          const yld = candidate.recipeYield;
          const servings = yld
            ? String(Array.isArray(yld) ? yld[0] : yld)
            : null;

          // Parse times — fall back to totalTime if prep/cook missing
          const prepTimeMinutes = parseDuration(candidate.prepTime);
          const cookTimeMinutes = parseDuration(candidate.cookTime);
          const totalTime = parseDuration(candidate.totalTime);

          return {
            title: candidate.name || null,
            descriptionShort: candidate.description || null,
            ingredients,
            steps: parseSteps(candidate.recipeInstructions),
            prepTimeMinutes,
            cookTimeMinutes: cookTimeMinutes ?? (totalTime && !prepTimeMinutes ? totalTime : null),
            servings,
            imageUrl,
          };
        }
      }
    } catch {
      // invalid JSON, continue
    }
  }

  return null;
}

function extractImageUrl(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  document: any,
  baseUrl: string
): string | null {
  // 1. og:image meta tag
  const ogImage = document
    .querySelector('meta[property="og:image"]')
    ?.getAttribute("content");
  if (ogImage) {
    try {
      return new URL(ogImage, baseUrl).href;
    } catch {
      // invalid URL, continue
    }
  }

  // 2. First reasonably-sized <img> in the body
  const imgs = document.querySelectorAll("img[src]");
  for (const img of imgs) {
    const src = img.getAttribute("src");
    if (!src) continue;
    const width = parseInt(img.getAttribute("width") || "0", 10);
    if (width > 0 && width < 200) continue;
    try {
      return new URL(src, baseUrl).href;
    } catch {
      continue;
    }
  }

  return null;
}

export async function extractFromUrl(url: string): Promise<ExtractResult> {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to fetch URL: ${response.status} ${response.statusText}`
    );
  }

  const html = await response.text();
  const { document } = parseHTML(html);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const doc = document as any;

  // Try structured Recipe data first
  const structured = extractStructuredRecipe(doc, url);

  // Extract image (structured data image takes priority)
  const imageUrl = structured?.imageUrl || extractImageUrl(doc, url);

  // Extract text for AI fallback — strip non-content elements, keep recipe data
  const text = extractPageText(doc);

  return {
    text,
    imageUrl,
    structured,
  };
}

/** Extract meaningful page text for AI, stripping navigation/scripts/ads */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractPageText(doc: any): string {
  // 1. Grab JSON-LD recipe text BEFORE removing scripts — this often has
  //    ingredients and steps even when the visible page doesn't
  let jsonLdText = "";
  try {
    const ldScripts = doc.querySelectorAll(
      'script[type="application/ld+json"]'
    );
    for (const script of ldScripts) {
      const raw = script.textContent || "";
      if (raw.includes("Recipe") || raw.includes("recipeIngredient")) {
        jsonLdText += raw + "\n";
      }
    }
  } catch {
    // ignore
  }

  // 2. Remove elements that add noise
  const removeSelectors = [
    "script",
    "style",
    "noscript",
    "nav",
    "footer",
    "header",
    "iframe",
    "[role='navigation']",
    "[role='banner']",
    "[role='contentinfo']",
    ".ad",
    ".ads",
    ".advertisement",
    ".sidebar",
    ".comments",
    "#comments",
  ];

  for (const sel of removeSelectors) {
    try {
      const els = doc.querySelectorAll(sel);
      for (const el of els) el.remove();
    } catch {
      // selector not supported, skip
    }
  }

  const bodyText = doc.body?.textContent || "";

  // 3. Collapse whitespace
  const cleanedBody = bodyText
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n/g, "\n")
    .trim();

  // 4. Combine: body text first, then JSON-LD as supplementary data
  //    Cap total at 12000 chars for Gemini
  const bodyPortion = cleanedBody.slice(0, 8000);
  const jsonLdPortion = jsonLdText ? "\n\nJSON-LD Recipe Data:\n" + jsonLdText.slice(0, 4000) : "";

  return (bodyPortion + jsonLdPortion).trim();
}
