export type Category = "dessert" | "main";

export type UnitSystem = "metric" | "imperial";

export type SourceType = "link" | "photo" | "social";

export interface Ingredient {
  name: string;
  /** Quantity in the base unit (see unit) */
  quantity: number;
  /** Base unit, e.g. "g", "ml", "cup", "tbsp", "tsp", "piece" */
  unit: string;
  /** Estimated cost in dollars for this ingredient */
  cost: number;
}

export interface Recipe {
  id: string;
  title: string;
  category: Category;
  /** Image URL or path */
  image: string;
  /** Where the recipe came from: a link, a photo, or a social media post */
  source: { type: SourceType; value: string };
  servings: number;
  /** Prep time in minutes */
  prepTime: number;
  /** Cook time in minutes */
  cookTime: number;
  /** 1-5 health rating */
  healthRating: number;
  ingredients: Ingredient[];
  instructions: string[];
}

/** A substitute required for a recipe when the user lacks an ingredient. */
export interface SubstituteNeeded {
  /** The ingredient the recipe calls for that the user does not have. */
  ingredient: string;
  /** What the user can use instead (using only ingredients they have). */
  substituteWith: string;
  /** Warning explaining the substitution and that it may change the dish. */
  warning: string;
}

/** A recipe returned by the "Eat My Fridge" AI search. */
export interface FridgeRecipe {
  title: string;
  /** Image URL (absolute https URL, may be empty string). */
  image: string;
  /** Source URL of the original recipe. */
  sourceUrl: string;
  servings: number;
  /** Prep time in minutes */
  prepTime: number;
  /** Cook time in minutes */
  cookTime: number;
  /** 1-5 health rating */
  healthRating: number;
  ingredients: Ingredient[];
  instructions: string[];
  /** Ingredients the user doesn't have but for which an easy substitute exists. */
  substitutesNeeded: SubstituteNeeded[];
}
