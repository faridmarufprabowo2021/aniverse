import { NextResponse } from "next/server";
import { searchAnime } from "@/lib/api/anilist";
import type { AnimeSeason, AnimeStatus, AnimeFormat, AnimeSort } from "@/types/anime";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const data = await searchAnime({
      search: searchParams.get("q") ?? undefined,
      genre: searchParams.get("genre") ?? undefined,
      year: searchParams.get("year") ? parseInt(searchParams.get("year")!, 10) : undefined,
      season: (searchParams.get("season")?.toUpperCase() as AnimeSeason) ?? undefined,
      status: (searchParams.get("status") as AnimeStatus) ?? undefined,
      format: (searchParams.get("format") as AnimeFormat) ?? undefined,
      sort: (searchParams.get("sort") as AnimeSort) ?? undefined,
      page: parseInt(searchParams.get("page") ?? "1", 10),
      perPage: parseInt(searchParams.get("perPage") ?? "20", 10),
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("[API /api/anime/search]", error);
    return NextResponse.json(
      { error: "Search failed", message: String(error) },
      { status: 500 }
    );
  }
}
