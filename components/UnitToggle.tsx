"use client";

import { useState } from "react";
import type { Ingredient, UnitSystem } from "@/lib/types";
import { convertIngredient, formatQuantity } from "@/lib/units";

export default function UnitToggle({ ingredients }: { ingredients: Ingredient[] }) {
  const [system, setSystem] = useState<UnitSystem>("metric");

  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <span className="text-sm text-zinc-600 dark:text-zinc-400">Units:</span>
        <button
          onClick={() => setSystem("metric")}
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            system === "metric"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
          }`}
        >
          Metric
        </button>
        <button
          onClick={() => setSystem("imperial")}
          className={`rounded-full px-3 py-1 text-sm font-medium transition-colors ${
            system === "imperial"
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
          }`}
        >
          Imperial
        </button>
      </div>
      <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
        {ingredients.map((ing, i) => {
          const converted = convertIngredient(ing, system);
          return (
            <li key={i} className="flex items-center justify-between py-2 text-sm">
              <span className="text-zinc-800 dark:text-zinc-200">{ing.name}</span>
              <span className="text-zinc-600 dark:text-zinc-400">
                {formatQuantity(converted.quantity)} {converted.unit}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}