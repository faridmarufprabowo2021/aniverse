import { NextResponse } from "next/server";
import { getSeasonalAnime, getCurrentSeason } from "@/lib/api/anilist";
import type { AnimeSeason } from "@/types/anime";

export const dynamic = "force-dynamic";
export const revalidate = 7200; // 2 hours

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const { season: currentSeason, year: currentYear } = getCurrentSeason();

    const season = (searchParams.get("season")?.toUpperCase() ?? currentSeason) as AnimeSeason;
    const year = parseInt(searchParams.get("year") ?? String(currentYear), 10);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const perPage = parseInt(searchParams.get("perPage") ?? "20", 10);

    const data = await getSeasonalAnime(season, year, page, perPage);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API /api/anime/seasonal]", error);
    return NextResponse.json(
      { error: "Failed to fetch seasonal anime", message: String(error) },
      { status: 500 }
    );
  }
}
