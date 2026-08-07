import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import type { Category, Recipe, SourceType } from "./types";

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

/** Create a Supabase server client bound to the current request's cookies. */
async function getSupabase() {
  const cookieStore = await cookies();
  return createClient(cookieStore);
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

/** Fetch a single recipe (with children) by id. Returns null if not found. */
export async function getRecipeById(id: string): Promise<Recipe | null> {
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

/** Fetch all recipes, optionally filtered by category. */
export async function getRecipes(
  category?: Category
): Promise<Recipe[]> {
  const supabase = await getSupabase();

  let query = supabase
    .from("recipes")
    .select("*")
    .order("created_at", { ascending: false });

  if (category) {
    query = query.eq("category", category);
  }

  const { data: rows, error } = await query;

  if (error) {
    console.error("Failed to load recipes:", error.message);
    return [];
  }

  const recipeRows = (rows as RecipeRow[]) || [];
  const recipes: Recipe[] = [];

  for (const row of recipeRows) {
    const recipe = await getRecipeById(row.id);
    if (recipe) recipes.push(recipe);
  }

  return recipes;
}

/** Fetch recipes in a category. */
export async function getRecipesByCategory(
  category: Category
): Promise<Recipe[]> {
  return getRecipes(category);
}

