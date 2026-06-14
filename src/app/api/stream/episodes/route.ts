import { NextResponse } from "next/server";
import * as cheerio from "cheerio";

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
};

export const revalidate = 1800;

interface Episode {
  number: string;
  title: string;
  url: string;
  date?: string;
}

// ══════════════════════════════════════════════
// Episode Parsers per-provider
// ══════════════════════════════════════════════

function parseSamehadakuEpisodes($: cheerio.CheerioAPI): Episode[] {
  const episodes: Episode[] = [];

  // .lstepsiode ul li
  $(".lstepsiode ul li, .episodelist ul li").each((_i: number, el: any) => {
    const link = $(el).find("a").first();
    const href = link.attr("href") ?? "";
    const epNum = $(el).find(".eps, .epl-num").text().trim();
    const epTitle = $(el).find(".epst, .epl-title, span.titles a").text().trim() || link.text().trim();
    const epDate = $(el).find(".date, .epl-date").text().trim();

    if (href) {
      episodes.push({
        number: epNum || `${_i + 1}`,
        title: epTitle || `Episode ${_i + 1}`,
        url: href,
        date: epDate || undefined,
      });
    }
  });

  // Fallback: tabel episode
  if (episodes.length === 0) {
    $("table tbody tr, .eplister ul li").each((_i: number, el: any) => {
      const link = $(el).find("a").first();
      const href = link.attr("href") ?? "";
      const tds = $(el).find("td");
      const epNum = tds.eq(0).text().trim() || `${_i + 1}`;
      const epTitle = tds.eq(1).text().trim() || link.text().trim();
      const epDate = tds.eq(2).text().trim();

      if (href) {
        episodes.push({
          number: epNum,
          title: epTitle || `Episode ${epNum}`,
          url: href,
          date: epDate || undefined,
        });
      }
    });
  }

  return episodes;
}

function parseAnoboyEpisodes($: cheerio.CheerioAPI): Episode[] {
  const episodes: Episode[] = [];

  // Anoboy often lists episodes as articles or in various formats
  $("article, .post, .episodelist li, .column-content a").each((_i: number, el: any) => {
    const link = $(el).is("a") ? $(el) : $(el).find("a").first();
    const href = link.attr("href") ?? "";
    const title = link.attr("title") ?? link.text().trim() ?? $(el).find("h2, .title").text().trim();

    // Filter: hanya yang mengandung "episode" di judul/url
    if (href && title && (title.toLowerCase().includes("episode") || href.includes("episode"))) {
      const epMatch = title.match(/episode\s*(\d+)/i) || href.match(/episode-(\d+)/i);
      episodes.push({
        number: epMatch ? epMatch[1] : `${_i + 1}`,
        title: title,
        url: href,
      });
    }
  });

  return episodes;
}

function parseOtakudesuEpisodes($: cheerio.CheerioAPI): Episode[] {
  const episodes: Episode[] = [];

  // Otakudesu structure: .episodelist ul li
  $(".episodelist ul li, .epslister ul li").each((_i: number, el: any) => {
    const link = $(el).find("a").first();
    const href = link.attr("href") ?? "";
    const epTitle = link.text().trim();
    const epDate = $(el).find(".zemark, span:last-child").text().trim();

    if (href) {
      const epMatch = epTitle.match(/episode\s*(\d+)/i) || href.match(/episode-(\d+)/i);
      episodes.push({
        number: epMatch ? epMatch[1] : `${_i + 1}`,
        title: epTitle || `Episode ${_i + 1}`,
        url: href,
        date: epDate || undefined,
      });
    }
  });

  return episodes;
}

const EPISODE_PARSERS: Record<string, (c: cheerio.CheerioAPI) => Episode[]> = {
  samehadaku: parseSamehadakuEpisodes,
  anoboy: parseAnoboyEpisodes,
  otakudesu: parseOtakudesuEpisodes,
};

// ══════════════════════════════════════════════
// API Handler
// ══════════════════════════════════════════════

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const animeUrl = searchParams.get("url");
  const providerId = searchParams.get("provider") ?? "samehadaku";

  if (!animeUrl) {
    return NextResponse.json({ error: "Parameter 'url' diperlukan" }, { status: 400 });
  }

  try {
    const res = await fetch(animeUrl, {
      headers: { ...HEADERS, Referer: new URL(animeUrl).origin },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Gagal mengakses halaman: ${res.status}` },
        { status: 502 }
      );
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // Info anime
    const title = $(".infoanime .entry-title, .spe h1, h1.entry-title, h1").first().text().trim();
    const thumbnail = $(".infoanime img, .thumb img, img.anmsa").first().attr("src") ?? "";

    // Parse episodes
    const parser = EPISODE_PARSERS[providerId] ?? parseSamehadakuEpisodes;
    const episodes = parser($);

    return NextResponse.json({
      title,
      thumbnail: thumbnail || undefined,
      provider: providerId,
      episodes,
      total: episodes.length,
    });
  } catch (error) {
    console.error(`[Stream Episodes] ${providerId} error:`, error);
    return NextResponse.json(
      { error: "Gagal mengambil daftar episode", message: String(error) },
      { status: 500 }
    );
  }
}
