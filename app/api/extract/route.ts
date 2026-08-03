import { NextRequest, NextResponse } from "next/server";
import { fetchTranscript } from "youtube-transcript";

export const runtime = "nodejs";

type JsonLdNode = Record<string, unknown>;

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/** Parse an ISO-8601 duration like "PT30M" or "PT1H30M" into minutes. */
function parseDuration(duration: unknown): number {
  if (typeof duration !== "string") return 0;
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] || "0", 10);
  const minutes = parseInt(match[2] || "0", 10);
  return hours * 60 + minutes;
}

/** Parse a quantity string like "1 1/2", "2.5", "3" into a number. */
function parseQuantity(value: string): number {
  const trimmed = value.trim();
  // Handle mixed numbers like "1 1/2"
  const mixed = trimmed.match(/^(\d+)\s+(\d+)\/(\d+)$/);
  if (mixed) {
    return parseInt(mixed[1], 10) + parseInt(mixed[2], 10) / parseInt(mixed[3], 10);
  }
  // Handle fractions like "1/2"
  const frac = trimmed.match(/^(\d+)\/(\d+)$/);
  if (frac) {
    return parseInt(frac[1], 10) / parseInt(frac[2], 10);
  }
  const num = parseFloat(trimmed);
  return isNaN(num) ? 0 : num;
}

/** Normalize a unit string to our supported units. */
function normalizeUnit(unit: string): string {
  const u = unit.trim().toLowerCase();
  const map: Record<string, string> = {
    g: "g",
    gram: "g",
    grams: "g",
    kg: "kg",
    kilogram: "kg",
    kilograms: "kg",
    ml: "ml",
    milliliter: "ml",
    milliliters: "ml",
    l: "l",
    liter: "l",
    liters: "l",
    tsp: "tsp",
    teaspoon: "tsp",
    teaspoons: "tsp",
    tbsp: "tbsp",
    tablespoon: "tbsp",
    tablespoons: "tbsp",
    cup: "cup",
    cups: "cup",
    oz: "oz",
    ounce: "oz",
    ounces: "oz",
    lb: "lb",
    pound: "lb",
    pounds: "lb",
    piece: "piece",
    pieces: "piece",
    clove: "clove",
    cloves: "clove",
    slice: "slice",
    slices: "slice",
    pinch: "pinch",
    pinches: "pinch",
    can: "piece",
    cans: "piece",
    "": "piece",
  };
  return map[u] || "piece";
}

interface ExtractedIngredient {
  name: string;
  quantity: number;
  unit: string;
  cost: number;
}

interface ExtractedRecipe {
  title: string;
  category: "main" | "dessert";
  servings: number;
  prepTime: number;
  cookTime: number;
  healthRating: number;
  ingredients: ExtractedIngredient[];
  instructions: string[];
  image: string;
}

function isRecipeNode(node: JsonLdNode): boolean {
  const type = node["@type"];
  return type === "Recipe" || (Array.isArray(type) && type.includes("Recipe"));
}

/** Extract a recipe from a JSON-LD object. */
function extractFromJsonLd(data: unknown): ExtractedRecipe | null {
  if (!data) return null;

  // Handle arrays
  if (Array.isArray(data)) {
    for (const item of data) {
      const result = extractFromJsonLd(item);
      if (result) return result;
    }
    return null;
  }

  if (typeof data !== "object") return null;

  const node = data as JsonLdNode;

  // If this is a @graph, search within it
  if (node["@graph"]) {
    const result = extractFromJsonLd(node["@graph"]);
    if (result) return result;
  }

  // Check if this object is a Recipe
  if (!isRecipeNode(node)) return null;

  const ingredients: ExtractedIngredient[] = [];
  const rawIngredients = node.recipeIngredient ?? node.ingredients ?? [];
  if (Array.isArray(rawIngredients)) {
    for (const raw of rawIngredients) {
      if (typeof raw === "string") {
        // Parse "2 cups flour" style strings
        const match = raw.match(/^([\d\s./]+)\s*([a-zA-Z]+)?\s*(.*)$/);
        if (match) {
          const quantity = parseQuantity(match[1]);
          const unit = normalizeUnit(match[2] || "");
          const name = (match[3] || raw).trim();
          if (name) {
            ingredients.push({ name, quantity, unit, cost: 0 });
          }
        }
      } else if (raw && typeof raw === "object") {
        const ing = raw as JsonLdNode;
        const name = typeof ing.name === "string" ? ing.name : "";
        const quantity = parseQuantity(String(ing.quantity ?? "0"));
        const unit = normalizeUnit(typeof ing.unit === "string" ? ing.unit : "");
        if (name) {
          ingredients.push({ name, quantity, unit, cost: 0 });
        }
      }
    }
  }

  const instructions: string[] = [];
  const rawInstructions = node.recipeInstructions ?? [];
  if (Array.isArray(rawInstructions)) {
    for (const step of rawInstructions) {
      if (typeof step === "string") {
        instructions.push(step);
      } else if (step && typeof step === "object") {
        const stepNode = step as JsonLdNode;
        if (typeof stepNode.text === "string") instructions.push(stepNode.text);
        if (Array.isArray(stepNode.itemListElement)) {
          for (const item of stepNode.itemListElement) {
            if (item && typeof item === "object") {
              const itemNode = item as JsonLdNode;
              if (typeof itemNode.text === "string") instructions.push(itemNode.text);
            }
          }
        }
      }
    }
  }

  const categoryRaw = String(node.recipeCategory ?? "").toLowerCase();
  const category =
    categoryRaw.includes("dessert") ||
    categoryRaw.includes("sweet") ||
    categoryRaw.includes("cake") ||
    categoryRaw.includes("cookie") ||
    categoryRaw.includes("bake")
      ? "dessert"
      : "main";

  const yieldValue = node.recipeYield;
  const servingsRaw = Array.isArray(yieldValue) ? yieldValue[0] : yieldValue;
  const servings = parseInt(String(servingsRaw ?? "4"), 10) || 4;

  const imageValue = node.image;
  const image = Array.isArray(imageValue)
    ? String(imageValue[0] ?? "")
    : typeof imageValue === "string"
    ? imageValue
    : "";

  return {
    title: typeof node.name === "string" ? node.name : "",
    category,
    servings,
    prepTime: parseDuration(node.prepTime),
    cookTime: parseDuration(node.cookTime),
    healthRating: 3,
    ingredients,
    instructions,
    image,
  };
}

/** Fetch a page and extract JSON-LD recipe data. */
async function scrapeRecipe(url: string): Promise<ExtractedRecipe | null> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36",
      },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return null;
    const html = await res.text();

    // Extract all JSON-LD blocks
    const blocks: unknown[] = [];
    const regex = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
    let match;
    while ((match = regex.exec(html)) !== null) {
      try {
        blocks.push(JSON.parse(match[1].trim()));
      } catch {
        // Skip invalid JSON
      }
    }

    for (const block of blocks) {
      const recipe = extractFromJsonLd(block);
      if (recipe) return recipe;
    }
    return null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const videoId = extractVideoId(url);

    // YouTube: extract transcript
    if (videoId) {
      try {
        const transcript = await fetchTranscript(videoId);
        const text = transcript.map((t) => t.text).join(" ");
        return NextResponse.json({
          platform: "youtube",
          url,
          videoId,
          caption: text,
        });
      } catch {
        return NextResponse.json(
          { error: "Could not fetch transcript for this YouTube video." },
          { status: 500 }
        );
      }
    }

    // General recipe link: scrape the page for JSON-LD recipe data
    const recipe = await scrapeRecipe(url);
    if (recipe) {
      return NextResponse.json({
        platform: "web",
        url,
        recipe,
      });
    }

    // Fallback: no structured data found
    return NextResponse.json({
      platform: "other",
      url,
      caption: "",
      note: "Could not find structured recipe data on this page. The link has been saved — you can fill in the details manually.",
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}