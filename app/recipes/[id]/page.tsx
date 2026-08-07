import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getRecipeById } from "@/lib/recipes";
import { getTotalCost } from "@/lib/recipe-utils";
import HealthRating from "@/components/HealthRating";
import UnitToggle from "@/components/UnitToggle";

export const dynamic = "force-dynamic";

export default async function RecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const recipe = await getRecipeById(id);

  if (!recipe) {
    notFound();
  }

  const totalCost = getTotalCost(recipe);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Link
        href={recipe.category === "dessert" ? "/desserts" : "/mains"}
        className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
      >
        ← Back to {recipe.category === "dessert" ? "Desserts" : "Mains"}
      </Link>

      <div className="mt-6 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="relative h-64 w-full bg-zinc-100 dark:bg-zinc-800">
          <Image
            src={recipe.image}
            alt={recipe.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 768px"
          />
        </div>
        <div className="p-6">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
            {recipe.title}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-zinc-600 dark:text-zinc-400">
            <span className="flex items-center gap-1">
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                {recipe.servings}
              </span>{" "}
              servings
            </span>
            <span className="flex items-center gap-1">
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                {recipe.prepTime}
              </span>{" "}
              min prep
            </span>
            <span className="flex items-center gap-1">
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                {recipe.cookTime}
              </span>{" "}
              min cook
            </span>
            <span className="flex items-center gap-1">
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                ${totalCost.toFixed(2)}
              </span>{" "}
              total
            </span>
            <span className="flex items-center gap-1">
              <span className="font-medium text-zinc-900 dark:text-zinc-50">
                ${(totalCost / recipe.servings).toFixed(2)}
              </span>{" "}
              per serving
            </span>
            <HealthRating rating={recipe.healthRating} />
          </div>

          <div className="mt-2 text-sm text-zinc-500 dark:text-zinc-500">
            Source:{" "}
            {recipe.source.type === "link" || recipe.source.type === "social" ? (
              <a
                href={recipe.source.value}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline dark:text-blue-400"
              >
                {recipe.source.type === "social"
                  ? "Watch original video"
                  : recipe.source.value}
              </a>
            ) : (
              <span>Imported photo</span>
            )}
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Ingredients
            </h2>
            <div className="mt-4">
              <UnitToggle ingredients={recipe.ingredients} />
            </div>
          </div>

          <div className="mt-8">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">
              Instructions
            </h2>
            <ol className="mt-4 space-y-3">
              {recipe.instructions.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm text-zinc-700 dark:text-zinc-300">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    {i + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}