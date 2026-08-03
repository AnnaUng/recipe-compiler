# Recipe Compiler

A web app that compiles recipes from links, social media posts, and photos into clean, easy-to-follow lists. Built with Next.js 16 (App Router), TypeScript, and Tailwind CSS v4.

## Features

- **Browse by category** — Mains and Desserts.
- **Recipe details** — ingredients, total cost, cost per serving, servings, prep time, cook time, and a 1–5 health rating.
- **Unit conversion** — toggle between Metric and baking-friendly Imperial (cups/tbsp/tsp) on any recipe page.
- **Import from link** — paste a recipe URL and save it with the source link.
- **Import from social media** — paste a YouTube/Instagram/TikTok link. The app extracts the caption/transcript (YouTube supported via transcript) and saves the original link so you can watch the video.
- **Import from photo** — upload a photo and an AI vision model reads it and auto-fills the recipe details, which you can review before saving. Imported recipes are stored in your browser (localStorage).

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## AI Configuration

Photo AI extraction requires an OpenAI-compatible vision API. Create a `.env.local` file in the project root:

```env
AI_API_KEY=your_api_key_here
# Optional overrides:
AI_API_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o
```

- `AI_API_KEY` — required for photo extraction.
- `AI_API_BASE_URL` — default `https://api.openai.com/v1`. Point to any OpenAI-compatible endpoint.
- `AI_MODEL` — default `gpt-4o`. Must support image input.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — start the production server
- `npm run lint` — run ESLint

## Project Structure

```
app/
  api/
    extract/        # Social media caption/transcript extraction
    analyze-photo/  # AI photo-to-recipe extraction
  recipes/[id]/     # Recipe detail page
  desserts/         # Desserts listing
  mains/            # Mains listing
  import/           # Import page (link / social / photo)
components/
  RecipeCard.tsx    # Recipe card
  HealthRating.tsx  # Star rating display
  UnitToggle.tsx    # Metric/Imperial toggle
lib/
  types.ts          # TypeScript types
  recipes.ts        # Sample recipe data
  units.ts          # Unit conversion logic