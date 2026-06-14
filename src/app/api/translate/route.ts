import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Free translation API using MyMemory (no API key needed).
 * Translates English text to Indonesian.
 * Rate limit: ~5000 chars/day anonymous, ~50000 with email.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const text = searchParams.get("text");
    const from = searchParams.get("from") || "en";
    const to = searchParams.get("to") || "id";

    if (!text) {
      return NextResponse.json({ error: "text parameter required" }, { status: 400 });
    }

    // MyMemory has a 500 char limit per request, split if needed
    const chunks = splitText(text, 450);
    const translated: string[] = [];

    for (const chunk of chunks) {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${from}|${to}`;
      const res = await fetch(url);
      
      if (!res.ok) {
        // If API fails, return original text
        translated.push(chunk);
        continue;
      }

      const data = await res.json();
      
      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        // MyMemory sometimes returns ALL CAPS for machine translations
        let result = data.responseData.translatedText;
        if (result === result.toUpperCase() && result.length > 20) {
          result = result.charAt(0).toUpperCase() + result.slice(1).toLowerCase();
        }
        translated.push(result);
      } else {
        translated.push(chunk);
      }
    }

    return NextResponse.json({
      originalText: text,
      translatedText: translated.join(" "),
      from,
      to,
    });
  } catch (error) {
    console.error("[API /api/translate]", error);
    return NextResponse.json({ error: "Translation failed" }, { status: 500 });
  }
}

function splitText(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];

  const chunks: string[] = [];
  const sentences = text.split(". ");
  let current = "";

  for (const sentence of sentences) {
    if ((current + sentence).length > maxLen && current.length > 0) {
      chunks.push(current.trim());
      current = "";
    }
    current += sentence + ". ";
  }

  if (current.trim()) chunks.push(current.trim());
  return chunks;
}
