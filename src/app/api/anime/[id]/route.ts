import { NextResponse } from "next/server";
import { getAnimeDetail } from "@/lib/api/anilist";
import { getJikanAnimeDetail } from "@/lib/api/jikan";

export const revalidate = 3600; // 1 hour ISR

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const animeId = parseInt(id, 10);

  if (isNaN(animeId)) {
    return NextResponse.json({ error: "Invalid anime ID" }, { status: 400 });
  }

  try {
    // Try AniList first
    const detail = await getAnimeDetail(animeId);
    return NextResponse.json(detail);
  } catch (anilistError) {
    console.warn(`[API] AniList failed for ${animeId}, trying Jikan...`, anilistError);

    try {
      // Fallback to Jikan (which uses MAL IDs, so this won't always work)
      const jikanDetail = await getJikanAnimeDetail(animeId);
      return NextResponse.json(jikanDetail);
    } catch (jikanError) {
      console.error(`[API] Both sources failed for ${animeId}`, jikanError);
      return NextResponse.json(
        { error: "Anime not found", message: "Could not fetch from any source" },
        { status: 404 }
      );
    }
  }
}
