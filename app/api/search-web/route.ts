import { NextRequest, NextResponse } from "next/server";
import { scrapeRecipe } from "@/lib/scrape-recipe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface SearchResult {
  title: string;
  url: string;
  image: string;
  rating: number | null;
  ratingCount: number | null;
  source: string;
  snippet: string;
}

interface GoogleItem {
  title?: string;
  link?: string;
  snippet?: string;
  pagemap?: {
    cse_image?: { src?: string }[];
    metatags?: Record<string, string>[];
  };
}

/** Build a focused search query from the user's ingredients. */
function buildQuery(ingredients: string[]): string {
  // Use up to 5 ingredients for a focused query
  const parts = ingredients.slice(0, 5);
  return `recipe ${parts.join(" ")}`;
}

/** Extract a displayable source name from a URL. */
function getSourceName(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    return host;
  } catch {
    return url;
  }
}

export async function POST(req: NextRequest) {
  try {
    const { ingredients } = await req.json();

    if (
      !ingredients ||
      !Array.isArray(ingredients) ||
      ingredients.length === 0
    ) {
      return NextResponse.json(
        { error: "Please select at least one ingredient." },
        { status: 400 }
      );
    }

    const apiKey = process.env.SEARCH_API_KEY;
    const engineId = process.env.SEARCH_ENGINE_ID;

    if (!apiKey || !engineId) {
      return NextResponse.json(
        {
          error:
            "Web search is not configured. Add SEARCH_API_KEY and SEARCH_ENGINE_ID to your .env.local file.",
        },
        { status: 500 }
      );
    }

    const query = buildQuery(
      ingredients.filter((i: unknown) => typeof i === "string" && i.trim())
    );

    const searchUrl = new URL("https://www.googleapis.com/customsearch/v1");
    searchUrl.searchParams.set("key", apiKey);
    searchUrl.searchParams.set("cx", engineId);
    searchUrl.searchParams.set("q", query);
    searchUrl.searchParams.set("num", "10");

    const searchRes = await fetch(searchUrl.toString(), {
      signal: AbortSignal.timeout(15000),
    });

    if (!searchRes.ok) {
      const errorText = await searchRes.text();
      // Detect the common "Custom Search JSON API not enabled" case
      if (searchRes.status === 403 && errorText.includes("Custom Search JSON API")) {
        return NextResponse.json(
          {
            error:
              "Google Custom Search JSON API is not enabled for this API key. Enable it in the Google Cloud Console: https://console.cloud.google.com/apis/library/customsearch.googleapis.com",
          },
          { status: 502 }
        );
      }
      return NextResponse.json(
        { error: `Search API error: ${searchRes.status} ${errorText}` },
        { status: 502 }
      );
    }

    const searchData = await searchRes.json();
    const items: GoogleItem[] = searchData.items || [];

    // Scrape each result page for structured recipe data (rating, image, etc.)
    const results: SearchResult[] = [];
    for (const item of items) {
      const url = item.link || "";
      if (!url) continue;

      const scraped = await scrapeRecipe(url);

      results.push({
        title: item.title || scraped?.title || url,
        url,
        image:
          item.pagemap?.cse_image?.[0]?.src ||
          item.pagemap?.metatags?.[0]?.["og:image"] ||
          scraped?.image ||
          "/next.svg",
        rating: scraped?.rating ?? null,
        ratingCount: scraped?.ratingCount ?? null,
        source: getSourceName(url),
        snippet: item.snippet || "",
      });
    }

    // Sort: rated recipes first (highest rating), then by rating count,
    // then unrated recipes by original search order.
    const rated = results.filter((r) => r.rating !== null);
    const unrated = results.filter((r) => r.rating === null);

    rated.sort((a, b) => {
      const ratingDiff = (b.rating || 0) - (a.rating || 0);
      if (ratingDiff !== 0) return ratingDiff;
      return (b.ratingCount || 0) - (a.ratingCount || 0);
    });

    return NextResponse.json({
      results: [...rated, ...unrated],
      query,
    });
  } catch {
    return NextResponse.json(
      { error: "Failed to search the web. Please try again." },
      { status: 500 }
    );
  }
}