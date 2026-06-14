"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  History, Play, Trash2, Clock, Loader2, X,
  BookOpen, Tv, ChevronRight
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNavbar } from "@/components/layout/BottomNavbar";
import { Button } from "@/components/ui/Button";
import {
  getWatchHistory, removeFromHistory, clearWatchHistory,
  WatchHistoryItem, formatTime, getWatchProgress
} from "@/lib/watchHistory";
import {
  getMangaHistory, getGroupedMangaHistory, removeMangaFromHistory,
  clearMangaHistory, MangaHistoryItem
} from "@/lib/mangaHistory";
import { containerVariants, itemVariants } from "@/lib/animations";

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Baru saja";
  if (mins < 60) return `${mins} menit lalu`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} jam lalu`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} hari lalu`;
  return new Date(ts).toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

export default function HistoryPage() {
  const [tab, setTab] = useState<"anime" | "manga">("anime");
  const [animeHistory, setAnimeHistory] = useState<WatchHistoryItem[]>([]);
  const [mangaHistory, setMangaHistory] = useState<MangaHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAnimeHistory(getWatchHistory());
    setMangaHistory(getGroupedMangaHistory());
    setLoading(false);
  }, []);

  const handleRemoveAnime = useCallback((animeId: number, episodeId: string) => {
    removeFromHistory(animeId, episodeId);
    setAnimeHistory(getWatchHistory());
  }, []);

  const handleRemoveManga = useCallback((mangaSlug: string) => {
    removeMangaFromHistory(mangaSlug);
    setMangaHistory(getGroupedMangaHistory());
  }, []);

  const handleClearAnime = useCallback(() => {
    if (confirm("Hapus semua riwayat tonton anime?")) {
      clearWatchHistory();
      setAnimeHistory([]);
    }
  }, []);

  const handleClearManga = useCallback(() => {
    if (confirm("Hapus semua riwayat baca manga?")) {
      clearMangaHistory();
      setMangaHistory([]);
    }
  }, []);

  // Group anime by animeId
  const grouped = animeHistory.reduce<Record<number, WatchHistoryItem[]>>((acc, item) => {
    if (!acc[item.animeId]) acc[item.animeId] = [];
    acc[item.animeId].push(item);
    return acc;
  }, {});

  const currentList = tab === "anime" ? animeHistory : mangaHistory;

  return (
    <>
      <TopBar />
      <main className="pt-safe pb-safe min-h-dvh">
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-2xl mx-auto w-full px-4 pb-28">
          {/* Header */}
          <motion.div variants={itemVariants} className="pt-20 pb-2">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-black flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
                <History size={24} className="text-purple-400" />
                Riwayat
              </h1>
              {currentList.length > 0 && (
                <button
                  onClick={tab === "anime" ? handleClearAnime : handleClearManga}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-red-400 hover:text-red-300 px-3 py-1.5 rounded-lg bg-red-500/5 border border-red-500/10 hover:border-red-500/20 transition-all"
                >
                  <Trash2 size={12} /> Hapus Semua
                </button>
              )}
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div variants={itemVariants} className="mt-2 mb-4">
            <div className="flex gap-1 p-1 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)]">
              <button
                onClick={() => setTab("anime")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  tab === "anime"
                    ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                }`}
              >
                <Tv size={14} />
                Anime
                {animeHistory.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-md bg-purple-500/20 text-[9px]">
                    {new Set(animeHistory.map(h => h.animeId)).size}
                  </span>
                )}
              </button>
              <button
                onClick={() => setTab("manga")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold transition-all ${
                  tab === "manga"
                    ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                    : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                }`}
              >
                <BookOpen size={14} />
                Manga
                {mangaHistory.length > 0 && (
                  <span className="px-1.5 py-0.5 rounded-md bg-blue-500/20 text-[9px]">
                    {mangaHistory.length}
                  </span>
                )}
              </button>
            </div>
          </motion.div>

          {/* Content */}
          <motion.div variants={itemVariants} className="space-y-3">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              </div>
            ) : tab === "anime" ? (
              /* ── Anime History ──────────────────── */
              animeHistory.length === 0 ? (
                <EmptyState
                  icon={Tv}
                  title="Belum ada riwayat tonton"
                  desc="Mulai menonton anime untuk melihat riwayat di sini"
                  href="/"
                  btnText="Jelajahi Anime"
                />
              ) : (
                Object.entries(grouped).map(([animeId, items]) => {
                  const latest = items[0];
                  const progress = getWatchProgress(latest);
                  return (
                    <motion.div
                      key={animeId}
                      whileHover={{ x: 2 }}
                      className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden hover:border-purple-500/20 transition-all"
                    >
                      <Link href={`/anime/${animeId}`}>
                        <div className="flex gap-3 p-3">
                          <div className="relative w-14 h-20 rounded-xl overflow-hidden bg-[var(--color-surface-2)] shrink-0">
                            {latest.coverImage && (
                              <Image src={latest.coverImage} alt={latest.animeTitle} fill className="object-cover" sizes="56px" />
                            )}
                            {/* Episode badge */}
                            {latest.episodeNumber && (
                              <div className="absolute bottom-0 left-0 right-0 bg-purple-600/90 text-white text-[8px] font-bold text-center py-0.5">
                                EP {latest.episodeNumber}{latest.totalEpisodes ? `/${latest.totalEpisodes}` : ""}
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0 py-0.5">
                            <p className="text-sm font-bold line-clamp-1 hover:text-purple-400 transition-colors">
                              {latest.animeTitleEnglish || latest.animeTitle}
                            </p>
                            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5 line-clamp-1">
                              {latest.episodeTitle}
                            </p>

                            {/* Watch Progress */}
                            {latest.watchedSeconds != null && latest.watchedSeconds > 0 && (
                              <div className="mt-1.5">
                                <div className="flex items-center justify-between text-[9px] text-[var(--color-text-muted)] mb-0.5">
                                  <span>{formatTime(latest.watchedSeconds)}</span>
                                  {latest.durationSeconds && <span>{formatTime(latest.durationSeconds)}</span>}
                                </div>
                                <div className="h-1 bg-[var(--color-border)] rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all"
                                    style={{ width: `${progress}%` }}
                                  />
                                </div>
                              </div>
                            )}

                            <div className="flex items-center gap-1.5 mt-1.5">
                              <Clock size={11} className="text-purple-400" />
                              <span className="text-[11px] text-[var(--color-text-muted)]">
                                {timeAgo(latest.timestamp)}
                              </span>
                            </div>
                          </div>
                          <ChevronRight size={14} className="self-center text-[var(--color-text-muted)]" />
                        </div>
                      </Link>

                      {/* Episode list */}
                      <div className="border-t border-[var(--color-border)] px-3 py-2 space-y-1">
                        {items.slice(0, 3).map(ep => {
                          const epProgress = getWatchProgress(ep);
                          return (
                            <div key={ep.episodeId} className="flex items-center justify-between py-1.5 group">
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <Play size={10} className="text-purple-400 shrink-0" fill="currentColor" />
                                <span className="text-xs text-[var(--color-text-secondary)] truncate">
                                  {ep.episodeTitle}
                                </span>
                                {epProgress > 0 && epProgress < 95 && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 shrink-0">
                                    {epProgress}%
                                  </span>
                                )}
                                {epProgress >= 95 && (
                                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/10 text-green-400 shrink-0">
                                    ✓
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2 shrink-0">
                                <span className="text-[10px] text-[var(--color-text-muted)]">{timeAgo(ep.timestamp)}</span>
                                <button
                                  onClick={(e) => { e.preventDefault(); handleRemoveAnime(ep.animeId, ep.episodeId); }}
                                  className="p-1 rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all"
                                >
                                  <X size={12} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                        {items.length > 3 && (
                          <p className="text-[10px] text-[var(--color-text-muted)] text-center py-1">
                            +{items.length - 3} episode lainnya
                          </p>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )
            ) : (
              /* ── Manga History ─────────────────── */
              mangaHistory.length === 0 ? (
                <EmptyState
                  icon={BookOpen}
                  title="Belum ada riwayat baca"
                  desc="Mulai membaca manga untuk melihat riwayat di sini"
                  href="/manga"
                  btnText="Jelajahi Manga"
                />
              ) : (
                mangaHistory.map(manga => (
                  <motion.div
                    key={manga.mangaSlug}
                    whileHover={{ x: 2 }}
                    className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl overflow-hidden hover:border-blue-500/20 transition-all"
                  >
                    <Link href={`/manga/${manga.mangaSlug}`}>
                      <div className="flex gap-3 p-3">
                        <div className="relative w-14 h-20 rounded-xl overflow-hidden bg-[var(--color-surface-2)] shrink-0 flex items-center justify-center">
                          {manga.coverImage ? (
                            <Image src={manga.coverImage} alt={manga.mangaTitle} fill className="object-cover" sizes="56px" />
                          ) : (
                            <BookOpen size={20} className="text-blue-400 opacity-30" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 py-0.5">
                          <p className="text-sm font-bold line-clamp-1 hover:text-blue-400 transition-colors">
                            {manga.mangaTitle}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <BookOpen size={10} className="text-blue-400" />
                            <span className="text-[11px] text-[var(--color-text-secondary)]">
                              {manga.lastChapterTitle}
                            </span>
                          </div>
                          {manga.type && (
                            <span className="inline-block mt-1 text-[9px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400">
                              {manga.type}
                            </span>
                          )}
                          <div className="flex items-center gap-1.5 mt-1.5">
                            <Clock size={11} className="text-blue-400" />
                            <span className="text-[11px] text-[var(--color-text-muted)]">
                              {timeAgo(manga.timestamp)}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 self-center">
                          <button
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveManga(manga.mangaSlug); }}
                            className="p-1.5 rounded-md text-zinc-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
                          >
                            <X size={14} />
                          </button>
                          <ChevronRight size={14} className="text-[var(--color-text-muted)]" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))
              )
            )}
          </motion.div>
        </motion.div>
      </main>
      <BottomNavbar />
    </>
  );
}

// ─── Empty State Component ──────────────────────
function EmptyState({ icon: Icon, title, desc, href, btnText }: {
  icon: React.ElementType; title: string; desc: string; href: string; btnText: string;
}) {
  return (
    <div className="py-16 text-center space-y-3">
      <div className="w-20 h-20 mx-auto rounded-full bg-purple-500/10 flex items-center justify-center">
        <Icon size={32} className="text-purple-400 opacity-50" />
      </div>
      <p className="text-sm font-semibold text-[var(--color-text-muted)]">{title}</p>
      <p className="text-xs text-[var(--color-text-muted)]">{desc}</p>
      <Link href={href}>
        <Button size="sm" className="mt-2">{btnText}</Button>
      </Link>
    </div>
  );
}
