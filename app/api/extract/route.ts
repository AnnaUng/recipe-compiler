import { NextRequest, NextResponse } from "next/server";
import { fetchTranscript } from "youtube-transcript";
import { scrapeRecipe } from "@/lib/scrape-recipe";

export const runtime = "nodejs";

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const videoId = extractVideoId(url);

    // YouTube: extract transcript
    if (videoId) {
      try {
        const transcript = await fetchTranscript(videoId);
        const text = transcript.map((t) => t.text).join(" ");
        return NextResponse.json({
          platform: "youtube",
          url,
          videoId,
          caption: text,
        });
      } catch {
        return NextResponse.json(
          { error: "Could not fetch transcript for this YouTube video." },
          { status: 500 }
        );
      }
    }

    // General recipe link: scrape the page for JSON-LD recipe data
    const recipe = await scrapeRecipe(url);
    if (recipe) {
      return NextResponse.json({
        platform: "web",
        url,
        recipe,
      });
    }

    // Fallback: no structured data found
    return NextResponse.json({
      platform: "other",
      url,
      caption: "",
      note: "Could not find structured recipe data on this page. The link has been saved — you can fill in the details manually.",
    });
  } catch {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }
}