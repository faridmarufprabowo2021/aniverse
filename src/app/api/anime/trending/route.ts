import { NextResponse } from "next/server";
import { getTrendingAnime } from "@/lib/api/anilist";

export const dynamic = "force-dynamic";
export const revalidate = 3600; // 1 hour

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") ?? "1", 10);
    const perPage = parseInt(searchParams.get("perPage") ?? "20", 10);

    const data = await getTrendingAnime(page, perPage);
    return NextResponse.json(data);
  } catch (error) {
    console.error("[API /api/anime/trending]", error);
    return NextResponse.json(
      { error: "Failed to fetch trending anime", message: String(error) },
      { status: 500 }
    );
  }
}
