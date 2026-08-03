"use client";

import { useState } from "react";
import type { FridgeRecipe } from "@/lib/types";
import HealthRating from "./HealthRating";

export default function FridgeRecipeCard({ recipe }: { recipe: FridgeRecipe }) {
  const [expanded, setExpanded] = useState(false);
  const hasSubstitutes = recipe.substitutesNeeded.length > 0;

  return (
    <div className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {/* Substitute warning banner */}
      {hasSubstitutes && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20">
          <p className="flex items-center gap-1.5 text-sm font-semibold text-amber-800 dark:text-amber-300">
            ⚠️ Substitute needed
          </p>
          <ul className="mt-2 space-y-1">
            {recipe.substitutesNeeded.map((sub, i) => (
              <li
                key={i}
                className="text-sm text-amber-700 dark:text-amber-400"
              >
                <span className="font-medium">{sub.ingredient}</span>
                {sub.substituteWith && (
                  <>
                    {" → "}
                    <span className="font-medium">{sub.substituteWith}</span>
                  </>
                )}
                {sub.warning && (
                  <span className="block text-xs text-amber-600 dark:text-amber-500">
                    {sub.warning}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Image */}
      {recipe.image && (
        <div className="relative h-40 w-full bg-zinc-100 dark:bg-zinc-800">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={recipe.image}
            alt={recipe.title}
            className="h-full w-full object-cover"
          />
        </div>
      )}

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          {recipe.title}
        </h2>

        <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
          <span>{recipe.servings} servings</span>
          <span>Prep {recipe.prepTime} min</span>
          <span>Cook {recipe.cookTime} min</span>
        </div>

        <HealthRating rating={recipe.healthRating} />

        {/* Ingredients */}
        <div className="mt-2">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Ingredients
          </h3>
          <ul className="mt-1 space-y-0.5 text-sm text-zinc-600 dark:text-zinc-400">
            {recipe.ingredients.map((ing, i) => (
              <li key={i}>
                {ing.quantity > 0 && (
                  <span className="font-medium">
                    {ing.quantity} {ing.unit}{" "}
                  </span>
                )}
                {ing.name}
              </li>
            ))}
          </ul>
        </div>

        {/* Expandable instructions */}
        {recipe.instructions.length > 0 && (
          <div className="mt-2">
            <button
              onClick={() => setExpanded((e) => !e)}
              className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
            >
              {expanded ? "Hide instructions" : "Show instructions"}
            </button>
            {expanded && (
              <ol className="mt-2 space-y-2">
                {recipe.instructions.map((step, i) => (
                  <li
                    key={i}
                    className="flex gap-2 text-sm text-zinc-700 dark:text-zinc-300"
                  >
                    <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                      {i + 1}
                    </span>
                    <span className="pt-0.5">{step}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}

        {/* Source link */}
        {recipe.sourceUrl && (
          <a
            href={recipe.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-block text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            View original recipe →
          </a>
        )}
      </div>
    </div>
  );
}