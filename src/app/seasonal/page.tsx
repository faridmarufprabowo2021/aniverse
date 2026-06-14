"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { AnimeCard, AnimeSeason } from "@/types/anime";
import { AnimeGrid } from "@/components/anime/AnimeCard";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNavbar } from "@/components/layout/BottomNavbar";

const SEASONS: AnimeSeason[] = ["WINTER", "SPRING", "SUMMER", "FALL"];
const SEASON_LABELS: Record<AnimeSeason, string> = {
  WINTER: "❄️ Winter",
  SPRING: "🌸 Spring",
  SUMMER: "☀️ Summer",
  FALL: "🍂 Fall",
};

function getCurrentSeasonIndex(): number {
  const month = new Date().getMonth() + 1;
  if (month <= 3) return 0;
  if (month <= 6) return 1;
  if (month <= 9) return 2;
  return 3;
}

export default function SeasonalPage() {
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [seasonIdx, setSeasonIdx] = useState(getCurrentSeasonIndex());
  const [anime, setAnime] = useState<AnimeCard[]>([]);
  const [loading, setLoading] = useState(true);

  const season = SEASONS[seasonIdx];

  const prevSeason = () => {
    if (seasonIdx === 0) { setSeasonIdx(3); setYear((y) => y - 1); }
    else setSeasonIdx((i) => i - 1);
  };

  const nextSeason = () => {
    if (seasonIdx === 3) { setSeasonIdx(0); setYear((y) => y + 1); }
    else setSeasonIdx((i) => i + 1);
  };

  useEffect(() => {
    setLoading(true);
    fetch(`/api/anime/seasonal?season=${season}&year=${year}&perPage=30`)
      .then((r) => r.json())
      .then((data) => { setAnime(data.data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [season, year]);

  return (
    <>
      <TopBar />

      <main className="pt-safe pb-safe">
        {/* Season Navigator */}
        <div className="sticky top-[var(--top-bar-height)] md:top-0 z-30 bg-[var(--color-bg)]/80 backdrop-blur-xl border-b border-[var(--color-border)] py-3">
          <div className="max-w-7xl mx-auto px-4 md:px-8">
            <div className="flex items-center justify-between">
              <button
                onClick={prevSeason}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] transition-colors"
              >
                <ChevronLeft size={18} />
              </button>

              <div className="text-center">
                <div className="text-lg font-black" style={{ fontFamily: "var(--font-display)" }}>
                  {SEASON_LABELS[season]} {year}
                </div>
                <div className="text-xs text-[var(--color-text-muted)]">
                  {anime.length > 0 && !loading ? `${anime.length} anime` : ""}
                </div>
              </div>

              <button
                onClick={nextSeason}
                disabled={year > currentYear || (year === currentYear && seasonIdx >= getCurrentSeasonIndex())}
                className="w-9 h-9 rounded-full flex items-center justify-center bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary)] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight size={18} />
              </button>
            </div>

            {/* Season Tabs */}
            <div className="flex gap-2 mt-3">
              {SEASONS.map((s, i) => (
                <button
                  key={s}
                  onClick={() => setSeasonIdx(i)}
                  className="flex-1 py-1.5 rounded-full text-xs font-semibold transition-all duration-150"
                  style={{
                    background: i === seasonIdx ? "var(--color-primary)" : "var(--color-surface-2)",
                    color: i === seasonIdx ? "white" : "var(--color-text-muted)",
                    border: `1px solid ${i === seasonIdx ? "var(--color-primary)" : "var(--color-border)"}`,
                  }}
                >
                  {SEASON_LABELS[s].split(" ")[0]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Grid */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-4">
          <AnimeGrid anime={anime} loading={loading} skeletonCount={12} />
        </div>
      </main>

      <BottomNavbar />
    </>
  );
}
