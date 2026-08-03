import type { Ingredient, UnitSystem } from "./types";

/**
 * Conversion factors to/from a canonical base unit.
 * Each unit maps to a factor relative to its base (grams for weight, ml for volume).
 */
const WEIGHT_TO_GRAMS: Record<string, number> = {
  g: 1,
  kg: 1000,
  oz: 28.3495,
  lb: 453.592,
};

const VOLUME_TO_ML: Record<string, number> = {
  ml: 1,
  l: 1000,
  tsp: 4.92892,
  tbsp: 14.7868,
  cup: 236.588,
  floz: 29.5735,
};

const PIECE_UNITS = new Set(["piece", "clove", "slice", "pinch"]);

/**
 * Density of common baking ingredients in grams per milliliter.
 * Used to convert weight (g) to volume (cups/tbsp/tsp) in imperial mode.
 */
const DENSITY_G_PER_ML: Record<string, number> = {
  "all-purpose flour": 0.53,
  "bread flour": 0.55,
  "whole wheat flour": 0.55,
  "cake flour": 0.5,
  "granulated sugar": 0.85,
  sugar: 0.85,
  "brown sugar": 0.72,
  "powdered sugar": 0.56,
  "confectioners sugar": 0.56,
  butter: 0.91,
  "unsalted butter": 0.91,
  "salt": 1.2,
  "kosher salt": 0.6,
  "chocolate chips": 0.53,
  "semisweet chocolate chips": 0.53,
  "dark chocolate chips": 0.53,
  "milk chocolate chips": 0.53,
  honey: 1.42,
  milk: 1.03,
  "whole milk": 1.03,
  "heavy cream": 1.0,
  "olive oil": 0.92,
  "vegetable oil": 0.92,
  "coconut oil": 0.92,
  "canola oil": 0.92,
  "rolled oats": 0.4,
  "quick oats": 0.4,
  "white rice": 0.8,
  "brown rice": 0.8,
  "cocoa powder": 0.53,
  "baking powder": 0.9,
  "baking soda": 0.9,
  "cornstarch": 0.53,
  "corn starch": 0.53,
  "peanut butter": 1.09,
  "almond flour": 0.5,
  "shredded cheese": 0.4,
  "grated parmesan": 0.5,
  "yogurt": 1.03,
  "greek yogurt": 1.03,
  "sour cream": 1.0,
  "maple syrup": 1.33,
  "molasses": 1.4,
  "coconut flakes": 0.35,
  "chopped nuts": 0.5,
  "walnuts": 0.5,
  "pecans": 0.5,
  "almonds": 0.5,
  "dried cranberries": 0.5,
  "raisins": 0.5,
};

export function isWeightUnit(unit: string): boolean {
  return unit in WEIGHT_TO_GRAMS;
}

export function isVolumeUnit(unit: string): boolean {
  return unit in VOLUME_TO_ML;
}

export function isPieceUnit(unit: string): boolean {
  return PIECE_UNITS.has(unit);
}

/** Convert a quantity from one unit to another (metric <-> imperial). */
export function convertQuantity(
  quantity: number,
  fromUnit: string,
  toUnit: string
): number {
  if (fromUnit === toUnit) return quantity;

  if (isWeightUnit(fromUnit) && isWeightUnit(toUnit)) {
    return (quantity * WEIGHT_TO_GRAMS[fromUnit]) / WEIGHT_TO_GRAMS[toUnit];
  }
  if (isVolumeUnit(fromUnit) && isVolumeUnit(toUnit)) {
    return (quantity * VOLUME_TO_ML[fromUnit]) / VOLUME_TO_ML[toUnit];
  }
  // Piece units don't convert
  return quantity;
}

/** Look up density for an ingredient name (g/ml), case-insensitive. */
export function getDensity(name: string): number | undefined {
  const key = name.trim().toLowerCase();
  return DENSITY_G_PER_ML[key];
}

/**
 * Convert a weight in grams to a baking-friendly volume unit.
 * Returns the best unit (cup, tbsp, or tsp) and the converted quantity.
 */
export function gramsToBakingVolume(
  grams: number,
  density: number
): { quantity: number; unit: string } {
  const ml = grams / density;
  const cups = ml / VOLUME_TO_ML.cup;
  const tbsp = ml / VOLUME_TO_ML.tbsp;
  const tsp = ml / VOLUME_TO_ML.tsp;

  if (cups >= 0.25) {
    return { quantity: cups, unit: "cup" };
  }
  if (tbsp >= 1) {
    return { quantity: tbsp, unit: "tbsp" };
  }
  return { quantity: tsp, unit: "tsp" };
}

/** Convert an ingredient's quantity/unit to the target system. */
export function convertIngredient(
  ingredient: Ingredient,
  system: UnitSystem
): { quantity: number; unit: string } {
  const isMetric = system === "metric";

  // Piece units never convert
  if (isPieceUnit(ingredient.unit)) {
    return { quantity: ingredient.quantity, unit: ingredient.unit };
  }

  // Metric system: keep as-is (g, kg, ml, l)
  if (isMetric) {
    return { quantity: ingredient.quantity, unit: ingredient.unit };
  }

  // Imperial system (baking-friendly)
  // Volume: convert to cups/tbsp/tsp
  if (isVolumeUnit(ingredient.unit)) {
    const ml = ingredient.quantity * VOLUME_TO_ML[ingredient.unit];
    const cups = ml / VOLUME_TO_ML.cup;
    const tbsp = ml / VOLUME_TO_ML.tbsp;
    const tsp = ml / VOLUME_TO_ML.tsp;

    if (cups >= 0.25) {
      return { quantity: cups, unit: "cup" };
    }
    if (tbsp >= 1) {
      return { quantity: tbsp, unit: "tbsp" };
    }
    return { quantity: tsp, unit: "tsp" };
  }

  // Weight: if we know the density, convert to cups/tbsp/tsp (baking)
  if (isWeightUnit(ingredient.unit)) {
    const grams = ingredient.quantity * WEIGHT_TO_GRAMS[ingredient.unit];
    const density = getDensity(ingredient.name);

    if (density) {
      return gramsToBakingVolume(grams, density);
    }

    // Unknown density: convert to oz (or lb for large amounts)
    const oz = grams / WEIGHT_TO_GRAMS.oz;
    if (oz >= 16) {
      return { quantity: oz / 16, unit: "lb" };
    }
    return { quantity: oz, unit: "oz" };
  }

  return { quantity: ingredient.quantity, unit: ingredient.unit };
}

/** Format a quantity nicely, trimming trailing zeros. */
export function formatQuantity(value: number): string {
  const rounded = Math.round(value * 100) / 100;
  return String(rounded);
}