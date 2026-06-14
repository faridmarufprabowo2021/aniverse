"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Star, Users, Calendar, Crown, Trophy, TrendingUp, Award, HelpCircle } from "lucide-react";
import type { AnimeCard } from "@/types/anime";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNavbar } from "@/components/layout/BottomNavbar";
import { Skeleton } from "@/components/ui/Skeleton";
import {
  getBestTitle, getCoverImage, formatScore,
  getScoreColor, formatNumber, formatAnimeType,
  cn
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

  // Medal styling for top 3 with floating absolute micro-icons
  const rankBadgeClass = cn(
    "w-8 h-8 rounded-full flex items-center justify-center text-xs font-black select-none relative transition-transform duration-200 group-hover:scale-105",
    rank === 1
      ? "bg-gradient-to-br from-amber-300 via-yellow-500 to-yellow-600 text-white shadow-[0_0_12px_rgba(245,158,11,0.4)] ring-2 ring-yellow-400/30"
      : rank === 2
      ? "bg-gradient-to-br from-slate-200 via-slate-400 to-zinc-500 text-white shadow-[0_0_12px_rgba(148,163,184,0.4)] ring-2 ring-slate-300/30"
      : rank === 3
      ? "bg-gradient-to-br from-orange-400 via-amber-600 to-amber-700 text-white shadow-[0_0_12px_rgba(217,119,6,0.4)] ring-2 ring-amber-500/30"
      : "bg-[var(--color-surface-2)] text-[var(--color-text-muted)] border border-[var(--color-border)]"
  );

  return (
    <motion.div variants={itemVariants}>
      <Link href={`/anime/${anime.id}`}>
        <div className="flex items-center gap-4 p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl hover:border-purple-500/40 hover:bg-[var(--color-surface-2)] hover:shadow-[0_4px_20px_rgba(124,58,237,0.08)] hover:-translate-y-0.5 transition-all duration-300 group mb-3">
          {/* Rank Badge */}
          <div className="shrink-0 w-10 flex justify-center items-center">
            <div className={rankBadgeClass}>
              {rank === 1 ? (
                <>
                  <Crown size={11} className="text-yellow-200 fill-yellow-200 absolute -top-2" />
                  <span>{rank}</span>
                </>
              ) : rank === 2 ? (
                <>
                  <Trophy size={10} className="text-slate-200 fill-slate-200 absolute -top-1.5" />
                  <span>{rank}</span>
                </>
              ) : rank === 3 ? (
                <>
                  <Trophy size={10} className="text-amber-200 fill-amber-200 absolute -top-1.5" />
                  <span>{rank}</span>
                </>
              ) : (
                <span>{rank}</span>
              )}
            </div>
          </div>

          {/* Cover Poster */}
          <div
            className="relative shrink-0 rounded-xl overflow-hidden bg-[var(--color-surface-2)] border border-[var(--color-border)] w-12 h-18 md:w-16 md:h-24 shadow-sm"
          >
            <Image
              src={cover}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 768px) 48px, 64px"
            />
          </div>

          {/* Title & Extra Info Grid */}
          <div className="flex-1 min-w-0 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
            {/* Title & Genres Column */}
            <div className="md:col-span-6 min-w-0">
              <p className="text-sm md:text-base font-black line-clamp-1 text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors duration-200">
                {title}
              </p>
              {anime.title.english && anime.title.english !== title && (
                <p className="text-[10px] text-[var(--color-text-muted)] line-clamp-1 mt-0.5 font-medium">
                  {anime.title.english}
                </p>
              )}
              
              {/* Description snippet on desktop */}
              {anime.description && (
                <p className="hidden md:line-clamp-2 text-[11px] text-[var(--color-text-secondary)] mt-1.5 leading-relaxed font-normal">
                  {anime.description.replace(/<[^>]*>/g, "")}
                </p>
              )}
              
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                {/* Mobile Meta */}
                <span className="text-[11px] text-[var(--color-text-muted)] md:hidden font-medium">
                  {anime.format ? formatAnimeType(anime.format) : ""}
                  {anime.year && ` · ${anime.year}`}
                  {anime.episodes && ` · ${anime.episodes} eps`}
                </span>

                {/* Desktop Genres */}
                <div className="hidden md:flex flex-wrap gap-1">
                  {anime.genres.slice(0, 3).map(g => (
                    <span 
                      key={g}
                      className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-secondary)] shadow-sm"
                    >
                      {g}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Desktop Format & Episodes Column */}
            <div className="hidden md:block md:col-span-2 min-w-0">
              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-extrabold bg-purple-500/10 text-purple-400 border border-purple-500/20 uppercase tracking-wider">
                {anime.format ? formatAnimeType(anime.format) : "TBA"}
              </span>
              <p className="text-xs font-bold text-[var(--color-text-secondary)] mt-2 flex items-center gap-1">
                <Calendar size={11} className="text-[var(--color-text-muted)]" />
                <span>
                  {anime.season ? `${anime.season.toLowerCase()} ${anime.year}` : anime.year || "TBA"}
                </span>
              </p>
              <p className="text-[10px] text-[var(--color-text-muted)] mt-0.5 font-medium">
                {anime.episodes ? `${anime.episodes} Episode` : "N/A"}
              </p>
            </div>

            {/* Desktop Popularity Column */}
            <div className="hidden md:flex md:col-span-2 flex-col justify-center items-start gap-1">
              <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] font-bold">
                <Users size={13} className="text-purple-400" />
                <span>{anime.popularity ? formatNumber(anime.popularity) : "0"}</span>
              </div>
              <span className="text-[9px] text-[var(--color-text-muted)] font-medium">Popularitas</span>
            </div>

            {/* Score Column */}
            {anime.averageScore != null && (
              <div className="flex flex-col items-end shrink-0 pl-2 md:col-span-2">
                <div className="flex items-center gap-1">
                  <Star size={14} fill={getScoreColor(anime.averageScore)} color={getScoreColor(anime.averageScore)} className="drop-shadow-sm" />
                  <span className="text-sm md:text-base font-black" style={{ color: getScoreColor(anime.averageScore) }}>
                    {formatScore(anime.averageScore)}
                  </span>
                </div>
                <span className="text-[9px] text-[var(--color-text-muted)] hidden md:inline mt-1 font-semibold">Skor Komunitas</span>
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

function RankedRowSkeleton() {
  return (
    <div className="flex items-center gap-4 p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl mb-3">
      {/* Rank Badge Skeleton */}
      <div className="shrink-0 w-10 flex justify-center">
        <Skeleton width={32} height={32} rounded="full" />
      </div>
      
      {/* Poster Skeleton */}
      <div className="shrink-0 w-12 h-18 md:w-16 md:h-24 relative rounded-xl overflow-hidden bg-[var(--color-surface-2)]">
        <Skeleton className="w-full h-full" />
      </div>

      {/* Grid Skeleton */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
        <div className="md:col-span-6 space-y-2">
          <Skeleton height={16} className="w-3/4" />
          <Skeleton height={10} className="w-1/2" />
          <Skeleton height={12} className="w-full hidden md:block" />
          <div className="flex gap-1.5 mt-2">
            <Skeleton height={14} className="w-12 rounded-full" />
            <Skeleton height={14} className="w-12 rounded-full" />
          </div>
        </div>
        
        {/* Format / eps column */}
        <div className="hidden md:block md:col-span-2 space-y-2">
          <Skeleton height={16} className="w-14 rounded-md" />
          <Skeleton height={12} className="w-20" />
        </div>

        {/* Popularity column */}
        <div className="hidden md:block md:col-span-2 space-y-1.5">
          <Skeleton height={12} className="w-16" />
          <Skeleton height={10} className="w-10" />
        </div>

        {/* Score column */}
        <div className="shrink-0 space-y-1.5 pl-2 flex flex-col items-end md:col-span-2">
          <Skeleton height={16} className="w-10" />
          <Skeleton height={10} className="w-14" />
        </div>
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

  // Spotlight Anime (Rank #1)
  const spotlightAnime = anime[0];

  return (
    <>
      <TopBar />

      <main className="pt-safe pb-safe max-w-7xl mx-auto w-full px-4 md:px-8 pb-24">
        {/* Header */}
        <div className="pt-6 pb-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-[var(--color-border)] mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
              ⭐ Peringkat Terbaik
            </h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Anime dengan rating tertinggi berdasarkan suara komunitas global
            </p>
          </div>
          
          {/* Tabs */}
          <div className="flex gap-1 bg-[var(--color-surface-2)] p-1 rounded-full border border-[var(--color-border)] self-start md:self-center shadow-inner">
            {TABS.map((t, i) => (
              <button
                key={t.label}
                onClick={() => setActiveTab(i)}
                className="px-4 py-1.5 rounded-full text-xs md:text-sm font-bold transition-all duration-200"
                style={{
                  background: i === activeTab ? "var(--color-primary)" : "transparent",
                  color: i === activeTab ? "white" : "var(--color-text-muted)",
                  boxShadow: i === activeTab ? "0 4px 12px var(--color-primary-glow)" : "none",
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Layout Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Main List Column */}
          <div className="lg:col-span-8 xl:col-span-9">
            {loading ? (
              <div className="space-y-3">
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
                className="space-y-3"
              >
                {anime.map((a, i) => (
                  <RankedRow key={a.id} anime={a} rank={i + 1} />
                ))}
              </motion.div>
            )}
          </div>

          {/* Sidebar Widgets Column */}
          <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-6 lg:sticky lg:top-[90px]">
            {/* Spotlight Card */}
            {!loading && spotlightAnime && (
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden shadow-lg p-5 space-y-4 hover:border-purple-500/20 transition-all duration-300 group">
                <h3 className="text-xs font-black uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Crown size={14} className="text-yellow-400 animate-pulse" />
                  Spotlight Teratas
                </h3>
                
                <div className="relative aspect-[16/10] w-full rounded-xl overflow-hidden bg-[var(--color-surface-2)] shadow-inner">
                  <Image
                    src={getCoverImage(spotlightAnime.coverImage)}
                    alt={getBestTitle(spotlightAnime.title)}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="280px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2 flex justify-between items-end">
                    <span className="bg-yellow-500 text-white font-extrabold text-[9px] px-2 py-0.5 rounded-md flex items-center gap-1 shadow-md uppercase tracking-wider">
                      <Award size={10} fill="white" /> RANK #1
                    </span>
                    <span className="bg-black/60 backdrop-blur-sm text-yellow-400 text-xs font-black px-2 py-0.5 rounded-md flex items-center gap-0.5 border border-yellow-500/20">
                      ★ {formatScore(spotlightAnime.averageScore)}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="font-extrabold text-sm text-[var(--color-text-primary)] line-clamp-1 group-hover:text-[var(--color-primary)] transition-colors">
                    {getBestTitle(spotlightAnime.title)}
                  </h4>
                  {spotlightAnime.description && (
                    <p 
                      className="text-[11px] text-[var(--color-text-muted)] line-clamp-3 leading-relaxed"
                    >
                      {spotlightAnime.description.replace(/<[^>]*>/g, "")}
                    </p>
                  )}
                </div>

                <Link 
                  href={`/anime/${spotlightAnime.id}`}
                  className="block w-full py-2.5 text-center rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs transition-all duration-200 shadow-md hover:shadow-purple-500/20 transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  Lihat Detail Anime
                </Link>
              </div>
            )}

            {/* Statistics Widget */}
            {!loading && (
              <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 space-y-4 hover:border-purple-500/20 transition-all duration-300">
                <h3 className="text-xs font-black uppercase tracking-wider text-[var(--color-text-secondary)] flex items-center gap-1.5">
                  <TrendingUp size={14} className="text-purple-400" />
                  Statistik Peringkat
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[var(--color-surface-2)] p-3 rounded-xl border border-[var(--color-border)] shadow-sm">
                    <span className="text-[10px] text-[var(--color-text-muted)] block font-bold uppercase tracking-wider">Total Item</span>
                    <span className="text-xl font-black text-[var(--color-text-primary)]">{anime.length} Entri</span>
                  </div>
                  
                  <div className="bg-[var(--color-surface-2)] p-3 rounded-xl border border-[var(--color-border)] shadow-sm">
                    <span className="text-[10px] text-[var(--color-text-muted)] block font-bold uppercase tracking-wider">Rerata Skor</span>
                    <span className="text-xl font-black text-emerald-400">
                      {anime.length > 0
                        ? (anime.reduce((acc, curr) => acc + (curr.averageScore || 0), 0) / anime.length).toFixed(2)
                        : "0.00"}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-[var(--color-border)] text-[10px] text-[var(--color-text-muted)] leading-relaxed space-y-2 font-medium">
                  <div className="flex items-start gap-1.5">
                    <span className="text-purple-500 font-bold">•</span>
                    <span>Peringkat diperbarui secara berkala menggunakan data skor rating dari AniList.</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-purple-500 font-bold">•</span>
                    <span>Popularitas diukur berdasarkan jumlah pengguna yang memasukkan judul ke list mereka.</span>
                  </div>
                </div>
              </div>
            )}

            {/* Guide Card */}
            <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 hover:border-purple-500/20 transition-all duration-300">
              <div className="flex items-center gap-2 mb-3">
                <HelpCircle size={15} className="text-purple-400" />
                <h4 className="text-xs font-extrabold text-[var(--color-text-primary)] uppercase tracking-wider">Butuh Bantuan?</h4>
              </div>
              <p className="text-[11px] text-[var(--color-text-muted)] leading-relaxed font-medium">
                Punya pertanyaan tentang cara kerja skor rating atau butuh rekomendasi anime spesifik? Hubungi asisten AI di pojok kanan bawah halaman!
              </p>
            </div>
          </aside>
        </div>
      </main>

      <BottomNavbar />
    </>
  );
}
