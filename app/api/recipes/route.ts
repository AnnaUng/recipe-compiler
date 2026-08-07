import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import type { Category, Ingredient, Recipe, SourceType } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const category = searchParams.get("category");

    if (id) {
      const recipe = await fetchRecipeById(id);
      if (!recipe) {
        return NextResponse.json({ error: "Recipe not found" }, { status: 404 });
      }
      return NextResponse.json({ recipe });
    }

    const supabase = await getSupabase();
    let query = supabase
      .from("recipes")
      .select("*")
      .order("created_at", { ascending: false });

    if (category === "main" || category === "dessert") {
      query = query.eq("category", category);
    }

    const { data: rows, error } = await query;

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const recipeRows = (rows as RecipeRow[]) || [];
    const recipes: Recipe[] = [];

    for (const row of recipeRows) {
      const recipe = await fetchRecipeById(row.id);
      if (recipe) recipes.push(recipe);
    }

    return NextResponse.json({ recipes });
  } catch {
    return NextResponse.json(
      { error: "Failed to load recipes." },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const category: Category =
      body.category === "dessert" ? "dessert" : "main";
    const image = typeof body.image === "string" ? body.image : "";
    const sourceType: SourceType =
      body.source?.type === "photo" || body.source?.type === "social"
        ? body.source.type
        : "link";
    const sourceValue =
      typeof body.source?.value === "string" ? body.source.value : "";
    const servings = Number(body.servings) || 4;
    const prepTime = Number(body.prepTime) || 0;
    const cookTime = Number(body.cookTime) || 0;
    const healthRating = Math.min(
      5,
      Math.max(1, Math.round(Number(body.healthRating) || 3))
    );

    const ingredients: Ingredient[] = Array.isArray(body.ingredients)
      ? body.ingredients.filter(
          (i: Ingredient) => typeof i.name === "string" && i.name.trim()
        )
      : [];
    const instructions: string[] = Array.isArray(body.instructions)
      ? body.instructions.filter(
          (s: unknown) => typeof s === "string" && s.trim()
        )
      : [];

    if (!title) {
      return NextResponse.json(
        { error: "Recipe title is required." },
        { status: 400 }
      );
    }
    if (ingredients.length === 0) {
      return NextResponse.json(
        { error: "At least one ingredient is required." },
        { status: 400 }
      );
    }

    const supabase = await getSupabase();

    // Insert the recipe
    const { data: recipeRow, error: recipeError } = await supabase
      .from("recipes")
      .insert({
        title,
        category,
        image,
        source_type: sourceType,
        source_value: sourceValue,
        servings,
        prep_time: prepTime,
        cook_time: cookTime,
        health_rating: healthRating,
      })
      .select("id")
      .single<{ id: string }>();

    if (recipeError || !recipeRow) {
      return NextResponse.json(
        { error: recipeError?.message || "Failed to save recipe." },
        { status: 500 }
      );
    }

    const recipeId = recipeRow.id;

    // Insert ingredients (preserving order)
    const { error: ingredientsError } = await supabase
      .from("ingredients")
      .insert(
        ingredients.map((ing, i) => ({
          recipe_id: recipeId,
          name: ing.name.trim(),
          quantity: Number(ing.quantity) || 0,
          unit: ing.unit || "piece",
          cost: Number(ing.cost) || 0,
          position: i,
        }))
      );

    if (ingredientsError) {
      // Roll back the recipe row so we don't leave an orphan
      await supabase.from("recipes").delete().eq("id", recipeId);
      return NextResponse.json(
        { error: ingredientsError.message },
        { status: 500 }
      );
    }

    // Insert instructions (preserving order)
    const { error: instructionsError } = await supabase
      .from("instructions")
      .insert(
        instructions.map((text, i) => ({
          recipe_id: recipeId,
          step_number: i + 1,
          text: text.trim(),
        }))
      );

    if (instructionsError) {
      await supabase.from("recipes").delete().eq("id", recipeId);
      return NextResponse.json(
        { error: instructionsError.message },
        { status: 500 }
      );
    }

    const recipe = await fetchRecipeById(recipeId);
    return NextResponse.json({ recipe }, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to save recipe." },
      { status: 500 }
    );
  }
}