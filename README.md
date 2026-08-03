# Recipe Compiler

A web app that compiles recipes from links, social media posts, and photos into clean, easy-to-follow lists. Built with Next.js 16 (App Router), TypeScript, and Tailwind CSS v4.

## Features

- **Browse by category** — Mains and Desserts.
- **Recipe details** — ingredients, total cost, cost per serving, servings, prep time, cook time, and a 1–5 health rating.
- **Unit conversion** — toggle between Metric and baking-friendly Imperial (cups/tbsp/tsp) on any recipe page.
- **Import from link** — paste a recipe URL and save it with the source link.
- **Import from social media** — paste a YouTube/Instagram/TikTok link. The app extracts the caption/transcript (YouTube supported via transcript) and saves the original link so you can watch the video.
- **Import from photo** — upload a photo and an AI vision model reads it and auto-fills the recipe details, which you can review before saving. Imported recipes are stored in your browser (localStorage).
- **Eat My Fridge** — select the ingredients you have at home from a checklist (or add your own). The app searches the web for real recipes you can make with only those ingredients. If a recipe needs something you don't have but an easy substitute exists, it's shown with a warning that the substitute may slightly change the dish.

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## AI Configuration

Photo AI extraction and the Eat My Fridge recipe search require an OpenAI-compatible API. Create a `.env.local` file in the project root:

```env
AI_API_KEY=your_api_key_here
# Optional overrides:
AI_API_BASE_URL=https://api.openai.com/v1
AI_MODEL=gpt-4o
```

- `AI_API_KEY` — required for photo extraction and Eat My Fridge.
- `AI_API_BASE_URL` — default `https://api.openai.com/v1`. Point to any OpenAI-compatible endpoint.
- `AI_MODEL` — default `gpt-4o`. Must support image input for photo extraction.

### Eat My Fridge — web search

Eat My Fridge asks the AI to **search the web** for real recipes matching your ingredients. The route tries Google Search grounding first (via Gemini's native API) and falls back to the OpenAI-compatible endpoint if unavailable.

#### Google Gemini (recommended)

Get an API key from [Google AI Studio](https://aistudio.google.com/apikey). Configure:

```env
AI_API_KEY=your_gemini_api_key
AI_API_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
AI_MODEL=gemini-3.5-flash
```

The route automatically detects Gemini and calls the native `generateContent` API with the `google_search` tool for true web search. **Note:** Google Search grounding requires a paid Gemini plan. On the free tier, the route falls back to the OpenAI-compatible endpoint (recipes from AI training data, no live web search). The UI shows a warning banner when web search is unavailable.

#### Perplexity (alternative)

[Perplexity](https://docs.perplexity.ai) is a drop-in OpenAI-compatible provider that does web search by default:

```env
AI_API_KEY=your_perplexity_api_key
AI_API_BASE_URL=https://api.perplexity.ai
AI_MODEL=sonar
```

#### Other OpenAI-compatible providers

Any OpenAI-compatible endpoint works. Without a web-search-capable provider, the AI will suggest recipes from its training data — they may be plausible but not guaranteed to be real or current.

## Scripts

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — start the production server
- `npm run lint` — run ESLint

## Project Structure

```
app/
  api/
    extract/         # Social media caption/transcript extraction
    analyze-photo/   # AI photo-to-recipe extraction
    fridge-recipes/  # AI web-search for recipes by ingredients
  recipes/[id]/      # Recipe detail page
  desserts/          # Desserts listing
  mains/             # Mains listing
  import/            # Import page (link / social / photo)
  eat-my-fridge/     # Ingredient checklist + AI recipe search
components/
  RecipeCard.tsx       # Recipe card
  FridgeRecipeCard.tsx # Eat My Fridge result card with substitute warnings
  HealthRating.tsx     # Star rating display
  UnitToggle.tsx       # Metric/Imperial toggle
lib/
  types.ts        # TypeScript types
  recipes.ts      # Sample recipe data
  units.ts        # Unit conversion logic
  ingredients.ts  # Curated ingredient checklist for Eat My Fridge
