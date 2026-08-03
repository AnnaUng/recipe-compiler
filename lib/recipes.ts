import type { Recipe } from "./types";

export const recipes: Recipe[] = [
  {
    id: "chocolate-chip-cookies",
    title: "Chocolate Chip Cookies",
    category: "dessert",
    image: "/next.svg",
    source: { type: "link", value: "https://example.com/chocolate-chip-cookies" },
    servings: 24,
    prepTime: 15,
    cookTime: 12,
    healthRating: 3,
    ingredients: [
      { name: "All-purpose flour", quantity: 280, unit: "g", cost: 0.6 },
      { name: "Butter", quantity: 226, unit: "g", cost: 2.5 },
      { name: "Brown sugar", quantity: 200, unit: "g", cost: 0.8 },
      { name: "Granulated sugar", quantity: 100, unit: "g", cost: 0.4 },
      { name: "Eggs", quantity: 2, unit: "piece", cost: 0.5 },
      { name: "Vanilla extract", quantity: 1, unit: "tsp", cost: 0.3 },
      { name: "Baking soda", quantity: 1, unit: "tsp", cost: 0.1 },
      { name: "Salt", quantity: 0.5, unit: "tsp", cost: 0.05 },
      { name: "Chocolate chips", quantity: 340, unit: "g", cost: 3.0 },
    ],
    instructions: [
      "Preheat oven to 180°C (350°F).",
      "Cream butter and sugars until light and fluffy.",
      "Add eggs and vanilla, mix well.",
      "Whisk flour, baking soda, and salt; fold into wet mixture.",
      "Stir in chocolate chips.",
      "Scoop onto baking sheets and bake 10-12 minutes.",
    ],
  },
  {
    id: "banana-bread",
    title: "Banana Bread",
    category: "dessert",
    image: "/file.svg",
    source: { type: "photo", value: "Imported photo" },
    servings: 10,
    prepTime: 15,
    cookTime: 60,
    healthRating: 4,
    ingredients: [
      { name: "Ripe bananas", quantity: 3, unit: "piece", cost: 1.2 },
      { name: "All-purpose flour", quantity: 250, unit: "g", cost: 0.5 },
      { name: "Butter", quantity: 113, unit: "g", cost: 1.3 },
      { name: "Sugar", quantity: 150, unit: "g", cost: 0.5 },
      { name: "Eggs", quantity: 2, unit: "piece", cost: 0.5 },
      { name: "Baking soda", quantity: 1, unit: "tsp", cost: 0.1 },
      { name: "Salt", quantity: 0.5, unit: "tsp", cost: 0.05 },
    ],
    instructions: [
      "Preheat oven to 175°C (350°F).",
      "Mash bananas; mix with melted butter.",
      "Stir in sugar, egg, and vanilla.",
      "Fold in flour, baking soda, and salt.",
      "Pour into a loaf pan and bake 50-60 minutes.",
    ],
  },
  {
    id: "spaghetti-bolognese",
    title: "Spaghetti Bolognese",
    category: "main",
    image: "/globe.svg",
    source: { type: "link", value: "https://example.com/spaghetti-bolognese" },
    servings: 4,
    prepTime: 10,
    cookTime: 30,
    healthRating: 3,
    ingredients: [
      { name: "Spaghetti", quantity: 400, unit: "g", cost: 1.5 },
      { name: "Ground beef", quantity: 500, unit: "g", cost: 6.0 },
      { name: "Onion", quantity: 1, unit: "piece", cost: 0.4 },
      { name: "Garlic", quantity: 2, unit: "clove", cost: 0.2 },
      { name: "Canned tomatoes", quantity: 400, unit: "g", cost: 1.2 },
      { name: "Tomato paste", quantity: 2, unit: "tbsp", cost: 0.3 },
      { name: "Olive oil", quantity: 2, unit: "tbsp", cost: 0.4 },
      { name: "Dried oregano", quantity: 1, unit: "tsp", cost: 0.1 },
      { name: "Salt", quantity: 1, unit: "tsp", cost: 0.05 },
      { name: "Black pepper", quantity: 0.5, unit: "tsp", cost: 0.05 },
    ],
    instructions: [
      "Cook spaghetti according to package directions.",
      "Sauté onion and garlic in olive oil.",
      "Add ground beef and brown.",
      "Stir in tomatoes, paste, and oregano; simmer 20 minutes.",
      "Season and serve over spaghetti.",
    ],
  },
  {
    id: "grilled-chicken-salad",
    title: "Grilled Chicken Salad",
    category: "main",
    image: "/window.svg",
    source: { type: "photo", value: "Imported photo" },
    servings: 2,
    prepTime: 15,
    cookTime: 10,
    healthRating: 5,
    ingredients: [
      { name: "Chicken breast", quantity: 300, unit: "g", cost: 3.5 },
      { name: "Mixed greens", quantity: 150, unit: "g", cost: 2.0 },
      { name: "Cherry tomatoes", quantity: 150, unit: "g", cost: 1.5 },
      { name: "Cucumber", quantity: 1, unit: "piece", cost: 0.8 },
      { name: "Olive oil", quantity: 2, unit: "tbsp", cost: 0.4 },
      { name: "Lemon juice", quantity: 1, unit: "tbsp", cost: 0.3 },
      { name: "Salt", quantity: 0.5, unit: "tsp", cost: 0.05 },
      { name: "Black pepper", quantity: 0.25, unit: "tsp", cost: 0.03 },
    ],
    instructions: [
      "Season chicken and grill until cooked through.",
      "Slice chicken and set aside.",
      "Toss greens, tomatoes, and cucumber in a bowl.",
      "Whisk olive oil, lemon juice, salt, and pepper for dressing.",
      "Top salad with chicken and drizzle with dressing.",
    ],
  },
];

export function getRecipeById(id: string): Recipe | undefined {
  return recipes.find((r) => r.id === id);
}

export function getRecipesByCategory(category: "dessert" | "main"): Recipe[] {
  return recipes.filter((r) => r.category === category);
}

export function getTotalCost(recipe: Recipe): number {
  return recipe.ingredients.reduce((sum, ing) => sum + ing.cost, 0);
}