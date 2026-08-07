# Recipe Compiler

A web app compiling all the recipes your family has made and likes into clean, easy-to-follow lists. Built with Next.js 16 (App Router), TypeScript, Tailwind CSS v4, and Supabase.

## Features

- **Browse by category** — Mains and Desserts, stored in Supabase.
- **Recipe details** — ingredients, total cost, cost per serving, servings, prep time, cook time, and a 1–5 health rating.
- **Unit conversion** — toggle between Metric and baking-friendly Imperial (cups/tbsp/tsp) on any recipe page.
- **Add a recipe manually** — enter the title, source, servings, times, health rating, ingredients, and instructions, then save it to your family collection in Supabase. The form is manual-first and reliable; no AI required.
- **Import helpers (optional)** — paste a recipe URL or social media link to scrape it, or upload a photo for AI vision extraction. Everything is pre-filled into the same manual form so you can review and fix it before saving.
- **Eat My Fridge** — select the ingredients you have at home from a checklist (or add your own). The app searches **your family recipe collection in Supabase**, ranks recipes by what percentage of their ingredients you have, and shows each result with a match badge and any missing ingredients.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Supabase Setup

Recipes are stored in Supabase. Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_publishable_key_here
```

You can find both values in the Supabase dashboard under **Project Settings → API**. The app follows the official Supabase Next.js pattern with `@supabase/ssr`:

- `utils/supabase/server.ts` — server client bound to the request's cookies (used by the data layer and API routes).
- `utils/supabase/client.ts` — browser client for client components.
- `utils/supabase/middleware.ts` — middleware helper that keeps sessions refreshed (ready for when you add auth).

### Database schema

Run `supabase/schema.sql` in the Supabase SQL Editor to create the tables, permissive Row Level Security policies, and seed the 4 original sample recipes:

- `recipes` — one row per recipe (title, category, image, source, servings, times, health rating)
- `ingredients` — normalized ingredient rows per recipe (name, quantity, unit, cost, position for ordering)
- `instructions` — ordered instruction steps per recipe

RLS policies are intentionally open (`select`/`insert`/`update`/`delete` for all users on all three tables) since this is a personal/family app without authentication. If you add auth later, tighten these policies.

## AI Configuration (optional import helpers)

Photo AI extraction and link/social scraping require an OpenAI-compatible API. Without these keys, the manual form still works perfectly.

```env
AI_API_KEY=your_api_key_here
# Optional overrides:
AI_API_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o
```

- `AI_API_KEY` — required for photo extraction and link scraping.
- `AI_API_BASE_URL` — default `https://api.openai.com/v1`. Point to any OpenAI-compatible endpoint.
- `AI_MODEL` — default `gpt-4o`. Must support image input for photo extraction.

## How Eat My Fridge works

No AI is involved. When you search, the app:

1. Loads every recipe in your family collection from Supabase.
2. Normalizes ingredient names and matches them against your selected ingredients (with pantry staples like salt, pepper, oil, flour, and sugar automatically allowed).
3. Includes recipes where at least **50%** of the ingredients are covered by what you have.
4. Sorts results by match percentage (highest first), then by fewest missing ingredients.
5. Returns each recipe with a `matchCount`/`totalCount` and a `missingIngredients` list so the UI can show exactly what you'd need to buy.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — start the production server
- `npm run lint` — run ESLint

## Project Structure

```
app/
  api/
    extract/         # Social media caption/transcript extraction (optional)
    analyze-photo/   # AI photo-to-recipe extraction (optional)
    fridge-recipes/  # Eat My Fridge: matches family recipes by ingredient overlap
    recipes/         # GET (list/single) + POST (create) recipes in Supabase
  recipes/[id]/      # Recipe detail page
  desserts/          # Desserts listing (reads Supabase)
  mains/             # Mains listing (reads Supabase)
  import/            # Manual-first recipe entry + optional AI import helpers
  eat-my-fridge/     # Ingredient checklist + family recipe match results
components/
  RecipeCard.tsx       # Recipe card
  HealthRating.tsx     # Star rating display
  UnitToggle.tsx       # Metric/Imperial toggle
lib/
  types.ts        # TypeScript types
  recipes.ts      # Async Supabase data layer (server-only: getRecipeById, getRecipes, ...)
  recipe-utils.ts # Client-safe helpers (getTotalCost)
  units.ts        # Unit conversion logic
  ingredients.ts  # Curated ingredient checklist for Eat My Fridge
utils/
  supabase/
    server.ts     # Server Supabase client (cookies)
    client.ts     # Browser Supabase client
    middleware.ts # Middleware helper for session refresh
supabase/
  schema.sql      # Database schema + RLS policies + seed data
