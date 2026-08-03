/**
 * Curated checklist of common household ingredients, grouped by category.
 * The `value` is the canonical name sent to the AI so it receives clean input.
 */
export interface IngredientGroup {
  label: string;
  emoji: string;
  items: { value: string; label: string }[];
}

export const ingredientGroups: IngredientGroup[] = [
  {
    label: "Produce",
    emoji: "🥬",
    items: [
      { value: "onion", label: "Onion" },
      { value: "garlic", label: "Garlic" },
      { value: "potatoes", label: "Potatoes" },
      { value: "carrots", label: "Carrots" },
      { value: "bell peppers", label: "Bell peppers" },
      { value: "tomatoes", label: "Tomatoes" },
      { value: "spinach", label: "Spinach" },
      { value: "lettuce", label: "Lettuce" },
      { value: "cucumber", label: "Cucumber" },
      { value: "mushrooms", label: "Mushrooms" },
      { value: "broccoli", label: "Broccoli" },
      { value: "avocado", label: "Avocado" },
      { value: "lemons", label: "Lemons" },
      { value: "bananas", label: "Bananas" },
      { value: "apples", label: "Apples" },
      { value: "frozen peas", label: "Frozen peas" },
    ],
  },
  {
    label: "Dairy & Eggs",
    emoji: "🥚",
    items: [
      { value: "eggs", label: "Eggs" },
      { value: "milk", label: "Milk" },
      { value: "butter", label: "Butter" },
      { value: "cheese", label: "Cheese" },
      { value: "yogurt", label: "Yogurt" },
      { value: "heavy cream", label: "Heavy cream" },
      { value: "sour cream", label: "Sour cream" },
      { value: "cream cheese", label: "Cream cheese" },
    ],
  },
  {
    label: "Meat & Seafood",
    emoji: "🍗",
    items: [
      { value: "chicken", label: "Chicken" },
      { value: "ground beef", label: "Ground beef" },
      { value: "ground turkey", label: "Ground turkey" },
      { value: "bacon", label: "Bacon" },
      { value: "pork", label: "Pork" },
      { value: "shrimp", label: "Shrimp" },
      { value: "canned tuna", label: "Canned tuna" },
      { value: "salmon", label: "Salmon" },
    ],
  },
  {
    label: "Pantry",
    emoji: "🥫",
    items: [
      { value: "all-purpose flour", label: "All-purpose flour" },
      { value: "sugar", label: "Sugar" },
      { value: "brown sugar", label: "Brown sugar" },
      { value: "olive oil", label: "Olive oil" },
      { value: "vegetable oil", label: "Vegetable oil" },
      { value: "rice", label: "Rice" },
      { value: "pasta", label: "Pasta" },
      { value: "spaghetti", label: "Spaghetti" },
      { value: "canned tomatoes", label: "Canned tomatoes" },
      { value: "tomato paste", label: "Tomato paste" },
      { value: "canned beans", label: "Canned beans" },
      { value: "lentils", label: "Lentils" },
      { value: "oats", label: "Oats" },
      { value: "bread", label: "Bread" },
      { value: "honey", label: "Honey" },
      { value: "soy sauce", label: "Soy sauce" },
      { value: "vinegar", label: "Vinegar" },
      { value: "salt", label: "Salt" },
      { value: "black pepper", label: "Black pepper" },
      { value: "baking powder", label: "Baking powder" },
      { value: "baking soda", label: "Baking soda" },
      { value: "vanilla extract", label: "Vanilla extract" },
      { value: "cocoa powder", label: "Cocoa powder" },
      { value: "chocolate chips", label: "Chocolate chips" },
      { value: "peanut butter", label: "Peanut butter" },
      { value: "cornstarch", label: "Cornstarch" },
      { value: "chicken broth", label: "Chicken broth" },
      { value: "canned corn", label: "Canned corn" },
      { value: "chickpeas", label: "Chickpeas" },
    ],
  },
  {
    label: "Spices & Herbs",
    emoji: "🌶️",
    items: [
      { value: "dried oregano", label: "Dried oregano" },
      { value: "cumin", label: "Cumin" },
      { value: "paprika", label: "Paprika" },
      { value: "chili powder", label: "Chili powder" },
      { value: "cinnamon", label: "Cinnamon" },
      { value: "nutmeg", label: "Nutmeg" },
      { value: "dried basil", label: "Dried basil" },
      { value: "dried thyme", label: "Dried thyme" },
      { value: "bay leaves", label: "Bay leaves" },
      { value: "red pepper flakes", label: "Red pepper flakes" },
      { value: "curry powder", label: "Curry powder" },
    ],
  },
];