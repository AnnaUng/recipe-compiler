"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import type { Category, Ingredient, SourceType } from "@/lib/types";

interface ExtractedRecipe {
  title: string;
  category: Category;
  servings: number;
  prepTime: number;
  cookTime: number;
  healthRating: number;
  ingredients: Ingredient[];
  instructions: string[];
  image?: string;
}

const EMPTY_INGREDIENT: Ingredient = { name: "", quantity: 0, unit: "g", cost: 0 };

function ImportPageContent() {
  const searchParams = useSearchParams();
  const [sourceType, setSourceType] = useState<SourceType>("link");
  const [link, setLink] = useState(() => searchParams.get("url") || "");
  const [photo, setPhoto] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("main");
  const [servings, setServings] = useState(4);
  const [prepTime, setPrepTime] = useState(10);
  const [cookTime, setCookTime] = useState(20);
  const [healthRating, setHealthRating] = useState(3);
  const [ingredients, setIngredients] = useState<Ingredient[]>([EMPTY_INGREDIENT]);
  const [instructions, setInstructions] = useState<string[]>([""]);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Extraction states
  const [extracting, setExtracting] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [extractError, setExtractError] = useState("");
  const [extractedCaption, setExtractedCaption] = useState("");
  const [reviewMode, setReviewMode] = useState(false);

  function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setPhoto(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function handleExtractLink(urlOverride?: string) {
    const targetUrl = urlOverride?.trim() || link.trim();
    if (!targetUrl) return;
    setExtracting(true);
    setExtractError("");
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: targetUrl }),
      });
      const data = await res.json();
      if (!res.ok) {
        setExtractError(data.error || "Extraction failed.");
        return;
      }
      setExtractedCaption(data.caption || "");
      if (data.recipe) {
        // Fill the form with scraped recipe data
        const r = data.recipe;
        setTitle(r.title || "");
        setImageUrl(r.image || "");
        setCategory(r.category || "main");
        setServings(r.servings || 4);
        setPrepTime(r.prepTime || 10);
        setCookTime(r.cookTime || 20);
        setHealthRating(r.healthRating || 3);
        setIngredients(
          r.ingredients && r.ingredients.length > 0
            ? r.ingredients
            : [EMPTY_INGREDIENT]
        );
        setInstructions(r.instructions && r.instructions.length > 0 ? r.instructions : [""]);
        setReviewMode(true);
      } else if (data.caption) {
        // Pre-fill title from the link for convenience
        if (!title) setTitle("Imported from social media");
      }
    } catch {
      setExtractError("Could not reach the extraction service.");
    } finally {
      setExtracting(false);
    }
  }

  // Auto-extract a recipe when arriving with a ?url= query param
  // (e.g. from "Download & Edit" in Eat My Fridge web results).
  useEffect(() => {
    const urlParam = searchParams.get("url");
    if (!urlParam) return;
    // Fetch external recipe data on mount when arriving with a ?url= param.
    // The setState calls inside handleExtractLink are async (after fetch),
    // so this is a legitimate data-loading effect.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    handleExtractLink(urlParam);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  async function handleAnalyzePhoto() {
    if (!photo) return;
    setAnalyzing(true);
    setExtractError("");
    try {
      const res = await fetch("/api/analyze-photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: photo }),
      });
      const data = await res.json();
      if (!res.ok) {
        setExtractError(data.error || "AI analysis failed.");
        return;
      }
      const r: ExtractedRecipe = data.recipe;
      if (!r || !r.ingredients || r.ingredients.length === 0) {
        setExtractError("The AI could not find a recipe in this photo. Please try another photo or fill in the details manually.");
        return;
      }
      // Fill the form with AI-extracted data
      setTitle(r.title || "");
      setCategory(r.category || "main");
      setServings(r.servings || 4);
      setPrepTime(r.prepTime || 10);
      setCookTime(r.cookTime || 20);
      setHealthRating(r.healthRating || 3);
      setIngredients(
        r.ingredients.length > 0
          ? r.ingredients
          : [EMPTY_INGREDIENT]
      );
      setInstructions(r.instructions.length > 0 ? r.instructions : [""]);
      setReviewMode(true);
    } catch {
      setExtractError("Could not reach the AI analysis service.");
    } finally {
      setAnalyzing(false);
    }
  }

  function updateIngredient(index: number, field: keyof Ingredient, value: string | number) {
    setIngredients((prev) =>
      prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing))
    );
  }

  function addIngredient() {
    setIngredients((prev) => [...prev, { ...EMPTY_INGREDIENT }]);
  }

  function removeIngredient(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  function updateInstruction(index: number, value: string) {
    setInstructions((prev) => prev.map((s, i) => (i === index ? value : s)));
  }

  function addInstruction() {
    setInstructions((prev) => [...prev, ""]);
  }

  function removeInstruction(index: number) {
    setInstructions((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSave() {
    const validIngredients = ingredients.filter((ing) => ing.name.trim() !== "");
    const validInstructions = instructions.filter((s) => s.trim() !== "");
    if (!title.trim() || validIngredients.length === 0) return;

    setSaving(true);
    setSaveError("");
    try {
      const res = await fetch("/api/recipes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          category,
          image: photo || imageUrl || "/next.svg",
          source: {
            type: sourceType,
            value:
              sourceType === "link"
                ? link.trim()
                : sourceType === "social"
                ? link.trim()
                : "Imported photo",
          },
          servings,
          prepTime,
          cookTime,
          healthRating,
          ingredients: validIngredients,
          instructions: validInstructions,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSaveError(data.error || "Could not save the recipe. Please try again.");
        return;
      }
      setSaved(true);
    } catch {
      setSaveError("Could not reach the recipe service.");
    } finally {
      setSaving(false);
    }
  }

  function resetForm() {
    setSaved(false);
    setTitle("");
    setLink("");
    setPhoto(null);
    setImageUrl("");
    setIngredients([{ ...EMPTY_INGREDIENT }]);
    setInstructions([""]);
    setExtractedCaption("");
    setReviewMode(false);
    setExtractError("");
  }

  const inputClass =
    "mt-1 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100";

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Import a Recipe
      </h1>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Paste a link, a social media post, or upload a photo. The AI can read photos
        and extract the recipe for you.
      </p>

      {saved ? (
        <div className="mt-8 rounded-2xl border border-green-200 bg-green-50 p-6 text-center dark:border-green-800 dark:bg-green-900/20">
          <p className="text-lg font-semibold text-green-800 dark:text-green-300">
            Recipe saved!
          </p>
          <p className="mt-1 text-sm text-green-700 dark:text-green-400">
            Your recipe is saved to your family collection. Add another or browse the categories.
          </p>
          <button
            onClick={resetForm}
            className="mt-4 rounded-full bg-zinc-900 px-5 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            Add Another
          </button>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          {/* Source */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Source
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => setSourceType("link")}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  sourceType === "link"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                Link
              </button>
              <button
                onClick={() => setSourceType("social")}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  sourceType === "social"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                Social Media
              </button>
              <button
                onClick={() => setSourceType("photo")}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  sourceType === "photo"
                    ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                Photo
              </button>
            </div>

            {sourceType === "link" && (
              <div className="mt-4">
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://example.com/recipe"
                    className={inputClass}
                  />
                  <button
                    onClick={() => handleExtractLink()}
                    disabled={extracting || !link.trim()}
                    className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                  >
                    {extracting ? "Extracting..." : "Extract"}
                  </button>
                </div>
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                  The app visits the page and pulls the recipe details automatically.
                </p>
              </div>
            )}

            {sourceType === "social" && (
              <div className="mt-4">
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={link}
                    onChange={(e) => setLink(e.target.value)}
                    placeholder="https://youtube.com/watch?v=... or Instagram/TikTok link"
                    className={inputClass}
                  />
                  <button
                    onClick={() => handleExtractLink()}
                    disabled={extracting || !link.trim()}
                    className="shrink-0 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                  >
                    {extracting ? "Extracting..." : "Extract"}
                  </button>
                </div>
                {extractedCaption && (
                  <div className="mt-3 rounded-lg bg-zinc-50 p-3 dark:bg-zinc-800">
                    <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Extracted caption / transcript
                    </p>
                    <p className="mt-1 max-h-32 overflow-y-auto text-sm text-zinc-700 dark:text-zinc-300">
                      {extractedCaption}
                    </p>
                  </div>
                )}
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                  The original link is saved on the recipe page so you can watch the video.
                </p>
              </div>
            )}

            {sourceType === "photo" && (
              <div className="mt-4">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="block w-full text-sm text-zinc-600 file:mr-4 file:rounded-full file:border-0 file:bg-zinc-100 file:px-4 file:py-2 file:text-sm file:font-medium file:text-zinc-700 hover:file:bg-zinc-200 dark:text-zinc-400 dark:file:bg-zinc-800 dark:file:text-zinc-300"
                />
                {photo && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo}
                    alt="Recipe preview"
                    className="mt-4 h-40 w-full rounded-lg object-cover"
                  />
                )}
                {photo && (
                  <button
                    type="button"
                    onClick={handleAnalyzePhoto}
                    disabled={analyzing}
                    className="mt-3 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
                  >
                    {analyzing ? "AI is reading the photo..." : "Extract with AI"}
                  </button>
                )}
                <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
                  The AI reads the photo and fills in the recipe. You can review and fix
                  anything before saving.
                </p>
              </div>
            )}

            {extractError && (
              <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
                {extractError}
              </p>
            )}
          </div>

          {reviewMode && (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
              <p className="font-semibold">Review the AI-extracted information</p>
              <p className="mt-1">
                The AI filled in the details below. Please check everything and fix any
                mistakes before saving.
              </p>
            </div>
          )}

          {/* Details */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Details
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Recipe name"
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Category)}
                  className={inputClass}
                >
                  <option value="main">Main</option>
                  <option value="dessert">Dessert</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Servings
                </label>
                <input
                  type="number"
                  min={1}
                  value={servings}
                  onChange={(e) => setServings(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Prep Time (minutes)
                </label>
                <input
                  type="number"
                  min={0}
                  value={prepTime}
                  onChange={(e) => setPrepTime(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Cook Time (minutes)
                </label>
                <input
                  type="number"
                  min={0}
                  value={cookTime}
                  onChange={(e) => setCookTime(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  Health Rating (1-5)
                </label>
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={healthRating}
                  onChange={(e) => setHealthRating(Number(e.target.value))}
                  className={inputClass}
                />
              </div>
            </div>
          </div>

          {/* Ingredients */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Ingredients
            </h2>
            <div className="mt-4 space-y-3">
              {ingredients.map((ing, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={ing.name}
                    onChange={(e) => updateIngredient(i, "name", e.target.value)}
                    placeholder="Ingredient"
                    className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                  <input
                    type="number"
                    step="any"
                    value={ing.quantity}
                    onChange={(e) => updateIngredient(i, "quantity", Number(e.target.value))}
                    placeholder="Qty"
                    className="w-20 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                  <select
                    value={ing.unit}
                    onChange={(e) => updateIngredient(i, "unit", e.target.value)}
                    className="w-24 rounded-lg border border-zinc-300 bg-white px-2 py-2 text-sm text-zinc-900 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    <option value="g">g</option>
                    <option value="kg">kg</option>
                    <option value="ml">ml</option>
                    <option value="l">l</option>
                    <option value="tsp">tsp</option>
                    <option value="tbsp">tbsp</option>
                    <option value="cup">cup</option>
                    <option value="piece">piece</option>
                    <option value="clove">clove</option>
                  </select>
                  <input
                    type="number"
                    step="any"
                    value={ing.cost}
                    onChange={(e) => updateIngredient(i, "cost", Number(e.target.value))}
                    placeholder="$"
                    className="w-20 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                  <button
                    onClick={() => removeIngredient(i)}
                    className="text-zinc-400 hover:text-red-500"
                    aria-label="Remove ingredient"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={addIngredient}
                className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                + Add ingredient
              </button>
            </div>
          </div>

          {/* Instructions */}
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              Instructions
            </h2>
            <div className="mt-4 space-y-3">
              {instructions.map((step, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                    {i + 1}
                  </span>
                  <input
                    type="text"
                    value={step}
                    onChange={(e) => updateInstruction(i, e.target.value)}
                    placeholder="Step"
                    className="flex-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-zinc-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                  <button
                    onClick={() => removeInstruction(i)}
                    className="text-zinc-400 hover:text-red-500"
                    aria-label="Remove step"
                  >
                    ✕
                  </button>
                </div>
              ))}
              <button
                onClick={addInstruction}
                className="text-sm font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                + Add step
              </button>
            </div>
          </div>

          {saveError && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900/20 dark:text-red-300">
              {saveError}
            </p>
          )}

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full rounded-full bg-zinc-900 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {saving ? "Saving..." : "Save Recipe"}
          </button>
        </div>
      )}
    </div>
  );
}

export default function ImportPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-3xl px-4 py-12 text-zinc-600 dark:text-zinc-400">
          Loading...
        </div>
      }
    >
      <ImportPageContent />
    </Suspense>
  );
}
