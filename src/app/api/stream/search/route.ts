import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

// ══════════════════════════════════════════════
// Provider Config
// ══════════════════════════════════════════════

const PROVIDERS: Record<string, { base: string; searchPath: (q: string) => string }> = {
  samehadaku: {
    base: "https://samehadaku.io",
    searchPath: (q) => `/?s=${encodeURIComponent(q)}`,
  },
  anoboy: {
    base: "https://anoboy.ch",
    searchPath: (q) => `/?s=${encodeURIComponent(q)}`,
  },
  otakudesu: {
    base: "https://otakudesu.cloud",
    searchPath: (q) => `/?s=${encodeURIComponent(q)}&post_type=anime`,
  },
};

// Header lengkap agar lolos Cloudflare
const HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  Accept:
    "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
  "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
  "Accept-Encoding": "gzip, deflate, br",
  "Cache-Control": "no-cache",
  Pragma: "no-cache",
  "Sec-Ch-Ua": '"Chromium";v="126", "Google Chrome";v="126", "Not-A.Brand";v="8"',
  "Sec-Ch-Ua-Mobile": "?0",
  "Sec-Ch-Ua-Platform": '"Windows"',
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Upgrade-Insecure-Requests": "1",
  Connection: "keep-alive",
};

export const revalidate = 3600;

// ══════════════════════════════════════════════
// Helpers
// ══════════════════════════════════════════════

function cleanTitle(title: string): string {
  return title.replace(/[?!:;,.\-–—()[\]{}"""'']/g, " ").replace(/\s+/g, " ").trim();
}

function shortenTitle(title: string, maxWords = 3): string {
  return title.split(" ").slice(0, maxWords).join(" ");
}

async function fetchWithRetry(url: string, retries = 1): Promise<Response | null> {
  for (let i = 0; i <= retries; i++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);
      const res = await fetch(url, {
        headers: { ...HEADERS, Referer: new URL(url).origin },
        signal: controller.signal,
        redirect: "follow",
      });
      clearTimeout(timeout);
      if (res.ok) return res;
      if ((res.status === 403 || res.status === 503) && i < retries) {
        await new Promise((r) => setTimeout(r, 1500));
        continue;
      }
      return res;
    } catch {
      if (i < retries) await new Promise((r) => setTimeout(r, 1500));
    }
  }
  return null;
}

// ══════════════════════════════════════════════
// Parsers per-provider
// ══════════════════════════════════════════════

interface SearchResult {
  title: string;
  url: string;
  thumbnail?: string;
  type?: string;
  status?: string;
}

function parseSamehadaku(html: string): SearchResult[] {
  const $ = cheerio.load(html);
  const results: SearchResult[] = [];

  $(".animposx").each((_i: number, el: any) => {
    const link = $(el).find("a").first();
    const href = link.attr("href") ?? "";
    const title = link.attr("title") ?? $(el).find(".title, .tt h2").text().trim();
    const thumb = $(el).find("img").attr("src") ?? $(el).find("img").attr("data-src") ?? "";
    const type = $(el).find(".type").text().trim();
    if (href && title) results.push({ title, url: href, thumbnail: thumb || undefined, type: type || undefined });
  });

  if (results.length === 0) {
    $("article.post, .bsx, .bs").each((_i: number, el: any) => {
      const link = $(el).find("a").first();
      const href = link.attr("href") ?? "";
      const title = link.attr("title") ?? $(el).find(".tt, h2").text().trim();
      const thumb = $(el).find("img").attr("src") ?? "";
      if (href && title) results.push({ title, url: href, thumbnail: thumb || undefined });
    });
  }

  return results;
}

function parseAnoboy(html: string): SearchResult[] {
  const $ = cheerio.load(html);
  const results: SearchResult[] = [];

  // Anoboy uses various structures: .column-content article, .post, etc.
  $("article, .post, .animpost, .column-content .post-blog").each((_i: number, el: any) => {
    const link = $(el).find("a").first();
    const href = link.attr("href") ?? "";
    const title = link.attr("title") ?? $(el).find("h2, .title, .entry-title").text().trim();
    const thumb = $(el).find("img").attr("src") ?? $(el).find("img").attr("data-src") ?? "";
    if (href && title && !title.includes("Navigasi")) {
      results.push({ title, url: href, thumbnail: thumb || undefined });
    }
  });

  return results;
}

function parseOtakudesu(html: string): SearchResult[] {
  const $ = cheerio.load(html);
  const results: SearchResult[] = [];

  // Otakudesu search: ul.chi_list li / .vemark li / .page li
  $("ul li, .detpost, .chilist li").each((_i: number, el: any) => {
    const link = $(el).find("a").first();
    const href = link.attr("href") ?? "";
    const title = link.text().trim() || (link.attr("title") ?? "");
    const thumb = $(el).find("img").attr("src") ?? "";
    if (href && title && href.includes("/anime/")) {
      results.push({ title, url: href, thumbnail: thumb || undefined });
    }
  });

  return results;
}

const PARSERS: Record<string, (html: string) => SearchResult[]> = {
  samehadaku: parseSamehadaku,
  anoboy: parseAnoboy,
  otakudesu: parseOtakudesu,
};

// ══════════════════════════════════════════════
// API Handler
// ══════════════════════════════════════════════

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const providerId = searchParams.get("provider") ?? "samehadaku";

  if (!query) {
    return NextResponse.json({ error: "Parameter 'q' diperlukan" }, { status: 400 });
  }

  const provider = PROVIDERS[providerId];
  if (!provider) {
    return NextResponse.json({ error: "Provider tidak valid" }, { status: 400 });
  }

  const parser = PARSERS[providerId] ?? parseSamehadaku;

  try {
    const cleaned = cleanTitle(query);

    // ─── Attempt 1: Judul lengkap ──────────────
    const url1 = `${provider.base}${provider.searchPath(cleaned)}`;
    console.log(`[Stream Search] ${providerId}: ${url1}`);

    let res = await fetchWithRetry(url1);
    if (res?.ok) {
      const html = await res.text();
      const results = parser(html);
      if (results.length > 0) {
        return NextResponse.json({ query, provider: providerId, results, total: results.length });
      }
    }

    // ─── Attempt 2: Judul pendek ───────────────
    const short = shortenTitle(cleaned, 3);
    if (short !== cleaned) {
      const url2 = `${provider.base}${provider.searchPath(short)}`;
      console.log(`[Stream Search] ${providerId} (short): ${url2}`);

      res = await fetchWithRetry(url2);
      if (res?.ok) {
        const html = await res.text();
        const results = parser(html);
        if (results.length > 0) {
          return NextResponse.json({ query, provider: providerId, results, total: results.length, note: "short" });
        }
      }
    }

    // ─── Tidak ditemukan ────────────────────────
    return NextResponse.json({ query, provider: providerId, results: [], total: 0 });
  } catch (error) {
    console.error(`[Stream Search] ${providerId} error:`, error);
    return NextResponse.json(
      { error: "Gagal mencari anime", provider: providerId, message: String(error) },
      { status: 500 }
    );
  }
}
