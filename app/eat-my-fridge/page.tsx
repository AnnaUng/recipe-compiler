"use client";

import { useState } from "react";
import { ingredientGroups } from "@/lib/ingredients";
import type { FridgeRecipe } from "@/lib/types";
import FridgeRecipeCard from "@/components/FridgeRecipeCard";

export default function EatMyFridgePage() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customIngredient, setCustomIngredient] = useState("");
  const [customIngredients, setCustomIngredients] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<FridgeRecipe[] | null>(null);
  const [webSearchUsed, setWebSearchUsed] = useState(false);

  function toggleIngredient(value: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(value)) {
        next.delete(value);
      } else {
        next.add(value);
      }
      return next;
    });
  }

  function addCustomIngredient() {
    const trimmed = customIngredient.trim();
    if (!trimmed) return;
    setCustomIngredients((prev) =>
      prev.includes(trimmed) ? prev : [...prev, trimmed]
    );
    setCustomIngredient("");
  }

  function removeCustomIngredient(ing: string) {
    setCustomIngredients((prev) => prev.filter((i) => i !== ing));
  }

  const allIngredients = [...Array.from(selected), ...customIngredients];

  async function handleSearch() {
    if (allIngredients.length === 0) return;
    setLoading(true);
    setError("");
    setResults(null);
    try {
      const res = await fetch("/api/fridge-recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: allIngredients }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not find recipes. Please try again.");
        return;
      }
      setResults(data.recipes || []);
      setWebSearchUsed(data.webSearchUsed || false);
    } catch {
      setError("Could not reach the recipe search service.");
    } finally {
      setLoading(false);
    }
  }

  function resetSearch() {
    setResults(null);
    setError("");
    setWebSearchUsed(false);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        {"🧊 Eat My Fridge"}
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Select the ingredients you have at home. The app will search the web
        for recipes you can make right now — no extra shopping needed (unless
        there is an easy substitute, which will be flagged with a warning).
      </p>

      {results === null ? (
        <div className="mt-8 space-y-6">
          {/* Ingredient checklist */}
          {ingredientGroups.map((group) => (
            <div
              key={group.label}
              className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                <span>{group.emoji}</span>
                {group.label}
              </h2>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                {group.items.map((item) => {
                  const checked = selected.has(item.value);
                  return (
                    <label
                      key={item.value}
                      className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                        checked
                          ? "border-blue-500 bg-blue-50 text-blue-900 dark:border-blue-400 dark:bg-blue-900/20 dark:text-blue-200"
                          : "border-zinc-200 text-zinc-700 hover:border-zinc-300 dark:border-zinc-700 dark:text-zinc-300 dark:hover:border-zinc-600"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleIngredient(item.value)}
                        className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500 dark:border-zinc-600 dark:bg-zinc-800"
                      />
                      {item.label}
                    </label>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Custom ingredients */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              {"✏️ Add your own"}
            </h2>
            <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
              Missing something? Add it here.
            </p>
            <div className="mt-3 flex gap-2">
              <input
                type="text"
                value={customIngredient}
                onChange={(e) => setCustomIngredient(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addCustomIngredient();
                  }
                }}
                placeholder="e.g. buttermilk, fresh basil, coconut milk"
                className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
              <button
                onClick={addCustomIngredient}
                disabled={!customIngredient.trim()}
                className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                Add
              </button>
            </div>
            {customIngredients.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {customIngredients.map((ing) => (
                  <span
                    key={ing}
                    className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    {ing}
                    <button
                      onClick={() => removeCustomIngredient(ing)}
                      className="text-zinc-400 hover:text-red-500"
                      aria-label={`Remove ${ing}`}
                    >
                      ✕
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Summary + search button */}
          <div className="sticky bottom-4 rounded-2xl border border-zinc-200 bg-white/95 p-4 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
            <div className="flex items-center justify-between gap-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {allIngredients.length === 0
                  ? "Select at least one ingredient to get started."
                  : `${allIngredients.length} ingredient${
                      allIngredients.length === 1 ? "" : "s"
                    } selected`}
              </p>
              <button
                onClick={handleSearch}
                disabled={loading || allIngredients.length === 0}
                className="shrink-0 rounded-full bg-zinc-900 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
              >
                {loading ? "Searching..." : "Find Recipes"}
              </button>
            </div>
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
              {error}
            </p>
          )}
        </div>
      ) : (
        <div className="mt-8">
          {/* Results header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {results.length > 0
                  ? `${results.length} recipe${results.length === 1 ? "" : "s"} found`
                  : "No recipes found"}
              </h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Based on your {allIngredients.length} ingredient
                {allIngredients.length === 1 ? "" : "s"}.
              </p>
            </div>
            <button
              onClick={resetSearch}
              className="rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
            >
              ← Back to checklist
            </button>
          </div>

          {!webSearchUsed && results.length > 0 && (
            <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
              <p className="font-semibold">Note: Live web search unavailable</p>
              <p className="mt-1">
                Google Search grounding requires a paid Gemini plan. Recipes
                below are generated from the AI training data and may not have
                real source URLs. To enable true web search, enable billing in
                Google AI Studio or use a web-search-capable provider like
                Perplexity.
              </p>
            </div>
          )}

          {results.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                No matching recipes found
              </p>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                The AI could not find recipes that use only your ingredients
                without needing hard-to-substitute items. Try selecting a few
                more ingredients and search again.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((recipe, i) => (
                <FridgeRecipeCard key={i} recipe={recipe} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}