export const SANKA_API_URL = "https://www.sankavollerei.web.id/anime";

// ═══════════════════════════════════════
// SHARED TYPES
// ═══════════════════════════════════════

export interface SankaSearchItem {
  title: string;
  poster: string;
  animeId: string;  // samehadaku
  slug?: string;    // stream, animasu, anoboy
  href?: string;
  status: string;
  score?: string;
  type?: string;
}

export interface SankaEpisodeItem {
  title: number | string;
  episodeId: string;
  href?: string;
}

export interface SankaAnimeDetail {
  title: string;
  poster: string;
  synopsis?: { paragraphs: string[] };
  genreList?: { title: string; genreId: string }[];
  episodeList: SankaEpisodeItem[];
}

export interface SankaServerItem {
  title: string;
  serverId: string;
  href: string;
}

export interface SankaQualityGroup {
  title: string;
  serverList: SankaServerItem[];
}

export interface SankaEpisodeDetail {
  title: string;
  defaultStreamingUrl?: string;
  streamLinks?: { server: string; url: string }[];  // Stream API format
  server?: {
    qualities: SankaQualityGroup[];
  };
  hasPrevEpisode?: boolean;
  prevEpisode?: { episodeId: string } | null;
  hasNextEpisode?: boolean;
  nextEpisode?: { episodeId: string } | null;
}

// ═══════════════════════════════════════
// PROVIDER DEFINITIONS
// ═══════════════════════════════════════

export type ProviderKey = "samehadaku" | "stream" | "otakudesu" | "oploverz" | "winbu";

export interface ProviderConfig {
  key: ProviderKey;
  name: string;
  emoji: string;
  color: string;
  searchFn: (keyword: string) => Promise<SankaSearchItem[]>;
  detailFn: (animeId: string) => Promise<SankaAnimeDetail>;
  episodeFn: (episodeId: string) => Promise<SankaEpisodeDetail>;
  serverFn?: (serverId: string) => Promise<string>;
}

// ═══════════════════════════════════════
// UTILITY: Clean search keyword
// ═══════════════════════════════════════

function cleanKeyword(keyword: string, maxWords: number = 5): string {
  return keyword
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .trim()
    .split(/\s+/)
    .slice(0, maxWords)
    .join(" ");
}

/**
 * Calculate word-overlap similarity between two titles.
 * Returns a score between 0 and 1.
 */
function titleSimilarity(a: string, b: string): number {
  const normalize = (s: string) => {
    let cleaned = s.toLowerCase().replace(/[^a-z0-9\s]/g, " ");
    // Remove common noise words that ruin Jaccard similarity calculations
    cleaned = cleaned.replace(/\b(season|part|cour|the|of|in|to|and|no)\b/g, " ");
    return cleaned.replace(/\s+/g, " ").trim();
  };

  const wordsA = new Set(normalize(a).split(" ").filter(Boolean));
  const wordsB = new Set(normalize(b).split(" ").filter(Boolean));

  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let overlap = 0;
  for (const w of wordsA) {
    if (wordsB.has(w)) overlap++;
  }

  // Jaccard-like: overlap / union
  const union = new Set([...wordsA, ...wordsB]).size;
  return overlap / union;
}

/** Find the best matching result from a search results list */
function findBestMatch(
  results: SankaSearchItem[],
  keyword: string,
  altKeyword?: string
): SankaSearchItem | null {
  let bestMatch: SankaSearchItem | null = null;
  let bestScore = 0;

  for (const r of results) {
    let score = titleSimilarity(r.title, keyword);
    if (altKeyword) {
      score = Math.max(score, titleSimilarity(r.title, altKeyword));
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = r;
    }
  }

  // Require at least 20% word overlap to consider it a match
  // ⛔ FIXED: DO NOT return results[0] if it fails the threshold. 
  // Returning null allows the app to fallback to the next provider instead of playing the wrong anime.
  return bestScore >= 0.20 ? bestMatch : null;
}

// ═══════════════════════════════════════
// PROVIDER 1: SAMEHADAKU (Primary)
// Google Blogger player — ad-free!
// ═══════════════════════════════════════

async function samehadakuSearch(keyword: string): Promise<SankaSearchItem[]> {
  const q = encodeURIComponent(cleanKeyword(keyword));
  const res = await fetch(`${SANKA_API_URL}/samehadaku/search?q=${q}`);
  if (!res.ok) throw new Error(`Samehadaku search failed (${res.status})`);
  const json = await res.json();
  if (json.status !== "success") throw new Error("Samehadaku API error");
  return (json.data?.animeList || []).map((item: Record<string, string>) => ({
    ...item,
    animeId: item.animeId,
  }));
}

async function samehadakuDetail(animeId: string): Promise<SankaAnimeDetail> {
  const res = await fetch(`${SANKA_API_URL}/samehadaku/anime/${animeId}`);
  if (!res.ok) throw new Error("Samehadaku detail failed");
  const json = await res.json();
  if (json.status !== "success") throw new Error("Samehadaku API error");
  return json.data;
}

async function samehadakuEpisode(episodeId: string): Promise<SankaEpisodeDetail> {
  const res = await fetch(`${SANKA_API_URL}/samehadaku/episode/${episodeId}`);
  if (!res.ok) throw new Error("Samehadaku episode failed");
  const json = await res.json();
  if (json.status !== "success") throw new Error("Samehadaku API error");
  
  let defaultUrl = json.data.defaultStreamingUrl || "";
  
  // Filter out invalid placeholders returned by Sanka API 
  if (defaultUrl.includes("google.com/") && !defaultUrl.includes("blogger.com")) {
    defaultUrl = "";
  }

  return {
    title: json.data.title,
    defaultStreamingUrl: defaultUrl,
    server: json.data.server,
    hasPrevEpisode: json.data.hasPrevEpisode,
    prevEpisode: json.data.prevEpisode,
    hasNextEpisode: json.data.hasNextEpisode,
    nextEpisode: json.data.nextEpisode,
  };
}

async function samehadakuServer(serverId: string): Promise<string> {
  const res = await fetch(`${SANKA_API_URL}/samehadaku/server/${serverId}`);
  if (!res.ok) throw new Error("Samehadaku server failed");
  const json = await res.json();
  if (json.status !== "success") throw new Error("Samehadaku API error");
  return json.data?.url || "";
}

// ═══════════════════════════════════════
// PROVIDER 2: STREAM (Fallback 1)
// GDrive player + MP4Upload
// ═══════════════════════════════════════

async function streamSearch(keyword: string): Promise<SankaSearchItem[]> {
  const q = encodeURIComponent(cleanKeyword(keyword));
  const res = await fetch(`${SANKA_API_URL}/stream/search/${q}`);
  if (!res.ok) throw new Error(`Stream search failed (${res.status})`);
  const json = await res.json();
  if (json.status !== 200) throw new Error("Stream API error");
  return (json.data || []).map((item: Record<string, string>) => ({
    title: item.title,
    poster: item.poster,
    animeId: item.slug,
    slug: item.slug,
    type: item.type,
    status: "",
  }));
}

async function streamDetail(slug: string): Promise<SankaAnimeDetail> {
  const res = await fetch(`${SANKA_API_URL}/stream/anime/${slug}`);
  if (!res.ok) throw new Error("Stream detail failed");
  const json = await res.json();
  if (json.status !== 200) throw new Error("Stream API error");
  
  // Map episodes to common format
  const episodes: SankaEpisodeItem[] = (json.data?.episodes || []).map((ep: Record<string, string>) => ({
    title: ep.title || ep.eps_title || ep.episode,
    episodeId: ep.slug || ep.eps_slug,
    href: "",
  }));
  
  return {
    title: json.data?.title || slug,
    poster: json.data?.poster || "",
    episodeList: episodes,
  };
}

async function streamEpisode(slug: string): Promise<SankaEpisodeDetail> {
  const res = await fetch(`${SANKA_API_URL}/stream/episode/${slug}`);
  if (!res.ok) throw new Error("Stream episode failed");
  const json = await res.json();
  if (json.status !== 200) throw new Error("Stream API error");
  
  // Known broken/ad domains to filter out
  const BLOCKED_DOMAINS = [
    "gdriveplayer.to",
    "gdriveplayer.us",
    "gdriveplayer.me",
    "hawkobdhang.shop",
    "lifestylestip.com",
    "google.com" // placeholder / blocked 
  ];
  
  // Filter stream_links to only keep working URLs
  const rawLinks = json.data?.stream_links || [];
  const validLinks = rawLinks.filter((link: { server: string; url: string }) => {
    if (!link.url || link.url.trim() === "") return false;
    // Sanka stream links occasionally return plain 'https://www.google.com/' or broken blogger
    if (link.url.includes("google.com/") && !link.url.includes("blogger.com")) return false;
    
    try {
      const url = new URL(link.url);
      return !BLOCKED_DOMAINS.some(d => url.hostname.includes(d));
    } catch {
      return false;
    }
  });
  
  // Use the first valid stream URL as default
  const defaultUrl = validLinks[0]?.url || "";
  
  // If all links are blocked/invalid, throw so fallback kicks in
  if (validLinks.length === 0 && rawLinks.length > 0) {
    throw new Error("Stream Indo: All stream URLs are blocked or invalid");
  }
  
  return {
    title: json.data?.title || slug,
    defaultStreamingUrl: defaultUrl,
    streamLinks: validLinks,
    hasPrevEpisode: !!json.data?.prev_slug,
    prevEpisode: json.data?.prev_slug ? { episodeId: json.data.prev_slug } : null,
    hasNextEpisode: !!json.data?.next_slug,
    nextEpisode: json.data?.next_slug ? { episodeId: json.data.next_slug } : null,
  };
}

// ═══════════════════════════════════════
// PROVIDER 3: OTAKUDESU (Fallback 2)
// Original provider — has ads but extensive library
// ═══════════════════════════════════════

async function otakudesuSearch(keyword: string): Promise<SankaSearchItem[]> {
  const q = encodeURIComponent(cleanKeyword(keyword));
  const res = await fetch(`${SANKA_API_URL}/search/${q}`);
  if (!res.ok) throw new Error(`Otakudesu search failed (${res.status})`);
  const json = await res.json();
  if (json.status !== "success") throw new Error("Otakudesu API error");
  return (json.data?.animeList || []).map((item: Record<string, string>) => ({
    title: item.title,
    poster: item.poster,
    animeId: item.animeId || item.slug,
    status: item.status || "",
    score: item.score,
    type: item.type,
  }));
}

async function otakudesuDetail(animeId: string): Promise<SankaAnimeDetail> {
  const res = await fetch(`${SANKA_API_URL}/anime/${animeId}`);
  if (!res.ok) throw new Error("Otakudesu detail failed");
  const json = await res.json();
  if (json.status !== "success") throw new Error("Otakudesu API error");
  return json.data;
}

async function otakudesuEpisode(episodeId: string): Promise<SankaEpisodeDetail> {
  const res = await fetch(`${SANKA_API_URL}/episode/${episodeId}`);
  if (!res.ok) throw new Error("Otakudesu episode failed");
  const json = await res.json();
  if (json.status !== "success") throw new Error("Otakudesu API error");
  return {
    title: json.data?.title || episodeId,
    server: json.data?.server,
  };
}

async function otakudesuServer(serverId: string): Promise<string> {
  const res = await fetch(`${SANKA_API_URL}/server/${serverId}`);
  if (!res.ok) throw new Error("Otakudesu server failed");
  const json = await res.json();
  if (json.status !== "success") throw new Error("Otakudesu API error");
  return json.data?.url || "";
}

// ═══════════════════════════════════════
// PROVIDER 4: OPLOVERZ (Fallback 3)
// Filedon-based player — reliable streams
// ═══════════════════════════════════════

function extractOploverzSlug(oploverzUrl: string): string {
  try {
    const pathname = new URL(oploverzUrl).pathname;
    const parts = pathname.split('/').filter(Boolean);
    return parts[parts.length - 1] || '';
  } catch {
    return '';
  }
}

async function oploverzSearch(keyword: string): Promise<SankaSearchItem[]> {
  const q = encodeURIComponent(cleanKeyword(keyword));
  const res = await fetch(`${SANKA_API_URL}/oploverz/search/${q}`);
  if (!res.ok) throw new Error(`Oploverz search failed (${res.status})`);
  const json = await res.json();
  if (json.status !== "success") throw new Error("Oploverz API error");
  return (json.anime_list || []).map((item: Record<string, string>) => {
    const realSlug = extractOploverzSlug(item.oploverz_url || '') || item.slug;
    return {
      title: item.title,
      poster: item.poster,
      animeId: realSlug,
      slug: realSlug,
      type: item.type,
      status: item.status || '',
    };
  });
}

async function oploverzDetail(slug: string): Promise<SankaAnimeDetail> {
  const res = await fetch(`${SANKA_API_URL}/oploverz/anime/${slug}`);
  if (!res.ok) throw new Error("Oploverz detail failed");
  const json = await res.json();
  if (json.status !== "success") throw new Error("Oploverz API error");

  const detail = json.detail || {};
  const episodes: SankaEpisodeItem[] = (detail.episode_list || []).map((ep: Record<string, string>) => ({
    title: ep.episode || ep.title,
    episodeId: ep.slug,
    href: ep.url || '',
  }));

  return {
    title: detail.title || slug,
    poster: detail.poster || '',
    synopsis: detail.synopsis ? { paragraphs: [detail.synopsis] } : undefined,
    episodeList: episodes,
  };
}

async function oploverzEpisode(slug: string): Promise<SankaEpisodeDetail> {
  const res = await fetch(`${SANKA_API_URL}/oploverz/episode/${slug}`);
  if (!res.ok) throw new Error("Oploverz episode failed");
  const json = await res.json();
  if (json.status !== "success") throw new Error("Oploverz API error");

  const streams = json.streams || [];
  const validStreams = streams.filter((s: { url: string }) => {
    if (!s.url || s.url.trim() === '') return false;
    if (s.url.includes('google.com/') && !s.url.includes('blogger.com')) return false;
    return true;
  });

  const defaultUrl = validStreams[0]?.url || '';
  if (validStreams.length === 0 && streams.length > 0) {
    throw new Error('Oploverz: All stream URLs invalid');
  }

  return {
    title: json.episode_title || slug,
    defaultStreamingUrl: defaultUrl,
    streamLinks: validStreams.map((s: { name: string; url: string }) => ({
      server: s.name,
      url: s.url,
    })),
  };
}

// ═══════════════════════════════════════
// PROVIDER 5: WINBU (Fallback 4)
// Multi-resolution with server-resolve
// ═══════════════════════════════════════

async function winbuSearch(keyword: string): Promise<SankaSearchItem[]> {
  const q = encodeURIComponent(cleanKeyword(keyword));
  const res = await fetch(`${SANKA_API_URL}/winbu/search?q=${q}`);
  if (!res.ok) throw new Error(`Winbu search failed (${res.status})`);
  const json = await res.json();
  if (json.status !== "success") throw new Error("Winbu API error");
  return (json.results || []).map((item: Record<string, string>) => ({
    title: item.title,
    poster: item.image,
    animeId: item.id,
    slug: item.id,
    type: item.type,
    status: '',
  }));
}

async function winbuDetail(animeId: string): Promise<SankaAnimeDetail> {
  const res = await fetch(`${SANKA_API_URL}/winbu/anime/${animeId}`);
  if (!res.ok) throw new Error("Winbu detail failed");
  const json = await res.json();
  if (json.status !== "success") throw new Error("Winbu API error");

  const data = json.data || {};
  const episodes: SankaEpisodeItem[] = (data.episodes || []).map((ep: Record<string, string>) => ({
    title: ep.title,
    episodeId: ep.id,
    href: ep.link || '',
  }));

  return {
    title: data.title || animeId,
    poster: data.image || '',
    synopsis: data.synopsis ? { paragraphs: [data.synopsis] } : undefined,
    episodeList: episodes,
  };
}

interface WinbuStreamData {
  post: string;
  nume: string;
  type: string;
}

async function winbuEpisode(episodeId: string): Promise<SankaEpisodeDetail> {
  const res = await fetch(`${SANKA_API_URL}/winbu/episode/${episodeId}`);
  if (!res.ok) throw new Error("Winbu episode failed");
  const json = await res.json();
  if (json.status !== "success") throw new Error("Winbu API error");

  const data = json.data || {};
  const streams: { resolution: string; server: string; data: WinbuStreamData }[] = data.streams || [];
  const nav = data.navigation || {};

  // Pick the highest resolution stream (prefer 720p > 480p > 360p)
  const preferred = streams.find(s => s.resolution === '720p')
    || streams.find(s => s.resolution === '480p')
    || streams[0];

  // Build server qualities from stream groups
  const qualityMap = new Map<string, SankaServerItem[]>();
  for (const s of streams) {
    const q = s.resolution || 'Default';
    if (!qualityMap.has(q)) qualityMap.set(q, []);
    const serverId = `${s.data.post}|${s.data.nume}|${s.data.type}`;
    qualityMap.get(q)!.push({
      title: `${s.server} (${s.resolution})`,
      serverId,
      href: '',
    });
  }

  const qualities: SankaQualityGroup[] = Array.from(qualityMap.entries()).map(([title, serverList]) => ({
    title,
    serverList,
  }));

  // Resolve the preferred stream immediately for defaultStreamingUrl
  let defaultUrl = '';
  if (preferred) {
    try {
      const serverRes = await fetch(
        `${SANKA_API_URL}/winbu/server?post=${preferred.data.post}&nume=${preferred.data.nume}&type=${preferred.data.type}`
      );
      if (serverRes.ok) {
        const serverJson = await serverRes.json();
        if (serverJson.status === 'success') {
          defaultUrl = serverJson.embed_url || '';
        }
      }
    } catch { /* fallback to server selection */ }
  }

  return {
    title: data.title || episodeId,
    defaultStreamingUrl: defaultUrl,
    server: { qualities },
    hasPrevEpisode: !!(nav.prev?.id && nav.prev.id !== '#'),
    prevEpisode: nav.prev?.id && nav.prev.id !== '#' ? { episodeId: nav.prev.id } : null,
    hasNextEpisode: !!(nav.next?.id && nav.next.id !== '#'),
    nextEpisode: nav.next?.id && nav.next.id !== '#' ? { episodeId: nav.next.id } : null,
  };
}

async function winbuServer(serverId: string): Promise<string> {
  const [post, nume, type] = serverId.split('|');
  if (!post || !nume || !type) throw new Error('Invalid Winbu server ID');
  const res = await fetch(`${SANKA_API_URL}/winbu/server?post=${post}&nume=${nume}&type=${type}`);
  if (!res.ok) throw new Error('Winbu server failed');
  const json = await res.json();
  if (json.status !== 'success') throw new Error('Winbu server error');
  return json.embed_url || '';
}

// ═══════════════════════════════════════
// PROVIDER REGISTRY (ordered by priority)
// ═══════════════════════════════════════

export const PROVIDERS_CONFIG: ProviderConfig[] = [
  {
    key: "samehadaku",
    name: "Samehadaku",
    emoji: "🌸",
    color: "#a855f7",
    searchFn: samehadakuSearch,
    detailFn: samehadakuDetail,
    episodeFn: samehadakuEpisode,
    serverFn: samehadakuServer,
  },
  {
    key: "stream",
    name: "Stream Indo",
    emoji: "🎬",
    color: "#3b82f6",
    searchFn: streamSearch,
    detailFn: streamDetail,
    episodeFn: streamEpisode,
  },
  {
    key: "otakudesu",
    name: "Otakudesu",
    emoji: "📺",
    color: "#ec4899",
    searchFn: otakudesuSearch,
    detailFn: otakudesuDetail,
    episodeFn: otakudesuEpisode,
    serverFn: otakudesuServer,
  },
  {
    key: "oploverz",
    name: "Oploverz",
    emoji: "🎬",
    color: "#f97316",
    searchFn: oploverzSearch,
    detailFn: oploverzDetail,
    episodeFn: oploverzEpisode,
  },
  {
    key: "winbu",
    name: "Winbu",
    emoji: "🌐",
    color: "#06b6d4",
    searchFn: winbuSearch,
    detailFn: winbuDetail,
    episodeFn: winbuEpisode,
    serverFn: winbuServer,
  },
];

// ═══════════════════════════════════════
// MULTI-PROVIDER SEARCH + FALLBACK
// ═══════════════════════════════════════

export interface MultiProviderResult {
  provider: ProviderConfig;
  searchResults: SankaSearchItem[];
  firstMatch: SankaSearchItem;
  animeDetail: SankaAnimeDetail;
}

/**
 * Try each provider in order until one returns both search results AND valid episode details.
 * Uses title similarity to pick the best match (not just results[0]).
 * Falls back to English title if romaji fails.
 */
export async function getAnimeDataWithFallback(
  keyword: string,
  altKeyword?: string
): Promise<MultiProviderResult | null> {
  // Try with both romaji and english titles
  const keywords = [keyword];
  if (altKeyword && altKeyword !== keyword) keywords.push(altKeyword);

  for (const provider of PROVIDERS_CONFIG) {
    for (const kw of keywords) {
      try {
        const results = await provider.searchFn(kw);
        if (!results || results.length === 0) continue;

        // Use title similarity to find the best matching result
        const bestMatch = findBestMatch(results, keyword, altKeyword);
        if (!bestMatch || !bestMatch.animeId) continue;

        // Verify the detail endpoint actually works for this match
        const animeDetail = await provider.detailFn(bestMatch.animeId);

        if (animeDetail && animeDetail.episodeList && animeDetail.episodeList.length > 0) {
          console.log(
            `[AniVerse] ✅ ${provider.name} matched "${bestMatch.title}" (keyword: "${kw}", similarity: ${titleSimilarity(bestMatch.title, kw).toFixed(2)})`
          );
          return {
            provider,
            searchResults: results,
            firstMatch: bestMatch,
            animeDetail,
          };
        }
      } catch (err) {
        console.warn(`[AniVerse] Provider ${provider.name} failed for "${kw}":`, err);
        continue;
      }
    }
  }
  return null; // All providers failed
}

/**
 * Search only ONE specific provider (for manual provider selection).
 * Unlike getAnimeDataWithFallback, this does NOT fall back to other providers.
 * Returns all search results so the UI can let the user pick the correct match.
 */
export async function getAnimeDataFromProvider(
  providerKey: ProviderKey,
  keyword: string,
  altKeyword?: string
): Promise<(MultiProviderResult & { allSearchResults: SankaSearchItem[] }) | null> {
  const provider = PROVIDERS_CONFIG.find(p => p.key === providerKey);
  if (!provider) return null;

  const keywords = [keyword, ...(altKeyword && altKeyword !== keyword ? [altKeyword] : [])];

  for (const kw of keywords) {
    try {
      const results = await provider.searchFn(kw);
      if (!results || results.length === 0) continue;

      // Find best auto-match, but fall back to first result if below threshold
      const bestMatch = findBestMatch(results, keyword, altKeyword) || results[0];
      if (!bestMatch?.animeId) continue;

      const animeDetail = await provider.detailFn(bestMatch.animeId);
      if (animeDetail?.episodeList?.length > 0) {
        return {
          provider,
          searchResults: results,
          allSearchResults: results,
          firstMatch: bestMatch,
          animeDetail,
        };
      }
    } catch (err) {
      console.warn(`[AniVerse] Provider ${provider.name} failed for "${kw}":`, err);
    }
  }
  return null;
}

/**
 * Load detail for a manually-selected anime from a specific provider.
 */
export async function loadAnimeDetailFromProvider(
  providerKey: ProviderKey,
  animeId: string
): Promise<SankaAnimeDetail | null> {
  const provider = PROVIDERS_CONFIG.find(p => p.key === providerKey);
  if (!provider) return null;
  try {
    const detail = await provider.detailFn(animeId);
    return detail?.episodeList?.length > 0 ? detail : null;
  } catch {
    return null;
  }
}


// ═══════════════════════════════════════
// RE-EXPORTS for backward compatibility
// ═══════════════════════════════════════

export const searchSankaAnime = samehadakuSearch;
export const getSankaAnimeDetail = samehadakuDetail;
export const getSankaEpisodeDetail = samehadakuEpisode;
export const getSankaEmbedUrl = samehadakuServer;
