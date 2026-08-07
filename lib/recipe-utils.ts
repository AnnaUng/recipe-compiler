import type { Ingredient, Recipe } from "./types";

/** Total cost of a recipe's ingredients. */
export function getTotalCost(recipe: Recipe): number {
  return recipe.ingredients.reduce((sum, ing) => sum + ing.cost, 0);
}

/** Re-export types used by callers. */
export type { Ingredient };