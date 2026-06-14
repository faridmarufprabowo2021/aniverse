import type { AnimeCard, AnimeDetail, AnimeSeason, AnimeSort, AnimeStatus, AnimeFormat, PaginatedResponse } from "@/types/anime";

const ANILIST_ENDPOINT = "https://graphql.anilist.co";

// ═══════════════════════════════════════
// GRAPHQL QUERIES
// ═══════════════════════════════════════

const ANIME_CARD_FRAGMENT = `
  id
  title { romaji english native }
  coverImage { extraLarge large color }
  bannerImage
  averageScore
  popularity
  trending
  episodes
  status
  format
  genres
  season
  seasonYear
  isAdult
  description(asHtml: false)
  nextAiringEpisode { airingAt episode timeUntilAiring }
`;

const ANIME_DETAIL_QUERY = `
query GetAnimeDetail($id: Int!) {
  Media(id: $id, type: ANIME) {
    id
    idMal
    title { romaji english native }
    synonyms
    description(asHtml: false)
    coverImage { extraLarge large color }
    bannerImage
    format
    status
    episodes
    duration
    season
    seasonYear
    averageScore
    meanScore
    popularity
    trending
    favourites
    rankings { rank type context allTime }
    genres
    tags { name rank isMediaSpoiler }
    studios(isMain: true) { nodes { id name siteUrl } }
    characters(sort: [ROLE, RELEVANCE], perPage: 20) {
      edges {
        role
        voiceActors(language: JAPANESE) { name { full native } image { medium } }
        node { id name { full native } image { medium } gender }
      }
    }
    relations {
      edges {
        relationType
        node {
          id
          title { romaji english }
          coverImage { medium }
          type
          format
          status
        }
      }
    }
    recommendations(sort: [RATING_DESC, ID], perPage: 12) {
      edges {
        node {
          mediaRecommendation {
            id
            title { romaji english }
            coverImage { medium }
            type
            format
            status
          }
        }
      }
    }
    reviews(sort: [RATING_DESC], perPage: 10) {
      edges {
        node {
          id
          score
          rating
          ratingAmount
          summary
          createdAt
          user { id name avatar { large } }
        }
      }
    }
    trailer { id site }
    externalLinks { url site type }
    streamingEpisodes { title thumbnail url site }
    nextAiringEpisode { airingAt episode timeUntilAiring }
    startDate { year month day }
    endDate { year month day }
    source
    hashtag
    isAdult
    stats { scoreDistribution { score amount } statusDistribution { status amount } }
  }
}
`;

const TRENDING_QUERY = `
query GetTrending($page: Int!, $perPage: Int!) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { total currentPage lastPage hasNextPage }
    media(type: ANIME, sort: [TRENDING_DESC], isAdult: false) { ${ANIME_CARD_FRAGMENT} }
  }
}
`;

const SEASONAL_QUERY = `
query GetSeasonal($season: MediaSeason!, $year: Int!, $page: Int!, $perPage: Int!) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { total currentPage lastPage hasNextPage }
    media(season: $season, seasonYear: $year, type: ANIME, sort: [POPULARITY_DESC], isAdult: false) {
      ${ANIME_CARD_FRAGMENT}
    }
  }
}
`;

const SEARCH_QUERY = `
query SearchAnime(
  $search: String
  $genre: String
  $year: Int
  $season: MediaSeason
  $status: MediaStatus
  $format: MediaFormat
  $sort: [MediaSort]
  $page: Int
  $perPage: Int
) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { total currentPage lastPage hasNextPage }
    media(
      search: $search
      genre: $genre
      seasonYear: $year
      season: $season
      status: $status
      format: $format
      type: ANIME
      sort: $sort
      isAdult: false
    ) { ${ANIME_CARD_FRAGMENT} }
  }
}
`;

const TOP_ANIME_QUERY = `
query GetTopAnime($page: Int!, $perPage: Int!, $format: MediaFormat) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { total currentPage lastPage hasNextPage }
    media(type: ANIME, sort: [SCORE_DESC], format: $format, isAdult: false, status: FINISHED) {
      ${ANIME_CARD_FRAGMENT}
    }
  }
}
`;

// ═══════════════════════════════════════
// RATE LIMITER
// ═══════════════════════════════════════

let requestCount = 0;
let windowStart = Date.now();
const MAX_REQUESTS_PER_MINUTE = 80;

async function respectRateLimit() {
  const now = Date.now();
  if (now - windowStart > 60_000) {
    requestCount = 0;
    windowStart = now;
  }
  requestCount++;
  if (requestCount > MAX_REQUESTS_PER_MINUTE) {
    const wait = 60_000 - (now - windowStart);
    await new Promise((r) => setTimeout(r, wait));
    requestCount = 1;
    windowStart = Date.now();
  }
}

// ═══════════════════════════════════════
// BASE FETCH
// ═══════════════════════════════════════

async function anilistFetch<T>(
  query: string,
  variables: Record<string, unknown>,
  options?: RequestInit
): Promise<T> {
  await respectRateLimit();

  const res = await fetch(ANILIST_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ query, variables }),
    ...options,
  });

  if (res.status === 429) {
    const retryAfter = parseInt(res.headers.get("Retry-After") ?? "60", 10);
    await new Promise((r) => setTimeout(r, retryAfter * 1000));
    return anilistFetch<T>(query, variables, options);
  }

  if (!res.ok) {
    throw new Error(`AniList HTTP ${res.status}: ${res.statusText}`);
  }

  const json = (await res.json()) as { data?: T; errors?: { message: string }[] };

  if (json.errors?.length) {
    throw new Error(`AniList GraphQL Error: ${json.errors[0].message}`);
  }

  return json.data as T;
}

// ═══════════════════════════════════════
// NORMALIZERS
// ═══════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeCard(media: any): AnimeCard {
  return {
    id: media.id,
    title: {
      romaji: media.title?.romaji ?? "Unknown",
      english: media.title?.english ?? null,
      native: media.title?.native ?? null,
    },
    coverImage: {
      extraLarge: media.coverImage?.extraLarge,
      large: media.coverImage?.large,
      color: media.coverImage?.color,
    },
    averageScore: media.averageScore ? media.averageScore / 10 : undefined,
    popularity: media.popularity,
    trending: media.trending,
    genres: media.genres ?? [],
    status: media.status,
    format: media.format,
    episodes: media.episodes,
    season: media.season,
    year: media.seasonYear,
    nextAiringEpisode: media.nextAiringEpisode,
    isAiring: media.status === "RELEASING",
    description: media.description ?? undefined,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeDetail(media: any): AnimeDetail {
  const card = normalizeCard(media);

  // Build trailer URL
  let trailerUrl: string | undefined;
  if (media.trailer?.id && media.trailer?.site === "youtube") {
    trailerUrl = `https://www.youtube.com/embed/${media.trailer.id}`;
  }

  // Build dates
  const formatDate = (d: { year?: number; month?: number; day?: number } | null) => {
    if (!d?.year) return undefined;
    return `${d.year}-${String(d.month ?? 1).padStart(2, "0")}-${String(d.day ?? 1).padStart(2, "0")}`;
  };

  return {
    ...card,
    malId: media.idMal,
    synonyms: media.synonyms,
    source: "anilist",
    synopsis: media.description?.replace(/<[^>]*>/g, "") ?? undefined,
    meanScore: media.meanScore ? media.meanScore / 10 : undefined,
    favourites: media.favourites,
    rankings: media.rankings,
    tags: media.tags,
    studios: media.studios?.nodes?.map((s: { id: number; name: string; siteUrl?: string }) => ({
      id: s.id,
      name: s.name,
      siteUrl: s.siteUrl,
      isMain: true,
    })),
    characters: media.characters?.edges?.map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (e: any) => ({
        id: e.node.id,
        name: e.node.name,
        image: e.node.image,
        gender: e.node.gender,
        role: e.role,
        voiceActor: e.voiceActors?.[0] ?? undefined,
      })
    ) ?? [],
    relations: media.relations?.edges?.map(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (e: any) => ({
        id: e.node.id,
        relationType: e.relationType,
        title: e.node.title,
        coverImage: e.node.coverImage,
        type: e.node.type,
        format: e.node.format,
        status: e.node.status,
      })
    ) ?? [],
    recommendations: media.recommendations?.edges
      ?.filter((e: any) => e.node?.mediaRecommendation != null)
      .map((e: any) => {
        const rec = e.node.mediaRecommendation;
        return {
          id: rec.id,
          title: rec.title,
          coverImage: rec.coverImage,
          type: rec.type,
          format: rec.format,
          status: rec.status,
        };
      }) ?? [],
    reviews: media.reviews?.edges?.map((e: any) => ({
      id: e.node.id,
      score: e.node.score,
      rating: e.node.rating,
      ratingAmount: e.node.ratingAmount,
      summary: e.node.summary,
      createdAt: e.node.createdAt,
      user: e.node.user ? {
        id: e.node.user.id,
        name: e.node.user.name,
        avatar: e.node.user.avatar?.large
      } : undefined
    })) ?? [],
    trailerUrl,
    externalLinks: media.externalLinks,
    streamingEpisodes: media.streamingEpisodes,
    airedFrom: formatDate(media.startDate),
    airedTo: formatDate(media.endDate),
    scoreDistribution: media.stats?.scoreDistribution,
    duration: media.duration,
    sourceMaterial: media.source,
    isAdult: media.isAdult ?? false,
  };
}

// ═══════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════

export async function getAnimeDetail(id: number): Promise<AnimeDetail> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await anilistFetch<{ Media: any }>(ANIME_DETAIL_QUERY, { id });
  return normalizeDetail(data.Media);
}

export async function getTrendingAnime(
  page = 1,
  perPage = 20
): Promise<PaginatedResponse<AnimeCard>> {
  const data = await anilistFetch<{
    Page: { pageInfo: { total: number; hasNextPage: boolean }; media: unknown[] };
  }>(TRENDING_QUERY, { page, perPage });

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: data.Page.media.map((m: any) => normalizeCard(m)),
    page,
    perPage,
    total: data.Page.pageInfo.total,
    hasNextPage: data.Page.pageInfo.hasNextPage,
  };
}

export async function getSeasonalAnime(
  season: AnimeSeason,
  year: number,
  page = 1,
  perPage = 20
): Promise<PaginatedResponse<AnimeCard>> {
  const data = await anilistFetch<{
    Page: { pageInfo: { total: number; hasNextPage: boolean }; media: unknown[] };
  }>(SEASONAL_QUERY, { season, year, page, perPage });

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: data.Page.media.map((m: any) => normalizeCard(m)),
    page,
    perPage,
    total: data.Page.pageInfo.total,
    hasNextPage: data.Page.pageInfo.hasNextPage,
  };
}

export async function searchAnime(params: {
  search?: string;
  genre?: string;
  year?: number;
  season?: AnimeSeason;
  status?: AnimeStatus;
  format?: AnimeFormat;
  sort?: AnimeSort;
  page?: number;
  perPage?: number;
}): Promise<PaginatedResponse<AnimeCard>> {
  const variables = {
    search: params.search || undefined,
    genre: params.genre || undefined,
    year: params.year || undefined,
    season: params.season || undefined,
    status: params.status || undefined,
    format: params.format || undefined,
    sort: params.sort ? [params.sort] : ["SEARCH_MATCH"],
    page: params.page ?? 1,
    perPage: params.perPage ?? 20,
  };

  const data = await anilistFetch<{
    Page: { pageInfo: { total: number; hasNextPage: boolean }; media: unknown[] };
  }>(SEARCH_QUERY, variables);

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: data.Page.media.map((m: any) => normalizeCard(m)),
    page: params.page ?? 1,
    perPage: params.perPage ?? 20,
    total: data.Page.pageInfo.total,
    hasNextPage: data.Page.pageInfo.hasNextPage,
  };
}

export async function getTopAnime(
  page = 1,
  perPage = 20,
  format?: AnimeFormat
): Promise<PaginatedResponse<AnimeCard>> {
  const variables: Record<string, unknown> = { page, perPage };
  if (format) variables.format = format;

  const data = await anilistFetch<{
    Page: { pageInfo: { total: number; hasNextPage: boolean }; media: unknown[] };
  }>(TOP_ANIME_QUERY, variables);

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data: data.Page.media.map((m: any) => normalizeCard(m)),
    page,
    perPage,
    total: data.Page.pageInfo.total,
    hasNextPage: data.Page.pageInfo.hasNextPage,
  };
}

// ═══════════════════════════════════════
// UTILS
// ═══════════════════════════════════════

export function getCurrentSeason(): { season: AnimeSeason; year: number } {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  let season: AnimeSeason;
  if (month >= 1 && month <= 3) season = "WINTER";
  else if (month >= 4 && month <= 6) season = "SPRING";
  else if (month >= 7 && month <= 9) season = "SUMMER";
  else season = "FALL";

  return { season, year };
}

// ═══════════════════════════════════════
// AIRING SCHEDULE
// ═══════════════════════════════════════

const AIRING_SCHEDULE_QUERY = `
query GetAiringSchedule($airingAtGreater: Int, $airingAtLesser: Int, $page: Int, $perPage: Int) {
  Page(page: $page, perPage: $perPage) {
    pageInfo { total hasNextPage }
    airingSchedules(airingAt_greater: $airingAtGreater, airingAt_lesser: $airingAtLesser, sort: [TIME]) {
      id
      airingAt
      timeUntilAiring
      episode
      media {
        id
        title { romaji english native }
        coverImage { large color }
        format
        episodes
        averageScore
        genres
        status
        isAdult
      }
    }
  }
}
`;

export interface AiringScheduleItem {
  id: number;
  airingAt: number;
  timeUntilAiring: number;
  episode: number;
  media: {
    id: number;
    title: { romaji: string; english?: string; native?: string };
    coverImage: { large?: string; color?: string };
    format?: string;
    episodes?: number;
    averageScore?: number;
    genres: string[];
    status: string;
    isAdult: boolean;
  };
}

export async function getAiringSchedule(
  startTime: number,
  endTime: number,
  page = 1,
  perPage = 50
): Promise<{ schedules: AiringScheduleItem[]; hasNextPage: boolean }> {
  const data = await anilistFetch<{
    Page: {
      pageInfo: { hasNextPage: boolean };
      airingSchedules: AiringScheduleItem[];
    };
  }>(AIRING_SCHEDULE_QUERY, {
    airingAtGreater: startTime,
    airingAtLesser: endTime,
    page,
    perPage,
  });

  // Filter out adult content
  const filtered = data.Page.airingSchedules.filter(s => !s.media.isAdult);

  return {
    schedules: filtered,
    hasNextPage: data.Page.pageInfo.hasNextPage,
  };
}

