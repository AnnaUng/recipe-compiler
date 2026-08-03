import { NextRequest, NextResponse } from "next/server";
import type { FridgeRecipe, Ingredient, SubstituteNeeded } from "@/lib/types";

export const runtime = "nodejs";

/** Pantry staples assumed to be available in every kitchen. */
const PANTRY_STAPLES = new Set([
  "salt",
  "black pepper",
  "water",
  "pepper",
  "salt and pepper",
]);

/** Normalize an ingredient name for matching (lowercase, trimmed). */
function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Light server-side safety net: if a recipe ingredient is not in the user's
 * selected list (and not a pantry staple) and the AI did not already declare a
 * substitute for it, add a generic warning so nothing slips by silently.
 */
function crossCheckSubstitutes(
  recipe: FridgeRecipe,
  userIngredients: string[]
): void {
  const userSet = new Set(userIngredients.map(normalizeName));
  const declared = new Set(
    recipe.substitutesNeeded.map((s) => normalizeName(s.ingredient))
  );

  for (const ing of recipe.ingredients) {
    const name = normalizeName(ing.name);
    if (PANTRY_STAPLES.has(name)) continue;
    if (userSet.has(name)) continue;
    // Check if the user has a close variant (e.g. "chicken" vs "chicken breast")
    const hasVariant = [...userSet].some(
      (u) => u.includes(name) || name.includes(u)
    );
    if (hasVariant) continue;
    if (declared.has(name)) continue;

    // Add a generic warning for the undeclared missing ingredient
    recipe.substitutesNeeded.push({
      ingredient: ing.name,
      substituteWith: "an ingredient you may need to source",
      warning: `This recipe uses "${ing.name}" which is not in your selected ingredients. You may need to find a substitute or omit it, which could change the dish.`,
    });
  }
}

/** Validate and normalize a raw parsed object into a FridgeRecipe. */
function normalizeRecipe(raw: unknown): FridgeRecipe | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as Record<string, unknown>;

  const title = typeof obj.title === "string" ? obj.title : "";
  if (!title) return null;

  const image = typeof obj.image === "string" ? obj.image : "";
  const sourceUrl = typeof obj.sourceUrl === "string" ? obj.sourceUrl : "";

  const servings =
    typeof obj.servings === "number" && obj.servings > 0
      ? Math.round(obj.servings)
      : 4;
  const prepTime =
    typeof obj.prepTime === "number" && obj.prepTime >= 0
      ? Math.round(obj.prepTime)
      : 0;
  const cookTime =
    typeof obj.cookTime === "number" && obj.cookTime >= 0
      ? Math.round(obj.cookTime)
      : 0;
  const healthRating =
    typeof obj.healthRating === "number" &&
    obj.healthRating >= 1 &&
    obj.healthRating <= 5
      ? Math.round(obj.healthRating)
      : 3;

  const ingredients: Ingredient[] = [];
  if (Array.isArray(obj.ingredients)) {
    for (const ing of obj.ingredients) {
      if (!ing || typeof ing !== "object") continue;
      const i = ing as Record<string, unknown>;
      const name = typeof i.name === "string" ? i.name.trim() : "";
      if (!name) continue;
      ingredients.push({
        name,
        quantity: typeof i.quantity === "number" ? i.quantity : 0,
        unit: typeof i.unit === "string" ? i.unit : "piece",
        cost: typeof i.cost === "number" ? i.cost : 0,
      });
    }
  }

  const instructions: string[] = [];
  if (Array.isArray(obj.instructions)) {
    for (const step of obj.instructions) {
      if (typeof step === "string" && step.trim()) {
        instructions.push(step.trim());
      }
    }
  }

  const substitutesNeeded: SubstituteNeeded[] = [];
  if (Array.isArray(obj.substitutesNeeded)) {
    for (const sub of obj.substitutesNeeded) {
      if (!sub || typeof sub !== "object") continue;
      const s = sub as Record<string, unknown>;
      const ingredient = typeof s.ingredient === "string" ? s.ingredient.trim() : "";
      const substituteWith =
        typeof s.substituteWith === "string" ? s.substituteWith.trim() : "";
      const warning = typeof s.warning === "string" ? s.warning.trim() : "";
      if (ingredient) {
        substitutesNeeded.push({ ingredient, substituteWith, warning });
      }
    }
  }

  return {
    title,
    image,
    sourceUrl,
    servings,
    prepTime,
    cookTime,
    healthRating,
    ingredients,
    instructions,
    substitutesNeeded,
  };
}

/** Check if the configured provider is Google Gemini. */
function isGeminiProvider(baseUrl: string): boolean {
  return baseUrl.includes("generativelanguage.googleapis.com");
}

/** Check if the configured provider is Perplexity (does web search by default). */
function isPerplexityProvider(baseUrl: string): boolean {
  return baseUrl.includes("perplexity.ai");
}

/**
 * Call Gemini's native generateContent API with Google Search grounding.
 * Returns the text content. Throws on error (caller should fall back).
 */
async function callGeminiNative(
  prompt: string,
  apiKey: string,
  model: string
): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": apiKey,
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }],
        },
      ],
      tools: [{ google_search: {} }],
      generationConfig: {
        temperature: 0.3,
      },
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Gemini API error: ${response.status} ${errorText.slice(0, 500)}`
    );
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return content;
}

/**
 * Call the OpenAI-compatible chat completions endpoint.
 * Returns the text content.
 */
async function callOpenAICompatible(
  prompt: string,
  apiKey: string,
  baseUrl: string,
  model: string
): Promise<string> {
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.3,
    }),
    signal: AbortSignal.timeout(60000),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `AI API error: ${response.status} ${errorText.slice(0, 500)}`
    );
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}

/** Build the prompt, adjusting based on whether web search is available. */
function buildPrompt(ingredientList: string, webSearch: boolean): string {
  const searchInstruction = webSearch
    ? "Search the web and find 3 to 5 real, existing recipes that can be made using ONLY the following ingredients the user has at home:"
    : "Find 3 to 5 recipes that can be made using ONLY the following ingredients the user has at home. Use your knowledge of real recipes:";

  const sourceUrlInstruction = webSearch
    ? 'Each recipe must have a real "sourceUrl" pointing to the original recipe page on the web, and an "image" URL (absolute https URL, or empty string if none).'
    : 'For "sourceUrl", provide a real URL if you know one, or use an empty string if you are not sure. For "image", provide a real image URL if you know one, or use an empty string.';

  return `You are a recipe-finding assistant. ${searchInstruction}

${ingredientList}

STRICT RULES — follow exactly:
1. Every ingredient in each recipe MUST be one of the user's ingredients listed above (salt, black pepper, and water are always allowed as pantry staples).
2. The ONLY exception: a recipe may include an ingredient the user does NOT have IF AND ONLY IF a common, easy 1:1 substitute exists that uses only ingredients the user already has (or water/salt/pepper). For example, buttermilk can be substituted with milk + vinegar/lemon juice.
3. Do NOT suggest skipping a core structural ingredient (like flour in bread or eggs in a souffle) as a "substitute" — if a core ingredient is missing and has no real substitute, do not include that recipe.
4. For every exception under rule 2, you MUST include an entry in the "substitutesNeeded" array with: the missing ingredient, the substitute to use, and a clear warning that the substitute may slightly change the taste or texture of the dish.
5. Prefer recipes that use as many of the user's ingredients as possible and require few or no substitutes.
6. ${sourceUrlInstruction}

Return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{
  "recipes": [
    {
      "title": "string",
      "image": "string (https URL or empty string)",
      "sourceUrl": "string (https URL of the original recipe, or empty string)",
      "servings": number,
      "prepTime": number (minutes),
      "cookTime": number (minutes),
      "healthRating": number (1-5),
      "ingredients": [{ "name": "string", "quantity": number, "unit": "string (g, kg, ml, l, tsp, tbsp, cup, piece, clove)", "cost": number }],
      "instructions": ["string"],
      "substitutesNeeded": [
        { "ingredient": "string", "substituteWith": "string", "warning": "string" }
      ]
    }
  ]
}

If you cannot find any recipes that satisfy the strict rules, return { "recipes": [] }.`;
}

export async function POST(req: NextRequest) {
  try {
    const { ingredients } = await req.json();

    if (
      !ingredients ||
      !Array.isArray(ingredients) ||
      ingredients.length === 0
    ) {
      return NextResponse.json(
        { error: "Please select at least one ingredient." },
        { status: 400 }
      );
    }

    const userIngredients = ingredients.filter(
      (i: unknown) => typeof i === "string" && i.trim()
    );

    if (userIngredients.length === 0) {
      return NextResponse.json(
        { error: "Please select at least one ingredient." },
        { status: 400 }
      );
    }

    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        {
          error:
            "AI_API_KEY is not configured. Add it to your .env.local file.",
        },
        { status: 500 }
      );
    }

    const baseUrl = process.env.AI_API_BASE_URL || "https://api.openai.com/v1";
    const model = process.env.AI_MODEL || "gpt-4o";

    const ingredientList = userIngredients.join(", ");
    let content = "";
    let webSearchUsed = false;

    if (isGeminiProvider(baseUrl)) {
      // Try Gemini native API with Google Search grounding first
      try {
        const nativePrompt = buildPrompt(ingredientList, true);
        content = await callGeminiNative(nativePrompt, apiKey, model);
        webSearchUsed = true;
      } catch {
        // Fall back to OpenAI-compatible endpoint (no web search on free tier)
        const fallbackPrompt = buildPrompt(ingredientList, false);
        try {
          content = await callOpenAICompatible(
            fallbackPrompt,
            apiKey,
            baseUrl,
            model
          );
        } catch (fallbackError) {
          const msg =
            fallbackError instanceof Error
              ? fallbackError.message
              : "Unknown error";
          return NextResponse.json({ error: msg }, { status: 502 });
        }
      }
    } else {
      // Non-Gemini provider (e.g., Perplexity, OpenAI)
      webSearchUsed = isPerplexityProvider(baseUrl);
      const prompt = buildPrompt(ingredientList, webSearchUsed);
      try {
        content = await callOpenAICompatible(
          prompt,
          apiKey,
          baseUrl,
          model
        );
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Unknown error";
        return NextResponse.json({ error: msg }, { status: 502 });
      }
    }

    // Strip markdown code fences if present
    const cleaned = content
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    let parsed: { recipes?: unknown[] };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid JSON. Please try again." },
        { status: 502 }
      );
    }

    const recipes: FridgeRecipe[] = [];
    if (Array.isArray(parsed.recipes)) {
      for (const raw of parsed.recipes) {
        const recipe = normalizeRecipe(raw);
        if (recipe) {
          crossCheckSubstitutes(recipe, userIngredients);
          recipes.push(recipe);
        }
      }
    }

    return NextResponse.json({ recipes, webSearchUsed });
  } catch {
    return NextResponse.json(
      { error: "Failed to search for recipes. Please try again." },
      { status: 500 }
    );
  }
}