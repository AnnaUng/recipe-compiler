import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image || typeof image !== "string") {
      return NextResponse.json({ error: "Image data is required" }, { status: 400 });
    }

    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI_API_KEY is not configured. Add it to your .env.local file." },
        { status: 500 }
      );
    }

    const baseUrl = process.env.AI_API_BASE_URL || "https://api.openai.com/v1";
    const model = process.env.AI_MODEL || "gpt-4o";

    const prompt = `You are a recipe extraction assistant. Analyze the provided recipe photo and extract the recipe details in JSON format. Return ONLY valid JSON with no markdown formatting. Use this exact structure:
{
  "title": "string",
  "category": "main" | "dessert",
  "servings": number,
  "prepTime": number (minutes),
  "cookTime": number (minutes),
  "healthRating": number (1-5),
  "ingredients": [{ "name": "string", "quantity": number, "unit": "string", "cost": number }],
  "instructions": ["string"]
}

Guidelines:
- Extract all ingredients with quantities and units (g, kg, ml, l, tsp, tbsp, cup, piece, clove).
- Estimate a cost (in dollars) for each ingredient based on typical grocery prices.
- Set healthRating 1-5 based on how healthy the dish is (5 = very healthy).
- If you cannot determine a value, make a reasonable estimate or use 0.
- If the photo is not a recipe, return an empty ingredients array.`;

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: { url: image },
              },
            ],
          },
        ],
        temperature: 0.2,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `AI API error: ${response.status} ${errorText}` },
        { status: 502 }
      );
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Strip markdown code fences if present
    const cleaned = content
      .replace(/```json\s*/gi, "")
      .replace(/```\s*/g, "")
      .trim();

    let parsed;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid JSON. Please try again." },
        { status: 502 }
      );
    }

    return NextResponse.json({ recipe: parsed });
  } catch {
    return NextResponse.json({ error: "Failed to analyze photo" }, { status: 500 });
  }
}