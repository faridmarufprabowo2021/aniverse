/**
 * AniVerse Manga API — Multi-Provider Service
 * 
 * Primary: Komikindo (via Sanka Vollerei) — Most complete data
 * Fallback: Default Sanka Comic API
 * 
 * Provider priority for each feature:
 * - Homepage/Latest: Komikindo (has pagination, type, color info)
 * - Detail: Komikindo (has rating, author, illustrator, alt-titles, themes)
 * - Chapter Images: Komikindo → Default Sanka
 * - Search: Komikindo (paginated) → Default Sanka (aggregated)
 * - Genres: Komikindo (70+ genres)
 * - Popular: Komikindo (Top 10 with ratings)
 */

const SANKA_BASE = "https://www.sankavollerei.web.id/comic";
const KOMIKINDO = `${SANKA_BASE}/komikindo`;
const DEFAULT = SANKA_BASE;

// ─── Image Proxy Helper ─────────────────────────────────

/** Domains that DON'T need proxying (already allow direct access) */
const DIRECT_DOMAINS = ["s4.anilist.co", "cdn.myanimelist.net", "img.youtube.com"];

/**
 * Wraps a manga image URL through our server-side proxy
 * to bypass CDN hotlink protection.
 */
export function proxyImageUrl(url: string): string {
  if (!url) return "";
  try {
    const parsed = new URL(url);
    // Skip proxy for domains that allow direct access
    if (DIRECT_DOMAINS.some(d => parsed.hostname.includes(d))) return url;
    // Proxy all manga CDN images through our API
    return `/api/manga-image?url=${encodeURIComponent(url)}`;
  } catch {
    return url;
  }
}

// ─── Types ───────────────────────────────────────────────

export interface MangaListItem {
  title: string;
  slug: string;
  image: string;
  type?: string;        // Manga | Manhwa | Manhua
  color?: string;       // Warna | Hitam
  latestChapter?: string;
  chapters?: { title: string; slug: string; date?: string }[];
  rating?: string;
  author?: string;
  status?: string;
}

export interface MangaDetailData {
  id?: string;
  title: string;
  image: string;
  rating?: string;
  votes?: string;
  detail?: {
    alternativeTitle?: string;
    status?: string;
    author?: string;
    illustrator?: string;
    type?: string;
    theme?: string;
  };
  genres?: { name: string; slug?: string; value?: string }[];
  description?: string;
  firstChapter?: { title: string; slug: string };
  latestChapter?: { title: string; slug: string };
  chapters?: { title: string; slug: string; releaseTime?: string; date?: string }[];
  // Fallback fields from default Sanka API
  metadata?: {
    type?: string;
    author?: string;
    status?: string;
    concept?: string;
    age_rating?: string;
    reading_direction?: string;
  };
  synopsis?: string;
  synopsis_full?: string;
  similar_manga?: any[];
  _provider?: "komikindo" | "default";
}

export interface ChapterData {
  manga_title?: string;
  chapter_title?: string;
  navigation?: {
    previousChapter?: string | null;
    nextChapter?: string | null;
    chapterList?: string | null;
  };
  images: string[];
  _provider?: "komikindo" | "default";
}

export interface GenreItem {
  name: string;
  value: string;
}

export interface PaginationInfo {
  currentPage: number;
  totalPages?: number;
  hasNextPage: boolean;
  nextPage?: number | null;
}

// ─── Fetch Helper ────────────────────────────────────────

async function apiFetch<T>(url: string, timeout = 10000): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);
    const res = await fetch(url, { 
      signal: controller.signal,
      next: { revalidate: 300 } // Cache for 5 minutes
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

// ─── Homepage / Latest ───────────────────────────────────

export async function getLatestManga(page = 1): Promise<{
  comics: MangaListItem[];
  popular: MangaListItem[];
  pagination: PaginationInfo;
}> {
  // Try Komikindo first (most complete)
  const data = await apiFetch<any>(`${KOMIKINDO}/latest/${page}`);
  
  if (data?.success && data.komikList?.length > 0) {
    return {
      comics: (data.komikList as any[]).map(c => ({
        title: c.title,
        slug: c.slug,
        image: c.image || "",
        type: c.type,
        color: c.color,
        chapters: c.chapters?.map((ch: any) => ({
          title: ch.title,
          slug: ch.slug,
          date: ch.date,
        })) || [],
      })),
      popular: (data.komikPopuler || []).map((c: any) => ({
        title: c.title,
        slug: c.slug,
        image: c.image || "",
        rating: c.rating,
        author: c.author,
      })),
      pagination: data.pagination || { currentPage: page, hasNextPage: false },
    };
  }

  // Fallback to default Sanka
  const fallback = await apiFetch<any>(`${DEFAULT}/comic`);
  if (fallback) {
    const list = fallback?.data || [];
    return {
      comics: Array.isArray(list) ? list.map((c: any) => ({
        title: c.title,
        slug: c.slug || c.link,
        image: c.thumbnail || c.image || "",
        type: c.type,
        chapters: c.chapters || [],
      })) : [],
      popular: [],
      pagination: { currentPage: 1, hasNextPage: false },
    };
  }

  return { comics: [], popular: [], pagination: { currentPage: 1, hasNextPage: false } };
}

// ─── Manga Detail ────────────────────────────────────────

export async function getMangaDetail(slug: string): Promise<MangaDetailData | null> {
  // Try Komikindo first
  const data = await apiFetch<any>(`${KOMIKINDO}/detail/${slug}`);
  
  if (data?.success && data.data) {
    const d = data.data;
    return {
      id: d.id,
      title: (d.title || "").replace(/^Komik\n\s*/i, "").trim(),
      image: d.image || "",
      rating: d.rating,
      votes: d.votes,
      detail: {
        alternativeTitle: d.detail?.alternativeTitle,
        status: d.detail?.status,
        author: d.detail?.author,
        illustrator: d.detail?.illustrator,
        type: d.detail?.type,
        theme: d.detail?.theme,
      },
      genres: (d.genres || []).map((g: any) => ({
        name: g.name,
        slug: g.slug,
      })),
      description: d.description,
      firstChapter: d.firstChapter ? {
        title: (d.firstChapter.title || "").replace(/Chapter Awal\s*/i, "").trim(),
        slug: d.firstChapter.slug,
      } : undefined,
      latestChapter: d.latestChapter ? {
        title: (d.latestChapter.title || "").replace(/Chapter Baru\s*/i, "").trim(),
        slug: d.latestChapter.slug,
      } : undefined,
      chapters: (d.chapters || []).map((ch: any) => ({
        title: ch.title,
        slug: ch.slug,
        releaseTime: ch.releaseTime,
      })),
      _provider: "komikindo",
    };
  }

  // Fallback to default Sanka
  const fallback = await apiFetch<any>(`${DEFAULT}/comic/${slug}`);
  if (fallback) {
    const d = fallback?.data ?? fallback;
    return {
      title: d.title || "",
      image: d.image || "",
      metadata: d.metadata,
      genres: (d.genres || []).map((g: any) => ({
        name: typeof g === "string" ? g : g.name,
        slug: typeof g === "string" ? g : g.slug,
      })),
      description: d.synopsis_full || d.synopsis || d.summary || "",
      chapters: (d.chapters || []).map((ch: any) => ({
        title: ch.chapter || ch.title,
        slug: ch.slug,
        releaseTime: ch.date,
      })),
      _provider: "default",
    };
  }

  return null;
}

// ─── Chapter Reader ──────────────────────────────────────

export async function getChapter(slug: string): Promise<ChapterData | null> {
  // Try Komikindo first
  const raw = await apiFetch<any>(`${KOMIKINDO}/chapter/${slug}`);
  
  // Komikindo wraps response in data.data with images as {id, url} objects
  const kData = raw?.data;
  if (raw?.success && kData?.images?.length > 0) {
    // Extract images — they are objects {id, url}, not strings
    const images = kData.images.map((img: any) =>
      typeof img === "string" ? img : img.url || img.src || ""
    ).filter(Boolean);

    // Extract title — remove "Komik\n" prefix
    const chTitle = (kData.title || "").replace(/^Komik\n\s*/i, "").trim();
    const mangaTitle = kData.komikInfo?.title?.replace(/^Komik\s*/i, "").replace(/\s*Indo$/i, "").trim()
      || kData.thumbnail?.title?.replace(/^Komik\s*/i, "").trim()
      || "";

    return {
      manga_title: mangaTitle,
      chapter_title: chTitle,
      navigation: {
        // Komikindo uses prev/next, not previousChapter/nextChapter
        previousChapter: kData.navigation?.prev || null,
        nextChapter: kData.navigation?.next || null,
        chapterList: kData.allChapterSlug || null,
      },
      images,
      _provider: "komikindo",
    };
  }

  // Fallback to default Sanka
  const fallback = await apiFetch<any>(`${DEFAULT}/chapter/${slug}`);
  if (fallback) {
    const d = fallback?.data ?? fallback;
    // Default Sanka may also have images as objects
    const fbImages = (d.images || []).map((img: any) =>
      typeof img === "string" ? img : img.url || img.src || ""
    ).filter(Boolean);
    return {
      manga_title: d.manga_title,
      chapter_title: d.chapter_title,
      navigation: {
        previousChapter: d.navigation?.previousChapter || d.navigation?.prev || null,
        nextChapter: d.navigation?.nextChapter || d.navigation?.next || null,
        chapterList: d.navigation?.chapterList || d.allChapterSlug || null,
      },
      images: fbImages,
      _provider: "default",
    };
  }

  return null;
}

// ─── Search ──────────────────────────────────────────────

export async function searchManga(query: string, page = 1): Promise<{
  results: MangaListItem[];
  pagination: PaginationInfo;
}> {
  // Try Komikindo search (paginated)
  const data = await apiFetch<any>(`${KOMIKINDO}/search/${encodeURIComponent(query)}/${page}`);
  
  if (data?.success && data.komikList?.length > 0) {
    return {
      results: data.komikList.map((c: any) => ({
        title: c.title,
        slug: c.slug,
        image: c.image || "",
        type: c.type,
        color: c.color,
        rating: c.rating,
        chapters: c.chapters || [],
      })),
      pagination: data.pagination || { currentPage: page, hasNextPage: false },
    };
  }

  // Fallback to default Sanka aggregated search
  const fallback = await apiFetch<any>(`${DEFAULT}/search?q=${encodeURIComponent(query)}`);
  if (fallback) {
    const list = fallback?.data ?? [];
    return {
      results: Array.isArray(list) ? list.map((c: any) => ({
        title: c.title,
        slug: c.slug,
        image: c.thumbnail || c.image || "",
        type: c.type,
      })) : [],
      pagination: { currentPage: 1, hasNextPage: false },
    };
  }

  return { results: [], pagination: { currentPage: 1, hasNextPage: false } };
}

// ─── Genres ──────────────────────────────────────────────

export async function getGenres(): Promise<GenreItem[]> {
  const data = await apiFetch<any>(`${KOMIKINDO}/genres`);
  
  if (data?.success && data.genres?.length > 0) {
    // Deduplicate genres
    const seen = new Set<string>();
    return data.genres.filter((g: any) => {
      if (seen.has(g.value)) return false;
      seen.add(g.value);
      return true;
    }).map((g: any) => ({
      name: g.name,
      value: g.value,
    }));
  }

  return [];
}

// ─── Popular ─────────────────────────────────────────────

export async function getPopularManga(): Promise<MangaListItem[]> {
  const data = await apiFetch<any>(`${KOMIKINDO}/latest/1`);
  
  if (data?.success && data.komikPopuler?.length > 0) {
    return data.komikPopuler.map((c: any) => ({
      title: c.title,
      slug: c.slug,
      image: c.image || "",
      rating: c.rating,
      author: c.author,
    }));
  }

  return [];
}

// ─── Type Filter ─────────────────────────────────────────

export async function getMangaByType(type: "manga" | "manhwa" | "manhua"): Promise<MangaListItem[]> {
  // Use aggregated Sanka type endpoint
  const data = await apiFetch<any>(`${DEFAULT}/type/${type}`);
  
  if (data) {
    const list = data?.data ?? [];
    return Array.isArray(list) ? list.map((c: any) => ({
      title: c.title,
      slug: c.slug,
      image: c.thumbnail || c.image || "",
      type: c.type,
      latestChapter: c.latestChapter,
    })) : [];
  }

  return [];
}

// ─── Trending ────────────────────────────────────────────

export async function getTrendingManga(): Promise<MangaListItem[]> {
  const data = await apiFetch<any>(`${DEFAULT}/trending`);
  
  if (data) {
    const list = data?.data ?? [];
    return Array.isArray(list) ? list.map((c: any) => ({
      title: c.title,
      slug: c.slug,
      image: c.thumbnail || c.image || "",
      type: c.type,
    })) : [];
  }

  return [];
}
