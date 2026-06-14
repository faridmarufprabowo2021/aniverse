import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

const NAID_BASE = "https://s12.nontonanimeid.boats";

const HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  "Sec-Ch-Ua":
    '"Chromium";v="126", "Google Chrome";v="126", "Not-A.Brand";v="8"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "same-origin",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
  Connection: "keep-alive",
};

export const revalidate = 3600;

// ══════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════

function cleanTitle(title: string): string {
  return title
    .replace(/[?!:;,.\-–—()[\]{}"""'']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function shortenTitle(title: string, maxWords = 3): string {
  return title.split(" ").slice(0, maxWords).join(" ");
}

async function fetchPage(
  url: string,
  referer?: string,
  retries = 1
): Promise<string | null> {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 12000);
      const origin = new URL(url).origin;

      const res = await fetch(url, {
        headers: {
          ...HEADERS,
          Referer: referer || origin + "/",
        },
        signal: controller.signal,
        redirect: "follow",
      });

      clearTimeout(timeout);

      if (res.ok) {
        return await res.text();
      }

      console.log(`[NAID] ${url} → ${res.status}`);
      if (i < retries) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    } catch (err) {
      console.log(`[NAID] Fetch error (try ${i + 1}):`, String(err));
      if (i < retries) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
  }
  return null;
}

/**
 * Follow redirects to get final URL (for /go/dl/ → m3u8)
 */
async function getRedirectUrl(url: string, referer: string): Promise<string | null> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(url, {
      headers: {
        ...HEADERS,
        Referer: referer,
      },
      redirect: "manual", // Don't follow redirects
      signal: controller.signal,
    });

    clearTimeout(timeout);

    // Check for 301/302 redirect
    const location = res.headers.get("location");
    if (location) {
      return location;
    }

    // If it responded 200, URL is the final URL
    if (res.ok) {
      return url;
    }

    return null;
  } catch {
    return null;
  }
}

// ══════════════════════════════════════════════
// Types
// ══════════════════════════════════════════════

interface SearchResult {
  title: string;
  url: string;
  thumbnail?: string;
}

// ══════════════════════════════════════════════
// SEARCH — a.as-anime-card
// ══════════════════════════════════════════════

function parseSearchResults(html: string): SearchResult[] {
  const $ = cheerio.load(html);
  const results: SearchResult[] = [];

  $("a.as-anime-card").each((_i: number, el: any) => {
    const href = $(el).attr("href") ?? "";
    const title = $(el).find("h3").text().trim();
    const thumb =
      $(el).find("img").attr("src") ??
      $(el).find("img").attr("data-src") ??
      "";

    if (href && title) {
      results.push({ title, url: href, thumbnail: thumb || undefined });
    }
  });

  // Fallback
  if (results.length === 0) {
    $(".animpost, .bsx, article.post").each((_i: number, el: any) => {
      const link = $(el).find("a").first();
      const href = link.attr("href") ?? "";
      const title =
        link.attr("title") ||
        $(el).find("h2, h3, .title").text().trim();
      const thumb = $(el).find("img").attr("src") ?? "";

      if (href && title) {
        results.push({ title, url: href, thumbnail: thumb || undefined });
      }
    });
  }

  return results;
}

// ══════════════════════════════════════════════
// EPISODES — a.episode-item
// ══════════════════════════════════════════════

function parseEpisodes(html: string) {
  const $ = cheerio.load(html);

  const title = $("h1, .entry-title").first().text().trim();
  const thumbnail =
    $("img.attachment-post-thumbnail, .as-card-img img, .thumb img")
      .first()
      .attr("src") ?? "";

  const episodes: {
    number: string;
    title: string;
    url: string;
    date?: string;
  }[] = [];

  // Primary: a.episode-item
  $("a.episode-item").each((_i: number, el: any) => {
    const href = $(el).attr("href") ?? "";
    const spans = $(el).find("span");
    const epTitle = spans.first().text().trim();
    const epDate = spans.length > 1 ? spans.last().text().trim() : undefined;
    const epMatch =
      epTitle.match(/episode\s*(\d+)/i) || href.match(/episode-(\d+)/i);

    if (href) {
      episodes.push({
        number: epMatch ? epMatch[1] : `${_i + 1}`,
        title: epTitle || `Episode ${_i + 1}`,
        url: href,
        date: epDate,
      });
    }
  });

  // Fallback
  if (episodes.length === 0) {
    $("a").each((_i: number, el: any) => {
      const href = $(el).attr("href") ?? "";
      const text = $(el).text().trim();
      if (href.includes("episode") && href.includes("sub-indo")) {
        const epMatch =
          href.match(/episode-(\d+)/i) || text.match(/episode\s*(\d+)/i);
        if (epMatch) {
          episodes.push({
            number: epMatch[1],
            title: text || `Episode ${epMatch[1]}`,
            url: href,
          });
        }
      }
    });
  }

  // Deduplicate
  const unique = episodes.filter(
    (ep, i, arr) => arr.findIndex((e) => e.url === ep.url) === i
  );

  return { title, thumbnail, episodes: unique };
}

// ══════════════════════════════════════════════
// VIDEO — Extract m3u8 from embed → JWPlayer
// ══════════════════════════════════════════════

async function extractVideo(html: string, episodeUrl: string) {
  const $ = cheerio.load(html);
  const streams: string[] = [];
  const embedUrls: string[] = [];

  // 1. Cari semua iframe dan script src yang mengarah ke embed player
  $("iframe").each((_i: number, el: any) => {
    const src = $(el).attr("src") ?? $(el).attr("data-src") ?? "";
    if (src && !src.includes("google") && !src.includes("facebook") && !src.includes("disqus")) {
      const fullSrc = src.startsWith("//") ? `https:${src}` : src;
      embedUrls.push(fullSrc);
    }
  });

  // Cari di <script> tags juga
  $("script").each((_i: number, el: any) => {
    const scriptContent = $(el).html() ?? "";
    // Cari URL video-embed
    const embedMatches = scriptContent.match(
      /https?:\/\/[^\s"'\\]*kotakanimeid[^\s"'\\]*video-embed[^\s"'\\]*/g
    );
    if (embedMatches) embedUrls.push(...embedMatches);

    // Cari m3u8 langsung di halaman episode
    const m3u8 = scriptContent.match(
      /https?:\/\/[^\s"'\\]+\.m3u8[^\s"'\\]*/g
    );
    if (m3u8) streams.push(...m3u8);

    // Cari mp4 langsung
    const mp4 = scriptContent.match(
      /https?:\/\/[^\s"'\\]*(?:googlevideo|blogger|cdn)[^\s"'\\]*\.mp4[^\s"'\\]*/g
    );
    if (mp4) streams.push(...mp4);
  });

  console.log(`[NAID Video] Found ${embedUrls.length} embed URLs, ${streams.length} direct streams in page`);

  // 2. Untuk setiap embed URL, fetch HTML-nya dan ekstrak JWPlayer file URL
  for (const embedUrl of [...new Set(embedUrls)].slice(0, 3)) {
    try {
      console.log(`[NAID Video] Fetching embed: ${embedUrl}`);
      const embedHtml = await fetchPage(embedUrl, episodeUrl, 1);
      if (!embedHtml) continue;

      // Cari JWPlayer file: "url" pattern
      const fileMatches = embedHtml.match(
        /file\s*:\s*["']([^"']+)["']/g
      );
      if (fileMatches) {
        for (const f of fileMatches) {
          const urlMatch = f.match(/["']([^"']+)["']/);
          if (urlMatch && urlMatch[1]) {
            const fileUrl = urlMatch[1];
            console.log(`[NAID Video] Found JWPlayer file: ${fileUrl}`);

            // Jika URL adalah /go/dl/ redirect, follow-nya
            if (fileUrl.includes("/go/dl/") || fileUrl.includes("?url=")) {
              const finalUrl = await getRedirectUrl(fileUrl, embedUrl);
              if (finalUrl) {
                console.log(`[NAID Video] Redirect resolved: ${finalUrl}`);
                streams.push(finalUrl);
              }
            } else if (
              fileUrl.includes(".m3u8") ||
              fileUrl.includes(".mp4")
            ) {
              streams.push(fileUrl);
            }
          }
        }
      }

      // Cari source/src di HTML
      const $embed = cheerio.load(embedHtml);
      $embed("source, video").each((_j: number, srcEl: any) => {
        const srcUrl = $embed(srcEl).attr("src") ?? "";
        if (srcUrl && (srcUrl.includes(".m3u8") || srcUrl.includes(".mp4"))) {
          streams.push(
            srcUrl.startsWith("//") ? `https:${srcUrl}` : srcUrl
          );
        }
      });

      // Cari m3u8 di seluruh HTML embed
      const m3u8InEmbed = embedHtml.match(
        /https?:\/\/[^\s"'\\]+\.m3u8[^\s"'\\]*/g
      );
      if (m3u8InEmbed) streams.push(...m3u8InEmbed);

      // CDN kotakanimeid pattern
      const cdnMatch = embedHtml.match(
        /https?:\/\/cdn[^\s"'\\]*kotakanimeid[^\s"'\\]*index\.m3u8[^\s"'\\]*/g
      );
      if (cdnMatch) streams.push(...cdnMatch);

      // Google Video / Blogger MP4
      const gvMatch = embedHtml.match(
        /https?:\/\/[^\s"'\\]*(?:googlevideo|blogger)[^\s"'\\]*(?:\.mp4|videoplayback)[^\s"'\\]*/g
      );
      if (gvMatch) streams.push(...gvMatch);
    } catch (err) {
      console.log(`[NAID Video] Embed fetch error:`, String(err));
    }
  }

  // Deduplicate & filter valid URLs
  const uniqueStreams = [...new Set(streams)]
    .filter((u) => u.length > 15)
    .filter((u) => u.startsWith("http"));

  console.log(`[NAID Video] Final streams: ${uniqueStreams.length}`);
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
    if (!query) {
      return NextResponse.json(
        { error: "Parameter 'q' diperlukan" },
        { status: 400 }
      );
    }

    try {
      const cleaned = cleanTitle(query);

      // Try full title
      let html = await fetchPage(
        `${NAID_BASE}/?s=${encodeURIComponent(cleaned)}`
      );
      if (html) {
        const results = parseSearchResults(html);
        if (results.length > 0) {
          return NextResponse.json({ results, total: results.length });
        }
      }

      // Try short title
      const short = shortenTitle(cleaned, 3);
      if (short !== cleaned) {
        html = await fetchPage(
          `${NAID_BASE}/?s=${encodeURIComponent(short)}`
        );
        if (html) {
          const results = parseSearchResults(html);
          if (results.length > 0) {
            return NextResponse.json({ results, total: results.length });
          }
        }
      }

      // Try 2 words
      const shorter = shortenTitle(cleaned, 2);
      if (shorter !== short) {
        html = await fetchPage(
          `${NAID_BASE}/?s=${encodeURIComponent(shorter)}`
        );
        if (html) {
          const results = parseSearchResults(html);
          if (results.length > 0) {
            return NextResponse.json({ results, total: results.length });
          }
        }
      }

      return NextResponse.json({ results: [], total: 0 });
    } catch (error) {
      console.error("[NAID Search]", error);
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }
  }

  // ─── EPISODES ──────────────────────────────
  if (action === "episodes") {
    const url = searchParams.get("url");
    if (!url) {
      return NextResponse.json(
        { error: "Parameter 'url' diperlukan" },
        { status: 400 }
      );
    }

    try {
      const html = await fetchPage(url, NAID_BASE, 2);
      if (!html) {
        return NextResponse.json(
          { error: "Gagal mengakses halaman anime" },
          { status: 502 }
        );
      }

      const { title, thumbnail, episodes } = parseEpisodes(html);
      console.log(`[NAID Episodes] ${title}: ${episodes.length} eps`);

      return NextResponse.json({
        title,
        thumbnail: thumbnail || undefined,
        episodes,
        total: episodes.length,
      });
    } catch (error) {
      console.error("[NAID Episodes]", error);
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }
  }

  // ─── VIDEO (extract m3u8) ──────────────────
  if (action === "video") {
    const url = searchParams.get("url");
    if (!url) {
      return NextResponse.json(
        { error: "Parameter 'url' diperlukan" },
        { status: 400 }
      );
    }

    try {
      const html = await fetchPage(url, NAID_BASE, 2);
      if (!html) {
        return NextResponse.json(
          { error: "Gagal mengakses episode" },
          { status: 502 }
        );
      }

      const { embedUrls, streams } = await extractVideo(html, url);

      return NextResponse.json({
        m3u8: streams,
        embeds: embedUrls,
        hasDirectStream: streams.length > 0,
      });
    } catch (error) {
      console.error("[NAID Video]", error);
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Action tidak valid" }, { status: 400 });
}
