import { getRecipesByCategory } from "@/lib/recipes";
import RecipeCard from "@/components/RecipeCard";

export default function MainsPage() {
  const mains = getRecipesByCategory("main");

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Mains
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Dinners and hearty dishes.
      </p>
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {mains.map((recipe) => (
          <RecipeCard key={recipe.id} recipe={recipe} />
        ))}
      </div>
    </div>
  );
}