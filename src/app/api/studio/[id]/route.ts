import { NextResponse } from "next/server";

const STUDIO_ANIME_QUERY = `
query GetStudioAnime($id: Int!, $page: Int!, $perPage: Int!) {
  Studio(id: $id) {
    id
    name
    siteUrl
    isAnimationStudio
    media(sort: [START_DATE_DESC], isMain: true, page: $page, perPage: $perPage) {
      pageInfo { total hasNextPage }
      nodes {
        id
        title { romaji english native }
        coverImage { large color }
        averageScore
        popularity
        episodes
        status
        format
        genres
        season
        seasonYear
        isAdult
        nextAiringEpisode { airingAt episode timeUntilAiring }
      }
    }
  }
}
`;

const ANILIST_ENDPOINT = "https://graphql.anilist.co";

export const revalidate = 21600; // 6 jam

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const studioId = parseInt(id, 10);
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const perPage = parseInt(searchParams.get("perPage") ?? "20", 10);

  if (isNaN(studioId)) {
    return NextResponse.json({ error: "ID studio tidak valid" }, { status: 400 });
  }

  try {
    const res = await fetch(ANILIST_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: STUDIO_ANIME_QUERY, variables: { id: studioId, page, perPage } }),
    });

    const json = await res.json();
    const studio = json.data?.Studio;

    if (!studio) {
      console.error("AniList Error for Studio ID:", studioId, json.errors);
      return NextResponse.json({ error: "Studio tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({
      id: studio.id,
      name: studio.name,
      siteUrl: studio.siteUrl,
      isAnimationStudio: studio.isAnimationStudio,
      anime: studio.media.nodes
        .filter((m: { isAdult: boolean }) => !m.isAdult)
        .map((m: { id: number; title: { romaji?: string; english?: string | null; native?: string | null }; coverImage: { large?: string; color?: string }; averageScore: number; popularity: number; episodes: number; status: string; format: string; genres: string[]; season: string; seasonYear: number; nextAiringEpisode: { airingAt: number; episode: number; timeUntilAiring: number } }) => ({
          id: m.id,
          title: m.title,
          coverImage: { large: m.coverImage.large, color: m.coverImage.color },
          averageScore: m.averageScore ? m.averageScore / 10 : undefined,
          popularity: m.popularity,
          episodes: m.episodes,
          status: m.status,
          format: m.format,
          genres: m.genres,
          season: m.season,
          year: m.seasonYear,
          isAiring: m.status === "RELEASING",
          nextAiringEpisode: m.nextAiringEpisode,
        })),
      total: studio.media.pageInfo.total,
      hasNextPage: studio.media.pageInfo.hasNextPage,
    });
  } catch (error) {
    return NextResponse.json({ error: "Gagal mengambil data studio", message: String(error) }, { status: 500 });
  }
}
