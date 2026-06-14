import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

// ══════════════════════════════════════════════
// Otakudesu API with Proxy Support
// Uses CORS proxy to bypass Cloudflare on Vercel
// ══════════════════════════════════════════════

const OTAKUDESU_BASE = "https://otakudesu.cloud";

// CORS proxy services to route requests through
// This bypasses Cloudflare blocking of Vercel's IP ranges
const PROXY_SERVICES = [
  // Format: proxy prefix + target URL
  { prefix: "https://api.allorigins.win/raw?url=", encode: true },
  { prefix: "https://corsproxy.io/?", encode: true },
  { prefix: "https://api.codetabs.com/v1/proxy?quest=", encode: true },
];

// Rotate User-Agent to appear as regular browser
const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
];

function getRandomUA(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

export const dynamic = "force-dynamic";
export const maxDuration = 30;

// Simple in-memory cache (survives within same serverless invocation)
const cache = new Map<string, { data: any; time: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key: string): any | null {
  const entry = cache.get(key);
  if (entry && Date.now() - entry.time < CACHE_TTL) {
    return entry.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: any): void {
  cache.set(key, { data, time: Date.now() });
}

// ══════════════════════════════════════════════
// Fetch with proxy fallback
// ══════════════════════════════════════════════

async function fetchPage(url: string): Promise<string | null> {
  // Strategy 1: Direct fetch (works locally, sometimes on Vercel)
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      headers: {
        "User-Agent": getRandomUA(),
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "id-ID,id;q=0.9,en;q=0.8",
        "Cache-Control": "no-cache",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeout);

    if (res.ok) {
      const html = await res.text();
      // Check if it's real content (not a Cloudflare challenge page)
      if (html.length > 1000 && !html.includes("cf-browser-verification") && !html.includes("challenge-platform")) {
        console.log(`[Otakudesu] Direct fetch OK for ${url}`);
        return html;
      }
    }
    console.log(`[Otakudesu] Direct fetch failed: ${res.status}`);
  } catch (err) {
    console.log(`[Otakudesu] Direct fetch error:`, String(err).slice(0, 80));
  }

  // Strategy 2: Try through proxy services
  for (const proxy of PROXY_SERVICES) {
    try {
      const proxyUrl = proxy.encode
        ? `${proxy.prefix}${encodeURIComponent(url)}`
        : `${proxy.prefix}${url}`;

      console.log(`[Otakudesu] Trying proxy: ${proxy.prefix.split('/')[2]}`);

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);

      const res = await fetch(proxyUrl, {
        headers: {
          "User-Agent": getRandomUA(),
          Accept: "text/html,*/*",
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (res.ok) {
        const html = await res.text();
        if (html.length > 1000) {
          console.log(`[Otakudesu] Proxy fetch OK via ${proxy.prefix.split('/')[2]}`);
          return html;
        }
      }
    } catch (err) {
      console.log(`[Otakudesu] Proxy error:`, String(err).slice(0, 60));
    }
  }

  return null;
}

// ══════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════

function cleanTitle(title: string): string {
  return title
    .replace(/[?!:;,.\-–—()\[\]{}"'""'']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function shortenTitle(title: string, maxWords = 3): string {
  return title.split(" ").slice(0, maxWords).join(" ");
}

// ══════════════════════════════════════════════
// Parsers
// ══════════════════════════════════════════════

interface SearchResult {
  title: string;
  url: string;
  thumbnail?: string;
}

function parseSearchResults(html: string): SearchResult[] {
  const $ = cheerio.load(html);
  const results: SearchResult[] = [];

  // Primary selector
  $("ul.chivsrc li").each((_i: number, el: any) => {
    const link = $(el).find("h2 a");
    const href = link.attr("href") ?? "";
    const title = link.text().trim();
    const thumb = $(el).find("img").attr("src") ?? "";
    if (href && title) {
      results.push({ title, url: href, thumbnail: thumb || undefined });
    }
  });

  // Fallback selectors
  if (results.length === 0) {
    $(".venz ul li, .detpost, article").each((_i: number, el: any) => {
      const link = $(el).find("a").first();
      const href = link.attr("href") ?? "";
      const title = link.attr("title") || $(el).find("h2, .title").text().trim();
      const thumb = $(el).find("img").attr("src") || $(el).find("img").attr("data-src") || "";
      if (href && title && !results.some((r) => r.url === href)) {
        results.push({ title, url: href, thumbnail: thumb || undefined });
      }
    });
  }

  return results;
}

function parseEpisodes(html: string) {
  const $ = cheerio.load(html);
  const title =
    $(".jdlrx h1, .infozingle p:first-child span").text().replace("Judul: ", "").trim() ||
    $("h1").text().trim();
  const thumbnail = $(".fotoanime img").attr("src") ?? "";

  const episodes: { number: string; title: string; url: string; date?: string }[] = [];

  $(".episodelist ul li").each((_i: number, el: any) => {
    const link = $(el).find("a");
    const href = link.attr("href") ?? "";
    const epTitle = link.text().trim();
    const epDate = $(el).find(".zeebr").text().trim();
    const epMatch = epTitle.match(/Episode\s*(\d+)/i) || href.match(/episode-(\d+)/i);

    if (href && epTitle) {
      episodes.push({
        number: epMatch ? epMatch[1] : `${_i + 1}`,
        title: epTitle,
        url: href,
        date: epDate,
      });
    }
  });

  return { title, thumbnail, episodes: episodes.reverse() };
}

async function extractVideo(html: string, episodeUrl: string) {
  const $ = cheerio.load(html);
  const streams: string[] = [];
  const embedUrls: string[] = [];

  // Get iframes
  $("iframe").each((_i: number, el: any) => {
    const src = $(el).attr("src") ?? "";
    if (src && !src.includes("youtube") && !src.includes("recaptcha")) {
      embedUrls.push(src.startsWith("//") ? "https:" + src : src);
    }
  });

  // Look for stream URLs in scripts
  $("script").each((_i: number, el: any) => {
    const content = $(el).html() ?? "";
    try {
      const decoded = Buffer.from(content, "base64").toString("utf8");
      const matches = (content + decoded).match(
        /https?:\/\/[^\s"'\\]*(?:desustream|blogger|kotakanimeid|playdesu|desudrive|gofile)[^\s"'\\]*/g
      );
      if (matches) matches.forEach((m) => embedUrls.push(m));
    } catch {}

    const directMatches = content.match(
      /https?:\/\/[^\s"'\\]*(?:\.m3u8|\.mp4|video\.g|blogger\.com\/video)[^\s"'\\]*/g
    );
    if (directMatches) streams.push(...directMatches);
  });

  // Fetch embed pages to extract actual video sources
  for (const embed of [...new Set(embedUrls)].slice(0, 3)) {
    try {
      const embedHtml = await fetchPage(embed);
      if (!embedHtml) continue;

      const $e = cheerio.load(embedHtml);
      $e("source").each((_i, el) => {
        const src = $e(el).attr("src") ?? "";
        if (src) streams.push(src);
      });

      const fileMatches = embedHtml.match(/file\s*:\s*["']([^"']+)["']/g);
      if (fileMatches) {
        for (const f of fileMatches) {
          const urlMatch = f.match(/["']([^"']+)["']/);
          if (urlMatch?.[1]) streams.push(urlMatch[1]);
        }
      }

      const urlMatches = embedHtml.match(
        /https?:\/\/[^\s"'\\]*(?:\.m3u8|\.mp4|video\.g|blogger\.com\/video)[^\s"'\\]*/g
      );
      if (urlMatches) streams.push(...urlMatches);
    } catch {}
  }

  const uniqueStreams = [...new Set(streams)]
    .map((s) => s.replace(/&amp;/g, "&"))
    .filter((s) => s.startsWith("http") && s.length > 20);

  return { embedUrls: [...new Set(embedUrls)], streams: uniqueStreams };
}

// ══════════════════════════════════════════════
// API Handler
// ══════════════════════════════════════════════

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") ?? "search";

  // ─── SEARCH ────────────────────────────────
  if (action === "search") {
    const query = searchParams.get("q");
    if (!query) return NextResponse.json({ error: "Parameter 'q' diperlukan" }, { status: 400 });

    const cacheKey = `search:${query}`;
    const cached = getCached(cacheKey);
    if (cached) {
      return NextResponse.json({ ...cached, cached: true });
    }

    try {
      const cleaned = cleanTitle(query);

      // Try with 3-word shortened title first
      const short = shortenTitle(cleaned, 3);
      const searchUrl = `${OTAKUDESU_BASE}/?s=${encodeURIComponent(short)}&post_type=anime`;
      
      let html = await fetchPage(searchUrl);
      if (html) {
        const results = parseSearchResults(html);
        if (results.length > 0) {
          const response = { results, total: results.length };
          setCache(cacheKey, response);
          return NextResponse.json(response);
        }
      }

      // Try with 2-word title
      const shorter = shortenTitle(cleaned, 2);
      if (shorter !== short) {
        const searchUrl2 = `${OTAKUDESU_BASE}/?s=${encodeURIComponent(shorter)}&post_type=anime`;
        html = await fetchPage(searchUrl2);
        if (html) {
          const results = parseSearchResults(html);
          if (results.length > 0) {
            const response = { results, total: results.length };
            setCache(cacheKey, response);
            return NextResponse.json(response);
          }
        }
      }

      return NextResponse.json({ results: [], total: 0 });
    } catch (error) {
      console.error("[Otakudesu Search]", error);
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }
  }

  // ─── EPISODES ──────────────────────────────
  if (action === "episodes") {
    const url = searchParams.get("url");
    if (!url) return NextResponse.json({ error: "Parameter 'url' diperlukan" }, { status: 400 });

    const cacheKey = `episodes:${url}`;
    const cached = getCached(cacheKey);
    if (cached) return NextResponse.json({ ...cached, cached: true });

    try {
      const html = await fetchPage(url);
      if (!html) {
        return NextResponse.json({
          error: "Gagal mengakses halaman. Server sedang memblokir koneksi cloud.",
          suggestion: "Coba lagi atau tonton langsung di sumber.",
        }, { status: 502 });
      }

      const data = parseEpisodes(html);
      setCache(cacheKey, data);
      return NextResponse.json({
        ...data,
        thumbnail: data.thumbnail || undefined,
        total: data.episodes.length,
      });
    } catch (error) {
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }
  }

  // ─── VIDEO ─────────────────────────────────
  if (action === "video") {
    const url = searchParams.get("url");
    if (!url) return NextResponse.json({ error: "Parameter 'url' diperlukan" }, { status: 400 });

    try {
      const html = await fetchPage(url);
      if (!html) {
        return NextResponse.json({
          error: "Gagal mengakses episode",
          suggestion: "Server sumber sedang memblokir. Coba buka langsung.",
        }, { status: 502 });
      }

      const { embedUrls, streams } = await extractVideo(html, url);
      return NextResponse.json({
        m3u8: streams,
        embeds: embedUrls,
        hasDirectStream: streams.length > 0,
      });
    } catch (error) {
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Action tidak valid" }, { status: 400 });
}
