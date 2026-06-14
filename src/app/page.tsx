"use client";

import { useState, useEffect } from "react";
import type { AnimeCard } from "@/types/anime";
import { HeroBanner } from "@/components/anime/HeroBanner";
import { AnimeCarousel, AnimeGrid } from "@/components/anime/AnimeCard";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNavbar } from "@/components/layout/BottomNavbar";
import { getCurrentSeason } from "@/lib/api/anilist";
import { formatSeason } from "@/lib/utils";

// ═══════════════════════════════════════
// DATA FETCHING HOOKS
// ═══════════════════════════════════════

function useAnimeData(endpoint: string) {
  const [data, setData] = useState<AnimeCard[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetch(endpoint)
      .then((r) => r.json())
      .then((json) => {
        if (!cancelled) {
          setData(json.data ?? []);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(err);
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [endpoint]);

  return { data, loading };
}

// ═══════════════════════════════════════
// HOME PAGE
// ═══════════════════════════════════════

export default function HomePage() {
  const { season, year } = getCurrentSeason();
  const seasonLabel = formatSeason(season, year);

  const { data: trending, loading: trendingLoading } = useAnimeData("/api/anime/trending?perPage=15");
  const { data: seasonal, loading: seasonalLoading } = useAnimeData(
    `/api/anime/seasonal?season=${season}&year=${year}&perPage=20`
  );

  // Hero = first 5 trending items
  const heroAnime = trending.slice(0, 5);

  return (
    <>
      <TopBar transparent />

      <main className="pb-safe min-h-dvh">
        {/* Hero Carousel */}
        <HeroBanner anime={heroAnime} loading={trendingLoading} />

        <div className="px-4 md:px-8 max-w-7xl mx-auto w-full space-y-8 mt-6">
          {/* Trending Now */}
          <section>
            <SectionHeader
              title="🔥 Sedang Trending"
              subtitle="Paling banyak ditonton minggu ini"
              seeAllHref="/top?sort=TRENDING_DESC"
            />
            <AnimeCarousel anime={trending} loading={trendingLoading} cardWidth={130} />
          </section>

          {/* Musim Ini */}
          <section>
            <SectionHeader
              title={`📅 Musim ${seasonLabel}`}
              subtitle="Yang sedang tayang saat ini"
              seeAllHref={`/seasonal?season=${season}&year=${year}`}
            />
            <AnimeCarousel anime={seasonal.slice(0, 12)} loading={seasonalLoading} cardWidth={130} />
          </section>

          {/* Top Sepanjang Masa */}
          <section>
            <SectionHeader
              title="⭐ Terbaik Sepanjang Masa"
              subtitle="Dicintai komunitas anime"
              seeAllHref="/top"
            />
            <AnimeGrid
              anime={trending.slice(0, 6)}
              loading={trendingLoading}
              skeletonCount={6}
            />
          </section>
        </div>
      </main>

      <BottomNavbar />
    </>
  );
}
