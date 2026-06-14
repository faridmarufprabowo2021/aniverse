import { NextResponse } from "next/server";
import { getTopAnime } from "@/lib/api/anilist";
import type { AnimeFormat } from "@/types/anime";

export const revalidate = 21600; // 6 hours
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const perPage = parseInt(searchParams.get("perPage") ?? "25", 10);
    const format = (searchParams.get("format") as AnimeFormat) ?? undefined;

    const data = await getTopAnime(page, perPage, format);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API /api/anime/top]", error);
    return NextResponse.json(
      { error: "Failed to fetch top anime", message: String(error) },
      { status: 500 }
    );
  }
}
