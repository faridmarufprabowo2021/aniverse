"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import type { AnimeCard } from "@/types/anime";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNavbar } from "@/components/layout/BottomNavbar";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  getBestTitle, getCoverImage, formatScore,
  getScoreColor, formatNumber, formatAnimeType,
} from "@/lib/utils";
import { containerVariants, itemVariants } from "@/lib/animations";

const TABS = [
  { label: "Semua", format: undefined },
  { label: "Film", format: "MOVIE" },
  { label: "OVA", format: "OVA" },
] as const;

function RankedRow({ anime, rank }: { anime: AnimeCard; rank: number }) {
  const title = getBestTitle(anime.title);
  const cover = getCoverImage(anime.coverImage);

  return (
    <motion.div variants={itemVariants}>
      <Link href={`/anime/${anime.id}`}>
        <div className="flex items-center gap-3 py-3 border-b border-[var(--color-border)] group">
          {/* Rank */}
          <div className="w-8 text-center shrink-0">
            {rank <= 3 ? (
              <span className="text-lg font-black gradient-text">#{rank}</span>
            ) : (
              <span className="text-sm font-bold text-[var(--color-text-muted)]">{rank}</span>
            )}
          </div>

          {/* Cover */}
          <div
            className="relative shrink-0 rounded-[var(--radius-sm)] overflow-hidden bg-[var(--color-surface-2)]"
            style={{ width: 44, aspectRatio: "2/3" }}
          >
            <Image
              src={cover}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="44px"
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold line-clamp-2 text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors">
              {title}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {anime.format ? formatAnimeType(anime.format) : ""}
              {anime.year && ` · ${anime.year}`}
              {anime.episodes && ` · ${anime.episodes} eps`}
            </p>
          </div>

          {/* Score */}
          {anime.averageScore != null && (
            <div className="flex items-center gap-1 shrink-0">
              <Star size={12} fill={getScoreColor(anime.averageScore)} color={getScoreColor(anime.averageScore)} />
              <span className="text-sm font-bold" style={{ color: getScoreColor(anime.averageScore) }}>
                {formatScore(anime.averageScore)}
              </span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  );
}

function RankedRowSkeleton() {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-[var(--color-border)]">
      <Skeleton width={32} height={20} />
      <Skeleton width={44} height={66} rounded="sm" />
      <div className="flex-1 space-y-2">
        <Skeleton height={14} className="w-3/4" />
        <Skeleton height={12} className="w-1/2" />
      </div>
    </div>
  );
}

export default function TopPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [anime, setAnime] = useState<AnimeCard[]>([]);
  const [loading, setLoading] = useState(true);

  const tab = TABS[activeTab];

  useEffect(() => {
    setLoading(true);
    const url = `/api/anime/top?perPage=50${tab.format ? `&format=${tab.format}` : ""}`;
    fetch(url)
      .then((r) => r.json())
      .then((data) => { setAnime(data.data ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [tab.format]);

  return (
    <>
      <TopBar />

      <main className="pt-safe pb-safe max-w-3xl mx-auto w-full px-4 md:px-8 pb-24">
        {/* Header */}
        <div className="pt-4 pb-2">
          <h1 className="text-2xl font-black" style={{ fontFamily: "var(--font-display)" }}>
            ⭐ Peringkat Terbaik
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Anime terbaik diranking berdasarkan skor komunitas
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 pb-4">
          {TABS.map((t, i) => (
            <button
              key={t.label}
              onClick={() => setActiveTab(i)}
              className="relative px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-150"
              style={{
                background: i === activeTab ? "var(--color-primary)" : "var(--color-surface-2)",
                color: i === activeTab ? "white" : "var(--color-text-muted)",
                border: `1px solid ${i === activeTab ? "var(--color-primary)" : "var(--color-border)"}`,
                boxShadow: i === activeTab ? "0 4px 12px var(--color-primary-glow)" : "none",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Ranked List */}
        <div>
          {loading ? (
            <div>
              {Array.from({ length: 10 }).map((_, i) => (
                <RankedRowSkeleton key={i} />
              ))}
            </div>
          ) : (
            <motion.div
              key={activeTab}
              variants={containerVariants}
              initial="hidden"
              animate="show"
            >
              {anime.map((a, i) => (
                <RankedRow key={a.id} anime={a} rank={i + 1} />
              ))}
            </motion.div>
          )}
        </div>
      </main>

      <BottomNavbar />
    </>
  );
}
