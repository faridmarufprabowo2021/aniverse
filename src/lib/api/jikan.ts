import type { AnimeCard, AnimeDetail } from "@/types/anime";

const JIKAN_BASE = "https://api.jikan.moe/v4";

// Jikan has a 3 req/sec rate limit — wait at least 400ms between calls
let lastJikanCall = 0;

async function jikanFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const now = Date.now();
  const elapsed = now - lastJikanCall;
  if (elapsed < 400) {
    await new Promise((r) => setTimeout(r, 400 - elapsed));
  }
  lastJikanCall = Date.now();

  const res = await fetch(`${JIKAN_BASE}${path}`, {
    headers: { Accept: "application/json" },
    ...options,
  });

  if (res.status === 429) {
    await new Promise((r) => setTimeout(r, 2000));
    return jikanFetch<T>(path, options);
  }

  if (!res.ok) {
    throw new Error(`Jikan HTTP ${res.status}: ${await res.text()}`);
  }

  return (await res.json()) as T;
}

// ═══════════════════════════════════════
// JIKAN → ANIVERSE NORMALIZER
// ═══════════════════════════════════════

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeJikanCard(anime: any): AnimeCard {
  return {
    id: anime.mal_id,
    title: {
      romaji: anime.title ?? anime.title_english ?? "Unknown",
      english: anime.title_english ?? null,
      native: anime.title_japanese ?? null,
    },
    coverImage: {
      extraLarge: anime.images?.webp?.large_image_url ?? anime.images?.jpg?.large_image_url,
      large: anime.images?.webp?.image_url ?? anime.images?.jpg?.image_url,
    },
    averageScore: anime.score ? anime.score : undefined,
    popularity: anime.members,
    genres: (anime.genres ?? []).map((g: { name: string }) => g.name),
    status: normalizeJikanStatus(anime.status),
    format: normalizeJikanType(anime.type),
    episodes: anime.episodes,
    year: anime.year ?? anime.aired?.prop?.from?.year,
    season: anime.season?.toUpperCase(),
    isAiring: anime.airing,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeJikanDetail(anime: any): Partial<AnimeDetail> {
  const card = normalizeJikanCard(anime);
  return {
    ...card,
    malId: anime.mal_id,
    source: "jikan",
    synopsis: anime.synopsis ?? undefined,
    bannerImage: undefined,
    trailerUrl: anime.trailer?.embed_url ?? undefined,
    sourceMaterial: anime.source ? anime.source.toUpperCase() : undefined,
    duration: parseDuration(anime.duration),
    studios: (anime.studios ?? []).map((s: { name: string; url: string }) => ({
      name: s.name,
      siteUrl: s.url,
      isMain: true,
    })),
    externalLinks: anime.external
      ? anime.external.map((e: { name: string; url: string }) => ({ site: e.name, url: e.url }))
      : [],
    isAdult: anime.rating?.includes("Rx") ?? false,
    airedFrom: anime.aired?.from ? anime.aired.from.split("T")[0] : undefined,
    airedTo: anime.aired?.to ? anime.aired.to.split("T")[0] : undefined,
  };
}

function normalizeJikanStatus(status: string) {
  if (!status) return "FINISHED" as const;
  const s = status.toLowerCase();
  if (s.includes("airing")) return "RELEASING" as const;
  if (s.includes("completed") || s.includes("finished")) return "FINISHED" as const;
  if (s.includes("upcoming")) return "NOT_YET_RELEASED" as const;
  return "FINISHED" as const;
}

function normalizeJikanType(type: string) {
  if (!type) return undefined;
  const t = type.toUpperCase();
  const map: Record<string, "TV" | "MOVIE" | "OVA" | "ONA" | "SPECIAL"> = {
    TV: "TV",
    MOVIE: "MOVIE",
    OVA: "OVA",
    ONA: "ONA",
    SPECIAL: "SPECIAL",
  };
  return map[t];
}

function parseDuration(duration: string): number | undefined {
  if (!duration) return undefined;
  const match = duration.match(/(\d+)\s*min/);
  return match ? parseInt(match[1], 10) : undefined;
}

// ═══════════════════════════════════════
// PUBLIC API
// ═══════════════════════════════════════

export async function getJikanAnimeDetail(malId: number): Promise<Partial<AnimeDetail>> {
  const data = await jikanFetch<{ data: unknown }>(`/anime/${malId}/full`);
  return normalizeJikanDetail(data.data);
}

export async function getJikanAiringToday(): Promise<AnimeCard[]> {
  const days = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const today = days[new Date().getDay()];

  const data = await jikanFetch<{ data: unknown[] }>(`/schedules?filter=${today}&limit=25`);
  return (data.data ?? []).map(normalizeJikanCard);
}

export async function getJikanSeasonal(year: number, season: string): Promise<AnimeCard[]> {
  const data = await jikanFetch<{ data: unknown[] }>(
    `/seasons/${year}/${season.toLowerCase()}?limit=25`
  );
  return (data.data ?? []).map(normalizeJikanCard);
}

export async function searchJikan(query: string): Promise<AnimeCard[]> {
  const data = await jikanFetch<{ data: unknown[] }>(
    `/anime?q=${encodeURIComponent(query)}&limit=20&sfw=true`
  );
  return (data.data ?? []).map(normalizeJikanCard);
}
