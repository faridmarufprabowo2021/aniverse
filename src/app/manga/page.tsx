"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen, Search, Clock, ChevronRight,
  Loader2, AlertTriangle, Star, X, RefreshCcw, Crown, Award
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNavbar } from "@/components/layout/BottomNavbar";
import {
  getLatestManga, searchManga,
  type MangaListItem, type PaginationInfo
} from "@/lib/manga-api";

const TYPE_COLORS: Record<string, string> = {
  Manga: "#a855f7", Manhwa: "#3b82f6", Manhua: "#f59e0b",
  manga: "#a855f7", manhwa: "#3b82f6", manhua: "#f59e0b",
  Komik: "#10b981",
};

function ComicCard({ comic }: { comic: MangaListItem }) {
  const slug = comic.slug || "";
  const poster = comic.image;
  const typeColor = TYPE_COLORS[comic.type || ""] || "#6b7280";
  const latestCh = comic.chapters?.[0]?.title || comic.latestChapter;

  return (
    <Link href={`/manga/${encodeURIComponent(slug)}`}>
      <motion.div
        whileHover={{ scale: 1.03, y: -2 }}
        whileTap={{ scale: 0.97 }}
        className="relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] group cursor-pointer shadow-sm hover:border-purple-500/30 hover:shadow-md transition-all duration-300"
      >
        <div className="aspect-[3/4] relative bg-[var(--color-surface-2)] overflow-hidden">
          {poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={poster}
              alt={comic.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
              onError={e => { (e.target as HTMLImageElement).src = "/placeholder-manga.svg"; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen size={28} className="text-[var(--color-text-muted)]" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent" />

          {comic.type && (
            <span
              className="absolute top-2 left-2 text-[9px] font-black px-1.5 py-0.5 rounded-md shadow-md uppercase tracking-wider"
              style={{ backgroundColor: `${typeColor}cc`, color: "#fff" }}
            >
              {comic.type}
            </span>
          )}

          {comic.rating && (
            <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded-md border border-white/5">
              <Star size={9} className="text-yellow-400 fill-yellow-400" />
              <span className="text-[9px] font-extrabold text-white">{comic.rating}</span>
            </div>
          )}

          {/* Color badge (Warna/Hitam) */}
          {comic.color && (
            <div className={`absolute bottom-8 right-1.5 text-[8px] font-black px-1 py-0.5 rounded shadow ${
              comic.color === "Warna" ? "bg-green-500/80 text-white animate-pulse" : "bg-zinc-600/80 text-zinc-200"
            }`}>
              {comic.color}
            </div>
          )}

          {latestCh && (
            <div className="absolute bottom-1.5 left-1.5 right-1.5">
              <span className="text-[9px] font-bold text-white/95 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded-md block truncate border border-white/5">
                {latestCh}
              </span>
            </div>
          )}
        </div>

        <div className="p-2.5">
          <p className="text-[11px] font-bold leading-tight line-clamp-2 group-hover:text-purple-400 transition-colors">
            {comic.title}
          </p>
          {comic.status && (
            <p className={`text-[9px] mt-1 font-bold ${
              comic.status.includes("Ongoing") || comic.status.includes("ongoing") ? "text-green-400" : "text-zinc-500"
            }`}>
              {comic.status}
            </p>
          )}
        </div>
      </motion.div>
    </Link>
  );
}

function PopularRankCard({ comic, rank }: { comic: MangaListItem; rank: number }) {
  const typeColor = TYPE_COLORS[comic.type || ""] || "#6b7280";

  return (
    <Link href={`/manga/${encodeURIComponent(comic.slug)}`}>
      <div className="flex items-center gap-3 p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-purple-500/30 hover:bg-purple-500/5 transition-all duration-300 group shadow-sm">
        {/* Rank Number & Badge */}
        <div className="shrink-0 w-6 flex justify-center items-center">
          {rank === 1 ? (
            <div className="relative flex items-center justify-center w-5 h-5 rounded-full bg-yellow-500/10 border border-yellow-500/30">
              <Crown size={12} className="text-yellow-400 fill-yellow-400/20" />
            </div>
          ) : rank === 2 ? (
            <div className="relative flex items-center justify-center w-5 h-5 rounded-full bg-slate-500/10 border border-slate-500/30">
              <Award size={12} className="text-slate-400 fill-slate-400/20" />
            </div>
          ) : rank === 3 ? (
            <div className="relative flex items-center justify-center w-5 h-5 rounded-full bg-amber-600/10 border border-amber-600/30">
              <Award size={12} className="text-amber-600 fill-amber-600/20" />
            </div>
          ) : (
            <span className="text-xs font-black text-[var(--color-text-muted)]">{rank}</span>
          )}
        </div>

        {/* Poster */}
        <div className="w-10 h-14 rounded-lg overflow-hidden shrink-0 bg-[var(--color-surface-2)] border border-[var(--color-border)] shadow-sm">
          {comic.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={comic.image} alt={comic.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              onError={e => { (e.target as HTMLImageElement).src = "/placeholder-manga.svg"; }} />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-extrabold truncate group-hover:text-purple-400 transition-colors leading-tight">{comic.title}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {comic.type && (
              <span className="text-[8px] font-black uppercase tracking-wider px-1 rounded-sm" style={{ backgroundColor: `${typeColor}15`, color: typeColor }}>
                {comic.type}
              </span>
            )}
            {comic.author && <p className="text-[10px] text-[var(--color-text-muted)] truncate font-medium">{comic.author}</p>}
          </div>
        </div>

        {/* Rating */}
        {comic.rating && (
          <div className="flex items-center gap-0.5 shrink-0 bg-yellow-500/5 px-1.5 py-0.5 rounded-md border border-yellow-500/10">
            <Star size={10} className="text-yellow-500 fill-yellow-500" />
            <span className="text-[10px] font-black text-yellow-500">{comic.rating}</span>
          </div>
        )}
      </div>
    </Link>
  );
}

export default function MangaPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<MangaListItem[]>([]);
  const [popular, setPopular] = useState<MangaListItem[]>([]);
  const [latest, setLatest] = useState<MangaListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "manga" | "manhwa" | "manhua">("all");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState<PaginationInfo>({ currentPage: 1, hasNextPage: false });
  const [loadingMore, setLoadingMore] = useState(false);

  // Load homepage data via multi-provider API
  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(false);
      try {
        const data = await getLatestManga(page);
        if (page === 1) {
          setLatest(data.comics);
          setPopular(data.popular);
        } else {
          setLatest(prev => [...prev, ...data.comics]);
        }
        setPagination(data.pagination);
      } catch {
        if (page === 1) setError(true);
      }
      setLoading(false);
      setLoadingMore(false);
    }
    load();
  }, [page]);

  // Search with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    const t = setTimeout(async () => {
      setSearching(true);
      const data = await searchManga(searchQuery);
      setSearchResults(data.results);
      setSearching(false);
    }, 500);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Filter
  const filteredLatest = activeFilter === "all"
    ? latest
    : latest.filter(c => c.type?.toLowerCase() === activeFilter);

  const loadMore = () => {
    if (pagination.hasNextPage && !loadingMore) {
      setLoadingMore(true);
      setPage(p => p + 1);
    }
  };

  return (
    <>
      <TopBar />
      <main className="pt-safe pb-safe min-h-screen">
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-4 pb-28 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-4">
            <BookOpen size={24} className="text-blue-400" />
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                Manga Reader
              </h1>
              <p className="text-xs text-[var(--color-text-muted)] font-medium mt-0.5">
                Komikindo + 10 sumber • Koleksi Manga, Manhwa, & Manhua Indonesia Lengkap
              </p>
            </div>
          </div>

          {/* Search bar */}
          <div className="relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari judul manga, manhwa, manhua..."
              className="w-full pl-10 pr-10 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl text-sm outline-none focus:border-blue-500 transition-colors shadow-inner"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                <X size={15} />
              </button>
            )}
            {searching && <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-blue-400" />}
          </div>

          {/* Responsive Layout Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column (Main Area): Filter, Search Results, Latest Updates */}
            <div className="lg:col-span-8 xl:col-span-9 space-y-6">
              {/* Filter tabs */}
              {!searchQuery && (
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                  {(["all", "manga", "manhwa", "manhua"] as const).map(f => (
                    <button
                      key={f}
                      onClick={() => setActiveFilter(f)}
                      className={`px-4 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all border shadow-sm ${
                        activeFilter === f
                          ? "bg-blue-500 text-white border-blue-500 shadow-md shadow-blue-500/10"
                          : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-purple-500/20"
                      }`}
                    >
                      {f === "all" ? "Semua" : f.charAt(0).toUpperCase() + f.slice(1)}
                    </button>
                  ))}
                </div>
              )}

              {/* Loading */}
              {loading && page === 1 && (
                <div className="py-20 flex flex-col items-center gap-3">
                  <Loader2 className="animate-spin text-blue-400" size={32} />
                  <p className="text-sm text-[var(--color-text-muted)] font-medium animate-pulse">Memuat katalog komik...</p>
                </div>
              )}

              {/* Error */}
              {!loading && error && (
                <div className="py-16 flex flex-col items-center gap-3 text-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-6">
                  <AlertTriangle size={32} className="text-yellow-500" />
                  <p className="text-sm font-bold">Gagal memuat data manga</p>
                  <p className="text-xs text-[var(--color-text-muted)]">Periksa koneksi internet atau server proxy kamu</p>
                  <button onClick={() => { setPage(1); setError(false); }} className="flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:underline mt-2">
                    <RefreshCcw size={13} /> Coba lagi
                  </button>
                </div>
              )}

              {/* Search results */}
              {searchQuery && !searching && (
                <div className="space-y-4">
                  <p className="text-xs font-black text-[var(--color-text-muted)] uppercase tracking-wider">
                    {searchResults.length} hasil pencarian untuk &quot;{searchQuery}&quot;
                  </p>
                  {searchResults.length > 0 ? (
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                      {searchResults.map((c, i) => (
                        <motion.div key={c.slug + i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}>
                          <ComicCard comic={c} />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="py-16 text-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl">
                      <BookOpen size={32} className="text-[var(--color-text-muted)] mx-auto mb-2" />
                      <p className="text-sm text-[var(--color-text-muted)] font-bold">Manga tidak ditemukan</p>
                    </div>
                  )}
                </div>
              )}

              {/* Homepage Content */}
              {!searchQuery && !loading && !error && (
                <div className="space-y-6">
                  {/* Mobile Popular List (Shown only on small screens) */}
                  {popular.length > 0 && activeFilter === "all" && (
                    <div className="lg:hidden space-y-3">
                      <div className="flex items-center gap-2">
                        <Crown size={15} className="text-yellow-400" />
                        <h2 className="text-sm font-black uppercase tracking-wider">Top 10 Populer</h2>
                      </div>
                      <div className="space-y-1.5">
                        {popular.slice(0, 10).map((c, i) => (
                          <motion.div key={c.slug + i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}>
                            <PopularRankCard comic={c} rank={i + 1} />
                          </motion.div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Latest Updates Grid */}
                  {filteredLatest.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2">
                        <Clock size={15} className="text-blue-400" />
                        <h2 className="text-sm font-black uppercase tracking-wider">
                          {activeFilter === "all" ? "Update Terbaru" : `${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Terbaru`}
                        </h2>
                        <span className="text-[10px] font-bold text-[var(--color-text-muted)] bg-[var(--color-surface-2)] px-2 py-0.5 rounded-full border border-[var(--color-border)]">
                          {filteredLatest.length}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4">
                        {filteredLatest.map((c, i) => (
                          <motion.div key={c.slug + i} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: Math.min(i * 0.015, 0.4) }}>
                            <ComicCard comic={c} />
                          </motion.div>
                        ))}
                      </div>

                      {/* Load More */}
                      {pagination.hasNextPage && activeFilter === "all" && (
                        <button
                          onClick={loadMore}
                          disabled={loadingMore}
                          className="w-full py-3.5 text-xs font-black text-blue-400 hover:text-blue-300 border border-[var(--color-border)] rounded-2xl hover:bg-blue-500/5 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
                        >
                          {loadingMore ? (
                            <><Loader2 size={14} className="animate-spin" /> Memuat Lebih Banyak...</>
                          ) : (
                            <>Muat Lebih Banyak <ChevronRight size={14} /></>
                          )}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Empty state */}
                  {filteredLatest.length === 0 && popular.length === 0 && (
                    <div className="py-16 text-center bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl space-y-2">
                      <BookOpen size={32} className="text-[var(--color-text-muted)] mx-auto" />
                      <p className="text-sm font-black">Data manga belum tersedia</p>
                      <p className="text-xs text-[var(--color-text-muted)]">API sedang bermasalah atau mengalami limit.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Right Column (Sidebar, Desktop-only): Top 10 Populer */}
            {!searchQuery && !loading && !error && popular.length > 0 && activeFilter === "all" && (
              <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-6 lg:sticky lg:top-[90px]">
                <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 space-y-4 hover:border-purple-500/20 transition-all duration-300 shadow-md">
                  <div className="flex items-center gap-2 pb-3 border-b border-[var(--color-border)]">
                    <Crown size={15} className="text-yellow-400 animate-bounce" />
                    <h2 className="text-xs font-black uppercase tracking-wider text-[var(--color-text-primary)]">Top 10 Populer</h2>
                  </div>
                  <div className="space-y-2">
                    {popular.slice(0, 10).map((c, i) => (
                      <motion.div key={c.slug + i} initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                        <PopularRankCard comic={c} rank={i + 1} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              </aside>
            )}
          </div>
        </div>
      </main>
      <BottomNavbar />
    </>
  );
}
