import { NextResponse } from "next/server";

// ══════════════════════════════════════════════
// Consumet API Provider
// Uses public Consumet instances (or self-hosted)
// No Cloudflare blocking — pure REST JSON API
// ══════════════════════════════════════════════

// Multiple Consumet API instances to try (public + mirrors)
const CONSUMET_INSTANCES = [
  "https://api.consumet.org",
  "https://consumet-api.vercel.app", 
  "https://consumet-api-two.vercel.app",
];

export const dynamic = "force-dynamic";
export const maxDuration = 25;

// ──────────────────────────────────────────────
// Helpers 
// ──────────────────────────────────────────────

async function fetchFromConsumet(path: string): Promise<any | null> {
  for (const base of CONSUMET_INSTANCES) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(`${base}${path}`, {
        headers: {
          "Accept": "application/json",
          "User-Agent": "AniVerse/1.0",
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (res.ok) {
        const data = await res.json();
        if (data && !data.error) {
          return { ...data, _source: base };
        }
      }

      console.log(`[Consumet] ${base}${path} → ${res.status}`);
    } catch (err) {
      console.log(`[Consumet] Instance ${base} failed:`, String(err).slice(0, 80));
    }
  }
  return null;
}

// Clean anime title for better search matching
function cleanForSearch(title: string): string {
  return title
    .replace(/\(TV\)/gi, "")
    .replace(/\(OVA\)/gi, "")
    .replace(/\(ONA\)/gi, "")
    .replace(/Season \d+/gi, "")
    .replace(/S\d+/gi, "")
    .replace(/Part \d+/gi, "")
    .replace(/[^\w\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
      return NextResponse.json({ error: "Parameter 'q' diperlukan" }, { status: 400 });
    }

    try {
      const cleaned = cleanForSearch(query);

      // Try Gogoanime provider (most stable, largest library)
      let data = await fetchFromConsumet(
        `/anime/gogoanime/${encodeURIComponent(cleaned)}`
      );

      if (data?.results?.length > 0) {
        return NextResponse.json({
          results: data.results.map((r: any) => ({
            id: r.id,
            title: r.title,
            url: r.url || r.id,
            image: r.image,
            releaseDate: r.releaseDate,
            subOrDub: r.subOrDub,
          })),
          total: data.results.length,
          provider: "gogoanime",
        });
      }

      // Fallback: try shorter query
      const words = cleaned.split(" ");
      if (words.length > 2) {
        const shorter = words.slice(0, 2).join(" ");
        data = await fetchFromConsumet(
          `/anime/gogoanime/${encodeURIComponent(shorter)}`
        );

        if (data?.results?.length > 0) {
          return NextResponse.json({
            results: data.results.map((r: any) => ({
              id: r.id,
              title: r.title,
              url: r.url || r.id,
              image: r.image,
              releaseDate: r.releaseDate,
              subOrDub: r.subOrDub,
            })),
            total: data.results.length,
            provider: "gogoanime",
          });
        }
      }

      return NextResponse.json({ results: [], total: 0 });
    } catch (error) {
      console.error("[Consumet Search]", error);
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }
  }

  // ─── EPISODES (Get anime info + episode list) ─
  if (action === "episodes") {
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Parameter 'id' diperlukan" }, { status: 400 });
    }

    try {
      const data = await fetchFromConsumet(
        `/anime/gogoanime/info/${encodeURIComponent(id)}`
      );

      if (!data) {
        return NextResponse.json({ error: "Gagal mengambil informasi anime" }, { status: 502 });
      }

      return NextResponse.json({
        title: data.title,
        image: data.image,
        episodes: (data.episodes || []).map((ep: any) => ({
          id: ep.id,
          number: ep.number,
          title: ep.title || `Episode ${ep.number}`,
          url: ep.url || ep.id,
        })),
        total: data.episodes?.length || 0,
        provider: "gogoanime",
      });
    } catch (error) {
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }
  }

  // ─── WATCH (Get streaming links for an episode) ─
  if (action === "watch") {
    const episodeId = searchParams.get("episodeId");
    if (!episodeId) {
      return NextResponse.json({ error: "Parameter 'episodeId' diperlukan" }, { status: 400 });
    }

    try {
      // Try default server
      let data = await fetchFromConsumet(
        `/anime/gogoanime/watch/${encodeURIComponent(episodeId)}`
      );

      if (data?.sources?.length > 0) {
        return NextResponse.json({
          sources: data.sources.map((s: any) => ({
            url: s.url,
            quality: s.quality,
            isM3U8: s.isM3U8,
          })),
          subtitles: data.subtitles || [],
          headers: data.headers || {},
          provider: "gogoanime",
        });
      }

      // Try alternate servers: vidstreaming, gogocdn, streamsb
      for (const server of ["vidstreaming", "gogocdn", "streamsb"]) {
        data = await fetchFromConsumet(
          `/anime/gogoanime/watch/${encodeURIComponent(episodeId)}?server=${server}`
        );

        if (data?.sources?.length > 0) {
          return NextResponse.json({
            sources: data.sources.map((s: any) => ({
              url: s.url,
              quality: s.quality,
              isM3U8: s.isM3U8,
            })),
            subtitles: data.subtitles || [],
            headers: data.headers || {},
            server,
            provider: "gogoanime",
          });
        }
      }

      return NextResponse.json({
        sources: [],
        error: "Tidak ada sumber video yang ditemukan",
      });
    } catch (error) {
      return NextResponse.json({ error: String(error) }, { status: 500 });
    }
  }

  return NextResponse.json({ error: "Action tidak valid. Gunakan: search, episodes, watch" }, { status: 400 });
}
