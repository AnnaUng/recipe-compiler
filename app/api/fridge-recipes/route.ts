import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import type { Category, Recipe, SourceType } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Pantry staples assumed to be available in every kitchen. */
const PANTRY_STAPLES = new Set([
  "salt",
  "black pepper",
  "pepper",
  "water",
  "salt and pepper",
  "olive oil",
  "vegetable oil",
  "cooking oil",
  "oil",
  "sugar",
  "all-purpose flour",
  "baking soda",
  "baking powder",
  "vanilla extract",
  "garlic",
  "onion",
]);

interface RecipeRow {
  id: string;
  title: string;
  category: Category;
  image: string;
  source_type: SourceType;
  source_value: string;
  servings: number;
  prep_time: number;
  cook_time: number;
  health_rating: number;
}

interface IngredientRow {
  name: string;
  quantity: number;
  unit: string;
  cost: number;
  position: number;
}

interface InstructionRow {
  step_number: number;
  text: string;
}

/** Normalize an ingredient name for matching (lowercase, trimmed). */
function normalizeName(name: string): string {
  return name.trim().toLowerCase();
}

/** Map a DB recipe row + its children into the app's Recipe type. */
function toRecipe(
  row: RecipeRow,
  ingredients: IngredientRow[],
  instructions: InstructionRow[]
): Recipe {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    image: row.image,
    source: { type: row.source_type, value: row.source_value },
    servings: row.servings,
    prepTime: row.prep_time,
    cookTime: row.cook_time,
    healthRating: row.health_rating,
    ingredients: ingredients
      .sort((a, b) => a.position - b.position)
      .map((i) => ({
        name: i.name,
        quantity: Number(i.quantity),
        unit: i.unit,
        cost: Number(i.cost),
      })),
    instructions: instructions
      .sort((a, b) => a.step_number - b.step_number)
      .map((s) => s.text),
  };
}

/** Create a Supabase server client bound to the current request's cookies. */
async function getSupabase() {
  const cookieStore = await cookies();
  return createClient(cookieStore);
}

/** Fetch a single recipe (with children) by id. Returns null if not found. */
async function fetchRecipeById(id: string): Promise<Recipe | null> {
  const supabase = await getSupabase();
  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .select("*")
    .eq("id", id)
    .maybeSingle<RecipeRow>();

  if (recipeError || !recipe) return null;

  const { data: ingredients } = await supabase
    .from("ingredients")
    .select("name, quantity, unit, cost, position")
    .eq("recipe_id", id)
    .order("position", { ascending: true });

  const { data: instructions } = await supabase
    .from("instructions")
    .select("step_number, text")
    .eq("recipe_id", id)
    .order("step_number", { ascending: true });

  return toRecipe(
    recipe,
    (ingredients as IngredientRow[]) || [],
    (instructions as InstructionRow[]) || []
  );
}

/** Load all family recipes from Supabase. */
async function loadAllRecipes(): Promise<Recipe[]> {
  const supabase = await getSupabase();
  const { data: rows, error } = await supabase
    .from("recipes")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Failed to load recipes:", error.message);
    return [];
  }

  const recipeRows = (rows as RecipeRow[]) || [];
  const recipes: Recipe[] = [];
  for (const row of recipeRows) {
    const recipe = await fetchRecipeById(row.id);
    if (recipe) recipes.push(recipe);
  }
  return recipes;
}

/** Check whether a recipe ingredient is covered by the user's selection. */
function isCovered(
  ingredientName: string,
  userSet: Set<string>
): boolean {
  const name = normalizeName(ingredientName);
  if (PANTRY_STAPLES.has(name)) return true;
  if (userSet.has(name)) return true;
  // Close variant match, e.g. "chicken" vs "chicken breast"
  return [...userSet].some(
    (u) => u.includes(name) || name.includes(u)
  );
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

    const userSet = new Set(userIngredients.map(normalizeName));
    const recipes = await loadAllRecipes();

    interface Match {
      recipe: Recipe;
      matchCount: number;
      totalCount: number;
      missing: string[];
    }

    const matches: Match[] = [];

    for (const recipe of recipes) {
      const totalCount = recipe.ingredients.length;
      if (totalCount === 0) continue;

      const missing: string[] = [];
      let matchCount = 0;

      for (const ing of recipe.ingredients) {
        if (isCovered(ing.name, userSet)) {
          matchCount++;
        } else {
          missing.push(ing.name);
        }
      }

      // Only include recipes where at least half the ingredients are covered
      if (matchCount / totalCount >= 0.5) {
        matches.push({ recipe, matchCount, totalCount, missing });
      }
    }

    // Sort by match percentage (highest first), then by fewest missing
    matches.sort((a, b) => {
      const pctA = a.matchCount / a.totalCount;
      const pctB = b.matchCount / b.totalCount;
      if (pctB !== pctA) return pctB - pctA;
      return a.missing.length - b.missing.length;
    });

    return NextResponse.json({
      recipes: matches.map((m) => ({
        ...m.recipe,
        matchCount: m.matchCount,
        totalCount: m.totalCount,
        missingIngredients: m.missing,
      })),
      webSearchUsed: false,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to search for recipes. Please try again." },
      { status: 500 }
    );
  }
}