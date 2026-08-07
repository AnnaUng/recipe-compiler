"use client";

import { useState } from "react";
import Link from "next/link";
import { ingredientGroups } from "@/lib/ingredients";
import type { Recipe } from "@/lib/types";
import RecipeCard from "@/components/RecipeCard";

interface FridgeResult extends Recipe {
  matchCount: number;
  totalCount: number;
  missingIngredients: string[];
}

interface WebSearchResult {
  title: string;
  url: string;
  image: string;
  rating: number | null;
  ratingCount: number | null;
  source: string;
  snippet: string;
}

export default function EatMyFridgePage() {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [customIngredient, setCustomIngredient] = useState("");
  const [customIngredients, setCustomIngredients] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<FridgeResult[] | null>(null);

  // Web search states
  const [webResults, setWebResults] = useState<WebSearchResult[] | null>(null);
  const [webSearching, setWebSearching] = useState(false);
  const [webError, setWebError] = useState("");
  const [webSearched, setWebSearched] = useState(false);

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
    } catch {
      setError("Could not reach the recipe search service.");
    } finally {
      setLoading(false);
    }
  }

  async function handleWebSearch() {
    if (allIngredients.length === 0) return;
    setWebSearching(true);
    setWebError("");
    setWebSearched(true);
    setWebResults(null);
    try {
      const res = await fetch("/api/search-web", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ingredients: allIngredients }),
      });
      const data = await res.json();
      if (!res.ok) {
        setWebError(data.error || "Could not find web recipes. Please try again.");
        return;
      }
      setWebResults(data.results || []);
    } catch {
      setWebError("Could not reach the web recipe search service.");
    } finally {
      setWebSearching(false);
    }
  }

  function resetSearch() {
    setResults(null);
    setWebResults(null);
    setWebSearched(false);
    setWebError("");
    setError("");
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        {"🧊 Eat My Fridge"}
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Select the ingredients you have at home. The app will search your
        family recipe collection and show the recipes you can make right now —
        sorted by how many of your ingredients each recipe uses.
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

          {results.length === 0 ? (
            <div className="mt-8 rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                No matching recipes found
              </p>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                None of your family recipes use at least half of the ingredients
                you selected. Try selecting a few more ingredients and search
                again.
              </p>
            </div>
          ) : (
            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((recipe) => {
                const matchPct = Math.round(
                  (recipe.matchCount / recipe.totalCount) * 100
                );
                return (
                  <div key={recipe.id} className="flex flex-col gap-2">
                    <RecipeCard recipe={recipe} />
                    <div className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900">
                      <p className="font-medium text-zinc-900 dark:text-zinc-50">
                        {matchPct}% match
                      </p>
                      {recipe.missingIngredients.length > 0 && (
                        <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">
                          Missing: {recipe.missingIngredients.join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Web search section */}
          <div className="mt-12">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                  {"🌐 Search the Web"}
                </h2>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Find highly rated recipes online that use your ingredients.
                </p>
              </div>
              {!webSearched && (
                <button
                  onClick={handleWebSearch}
                  disabled={webSearching}
                  className="shrink-0 rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                >
                  {webSearching ? "Searching..." : "Search the web"}
                </button>
              )}
            </div>

            {webError && (
              <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
                {webError}
              </p>
            )}

            {webSearching && (
              <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400">
                Searching the web for recipes using your ingredients...
              </div>
            )}

            {webSearched && !webSearching && webResults && webResults.length === 0 && (
              <div className="mt-6 rounded-2xl border border-zinc-200 bg-white p-8 text-center dark:border-zinc-800 dark:bg-zinc-900">
                <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                  No web recipes found
                </p>
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Try adding a few more ingredients and search again.
                </p>
              </div>
            )}

            {webSearched && !webSearching && webResults && webResults.length > 0 && (
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {webResults.map((result, i) => (
                  <div
                    key={`${result.url}-${i}`}
                    className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <div className="relative h-40 w-full bg-zinc-100 dark:bg-zinc-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={result.image}
                        alt={result.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="flex flex-1 flex-col gap-2 p-4">
                      <h3 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
                        {result.title}
                      </h3>
                      <div className="flex items-center justify-between text-sm text-zinc-600 dark:text-zinc-400">
                        <span>
                          {result.rating !== null ? (
                            <span className="font-medium text-amber-600 dark:text-amber-400">
                              ⭐ {result.rating.toFixed(1)}
                            </span>
                          ) : (
                            "No rating"
                          )}
                        </span>
                        <span>
                          {result.ratingCount !== null
                            ? `${result.ratingCount.toLocaleString()} review${
                                result.ratingCount === 1 ? "" : "s"
                              }`
                            : result.source}
                        </span>
                      </div>
                      {result.snippet && (
                        <p className="text-xs text-zinc-600 dark:text-zinc-400">
                          {result.snippet}
                        </p>
                      )}
                      <div className="mt-auto flex gap-2 pt-2">
                        <a
                          href={result.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-center text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
                        >
                          Open Recipe ↗
                        </a>
                        <Link
                          href={`/import?url=${encodeURIComponent(result.url)}`}
                          className="flex-1 rounded-lg bg-zinc-900 px-3 py-2 text-center text-sm font-medium text-white transition-colors hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                        >
                          Download & Edit ✚
                        </Link>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}