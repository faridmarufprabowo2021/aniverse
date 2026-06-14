// ═══════════════════════════════════════════════════════
// SANKA VOLLEREI — COMIC API
// Base: https://www.sankavollerei.web.id/comic
// ═══════════════════════════════════════════════════════

const COMIC_API = "https://www.sankavollerei.web.id/comic";

export type ComicProvider =
  | "komiku"
  | "bacakomik"
  | "komikstation"
  | "komikindo"
  | "westmanga"
  | "manhwaindo"
  | "kiryuu"
  | "mangaku"
  | "rawkuma"
  | "klikmanga"
  | "mangaindo"
  | "shinigami";

export interface ComicItem {
  title: string;
  slug: string;
  poster?: string;
  type?: string; // Manga, Manhwa, Manhua
  status?: string;
  score?: string;
  chapter?: string;
  latestChapter?: string;
  updatedAt?: string;
}

export interface ComicDetail {
  title: string;
  slug: string;
  poster?: string;
  synopsis?: string;
  status?: string;
  type?: string;
  score?: string;
  genres?: string[];
  author?: string;
  artist?: string;
  chapterList: ChapterItem[];
}

export interface ChapterItem {
  title: string;
  slug: string;
  chapterId: string;
  date?: string;
}

export interface ChapterData {
  title?: string;
  images: string[];
  prevChapter?: { slug: string } | null;
  nextChapter?: { slug: string } | null;
}

export interface ComicHomepage {
  trending?: ComicItem[];
  latestUpdates?: ComicItem[];
  popular?: ComicItem[];
}

// ─── Fetch helper ───────────────────────────────────────
async function comicFetch<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${COMIC_API}${path}`, {
      next: { revalidate: 300 }, // 5 min cache
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? json ?? null;
  } catch {
    return null;
  }
}

// ─── Public API ─────────────────────────────────────────

export async function getComicHomepage(): Promise<ComicHomepage> {
  const data = await comicFetch<any>("/homepage");
  if (!data) return {};
  return {
    trending: data.trending ?? data.popular ?? [],
    latestUpdates: data.latestUpdate ?? data.latest ?? [],
    popular: data.popular ?? [],
  };
}

export async function searchComics(
  query: string,
  provider?: ComicProvider
): Promise<ComicItem[]> {
  const path = provider
    ? `/${provider}/search/${encodeURIComponent(query)}`
    : `/search?q=${encodeURIComponent(query)}`;
  const data = await comicFetch<ComicItem[]>(path);
  return data ?? [];
}

export async function getComicDetail(slug: string): Promise<ComicDetail | null> {
  return comicFetch<ComicDetail>(`/comic/${slug}`);
}

export async function getChapterData(slug: string): Promise<ChapterData | null> {
  return comicFetch<ChapterData>(`/chapter/${slug}`);
}

export async function getTrendingComics(): Promise<ComicItem[]> {
  const data = await comicFetch<any>("/trending");
  return Array.isArray(data) ? data : data?.trending ?? [];
}

export async function getLatestComics(provider?: ComicProvider): Promise<ComicItem[]> {
  const path = provider ? `/${provider}/latest` : "/homepage";
  const data = await comicFetch<any>(path);
  if (provider) return Array.isArray(data) ? data : [];
  return data?.latestUpdates ?? data?.latest ?? [];
}
