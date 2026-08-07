import Link from "next/link";
import Image from "next/image";
import type { Recipe } from "@/lib/types";
import { getTotalCost } from "@/lib/recipe-utils";
import HealthRating from "./HealthRating";

export default function RecipeCard({ recipe }: { recipe: Recipe }) {
  const totalCost = getTotalCost(recipe);

  return (
    <Link
      href={`/recipes/${recipe.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="relative h-40 w-full bg-zinc-100 dark:bg-zinc-800">
        <Image
          src={recipe.image}
          alt={recipe.title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {recipe.title}
        </h2>
        <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
          <span>{recipe.servings} servings</span>
          <span>${totalCost.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
          <span>Prep {recipe.prepTime} min</span>
          <span>Cook {recipe.cookTime} min</span>
        </div>
        <HealthRating rating={recipe.healthRating} />
      </div>
    </Link>
  );
}