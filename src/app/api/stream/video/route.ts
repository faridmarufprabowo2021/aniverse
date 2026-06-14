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
  Referer: "https://samehadaku.io",
};

export const revalidate = 600; // cache 10 menit

/**
 * GET /api/stream/video?url=https://samehadaku.io/episode/xxx/
 * Mengambil embed URL video dari halaman episode Samehadaku.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const episodeUrl = searchParams.get("url");

  if (!episodeUrl) {
    return NextResponse.json(
      { error: "Parameter 'url' diperlukan" },
      { status: 400 }
    );
  }

  try {
    const res = await fetch(episodeUrl, { headers: HEADERS });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Gagal mengakses halaman episode: ${res.status}` },
        { status: 502 }
      );
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    // ─── Cari embed iframe ──────────────────────
    const servers: { name: string; embedUrl: string }[] = [];

    // 1. Coba langsung dari iframe di .player-embed / #player_embed
    const mainIframe = $(".player-embed iframe, #player_embed iframe, .video-content iframe, #pembed iframe").first();
    if (mainIframe.length) {
      const src = mainIframe.attr("src") ?? mainIframe.attr("data-src") ?? "";
      if (src) {
        servers.push({ name: "Server Utama", embedUrl: src.startsWith("//") ? `https:${src}` : src });
      }
    }

    // 2. Cari dari select.mirror options (multi-server)
    $("select.mirror option, .mirror option, #change_srv option").each((_i, el) => {
      const val = $(el).attr("value") ?? "";
      const name = $(el).text().trim();
      // value kadang berisi base64 atau URL langsung
      if (val && val.startsWith("http")) {
        servers.push({ name: name || `Server ${_i + 1}`, embedUrl: val });
      } else if (val) {
        // Coba decode base64
        try {
          const decoded = Buffer.from(val, "base64").toString("utf-8");
          const $decoded = cheerio.load(decoded);
          const iframeSrc = $decoded("iframe").attr("src") ?? "";
          if (iframeSrc) {
            servers.push({
              name: name || `Server ${_i + 1}`,
              embedUrl: iframeSrc.startsWith("//") ? `https:${iframeSrc}` : iframeSrc,
            });
          }
        } catch {
          // bukan base64, skip
        }
      }
    });

    // 3. Fallback: cari semua iframe di halaman
    if (servers.length === 0) {
      $("iframe").each((_i, el) => {
        const src = $(el).attr("src") ?? $(el).attr("data-src") ?? "";
        if (src && !src.includes("googleads") && !src.includes("facebook") && !src.includes("disqus")) {
          servers.push({
            name: `Server ${_i + 1}`,
            embedUrl: src.startsWith("//") ? `https:${src}` : src,
          });
        }
      });
    }

    // ─── Info episode ───────────────────────────
    const episodeTitle = $("h1.entry-title, .epst, h1").first().text().trim();

    // ─── Download links ─────────────────────────
    const downloads: { quality: string; links: { name: string; url: string }[] }[] = [];

    $(".download-eps li, .mctnx .soraddl .soradlg").each((_i, el) => {
      const quality = $(el).find("strong, .sorattls h3").text().trim();
      const links: { name: string; url: string }[] = [];
      $(el).find("a").each((_j, a) => {
        const href = $(a).attr("href") ?? "";
        const name = $(a).text().trim();
        if (href && name) {
          links.push({ name, url: href });
        }
      });
      if (quality && links.length > 0) {
        downloads.push({ quality, links });
      }
    });

    return NextResponse.json({
      title: episodeTitle,
      servers,
      downloads,
      serverCount: servers.length,
    });
  } catch (error) {
    console.error("Stream video error:", error);
    return NextResponse.json(
      { error: "Gagal mengambil video", message: String(error) },
      { status: 500 }
    );
  }
}
