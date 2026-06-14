"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen, Search, TrendingUp, Clock, ChevronRight,
  Loader2, AlertTriangle, Star, X, RefreshCcw, Crown, ChevronLeft
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
        className="relative overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] group cursor-pointer"
      >
        <div className="aspect-[3/4] relative bg-[var(--color-surface-2)] overflow-hidden">
          {poster ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={poster}
              alt={comic.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
              onError={e => { (e.target as HTMLImageElement).src = "/placeholder-manga.svg"; }}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <BookOpen size={28} className="text-[var(--color-text-muted)]" />
            </div>
          )}

          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

          {comic.type && (
            <span
              className="absolute top-2 left-2 text-[9px] font-black px-1.5 py-0.5 rounded-md"
              style={{ backgroundColor: `${typeColor}cc`, color: "#fff" }}
            >
              {comic.type}
            </span>
          )}

          {comic.rating && (
            <div className="absolute top-2 right-2 flex items-center gap-0.5 bg-black/60 backdrop-blur-sm px-1.5 py-0.5 rounded-md">
              <Star size={9} className="text-yellow-400 fill-yellow-400" />
              <span className="text-[9px] font-bold text-white">{comic.rating}</span>
            </div>
          )}

          {/* Color badge (Warna/Hitam) */}
          {comic.color && (
            <div className={`absolute bottom-8 right-1.5 text-[8px] font-bold px-1 py-0.5 rounded ${
              comic.color === "Warna" ? "bg-green-500/80 text-white" : "bg-zinc-600/80 text-zinc-200"
            }`}>
              {comic.color}
            </div>
          )}

          {latestCh && (
            <div className="absolute bottom-1.5 left-1.5 right-1.5">
              <span className="text-[9px] font-bold text-white/90 bg-black/50 backdrop-blur-sm px-1.5 py-0.5 rounded-md block truncate">
                {latestCh}
              </span>
            </div>
          )}
        </div>

        <div className="p-2">
          <p className="text-[11px] font-bold leading-tight line-clamp-2 group-hover:text-purple-400 transition-colors">
            {comic.title}
          </p>
          {comic.status && (
            <p className={`text-[9px] mt-0.5 font-semibold ${
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
  return (
    <Link href={`/manga/${encodeURIComponent(comic.slug)}`}>
      <div className="flex items-center gap-3 p-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-purple-500/30 hover:bg-purple-500/5 transition-all group">
        <div className="text-lg font-black text-[var(--color-text-muted)] w-6 text-center shrink-0">
          {rank <= 3 ? (
            <span className={`${rank === 1 ? "text-yellow-400" : rank === 2 ? "text-zinc-400" : "text-amber-600"}`}>
              {rank}
            </span>
          ) : rank}
        </div>
        <div className="w-10 h-14 rounded-lg overflow-hidden shrink-0 bg-[var(--color-surface-2)]">
          {comic.image && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={comic.image} alt={comic.title} className="w-full h-full object-cover"
              onError={e => { (e.target as HTMLImageElement).src = "/placeholder-manga.svg"; }} />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold truncate group-hover:text-purple-400 transition-colors">{comic.title}</p>
          {comic.author && <p className="text-[10px] text-[var(--color-text-muted)] truncate">{comic.author}</p>}
        </div>
        {comic.rating && (
          <div className="flex items-center gap-0.5 shrink-0">
            <Star size={10} className="text-yellow-400 fill-yellow-400" />
            <span className="text-[10px] font-bold text-yellow-400">{comic.rating}</span>
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
        <div className="max-w-lg mx-auto px-4 pt-4 pb-28 space-y-5">
          {/* Header */}
          <div className="flex items-center gap-2">
            <BookOpen size={22} className="text-blue-400" />
            <div>
              <h1 className="text-xl font-black" style={{ fontFamily: "var(--font-display)" }}>
                Manga Reader
              </h1>
              <p className="text-xs text-[var(--color-text-muted)]">
                Komikindo + 10 sumber • Manga, Manhwa, Manhua
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
              className="w-full pl-10 pr-10 py-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl text-sm outline-none focus:border-blue-500 transition-colors"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]">
                <X size={15} />
              </button>
            )}
            {searching && <Loader2 size={15} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-blue-400" />}
          </div>

          {/* Filter tabs */}
          {!searchQuery && (
            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {(["all", "manga", "manhwa", "manhua"] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border ${
                    activeFilter === f
                      ? "bg-blue-500 text-white border-blue-500"
                      : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)]"
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
              <p className="text-sm text-[var(--color-text-muted)]">Memuat manga...</p>
            </div>
          )}

          {/* Error */}
          {!loading && error && (
            <div className="py-16 flex flex-col items-center gap-3 text-center">
              <AlertTriangle size={32} className="text-yellow-500" />
              <p className="text-sm font-bold">Gagal memuat data manga</p>
              <p className="text-xs text-[var(--color-text-muted)]">Periksa koneksi internet kamu</p>
              <button onClick={() => { setPage(1); setError(false); }} className="flex items-center gap-1.5 text-xs font-bold text-blue-400 hover:underline">
                <RefreshCcw size={13} /> Coba lagi
              </button>
            </div>
          )}

          {/* Search results */}
          {searchQuery && !searching && (
            <div className="space-y-3">
              <p className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider">
                {searchResults.length} hasil untuk &quot;{searchQuery}&quot;
              </p>
              {searchResults.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                  {searchResults.map((c, i) => (
                    <motion.div key={c.slug + i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
                      <ComicCard comic={c} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <BookOpen size={28} className="text-[var(--color-text-muted)] mx-auto mb-2" />
                  <p className="text-sm text-[var(--color-text-muted)]">Manga tidak ditemukan</p>
                </div>
              )}
            </div>
          )}

          {/* Homepage content */}
          {!searchQuery && !loading && !error && (
            <>
              {/* Popular Top 10 */}
              {popular.length > 0 && activeFilter === "all" && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Crown size={15} className="text-yellow-400" />
                    <h2 className="text-sm font-black uppercase tracking-wider">Top 10 Populer</h2>
                  </div>
                  <div className="space-y-1.5">
                    {popular.slice(0, 10).map((c, i) => (
                      <motion.div key={c.slug + i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                        <PopularRankCard comic={c} rank={i + 1} />
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {/* Latest Updates */}
              {filteredLatest.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <Clock size={15} className="text-blue-400" />
                    <h2 className="text-sm font-black uppercase tracking-wider">
                      {activeFilter === "all" ? "Update Terbaru" : `${activeFilter.charAt(0).toUpperCase() + activeFilter.slice(1)} Terbaru`}
                    </h2>
                    <span className="text-[10px] text-[var(--color-text-muted)] bg-[var(--color-surface-2)] px-2 py-0.5 rounded-full font-bold">
                      {filteredLatest.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5">
                    {filteredLatest.map((c, i) => (
                      <motion.div key={c.slug + i} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: Math.min(i * 0.02, 0.5) }}>
                        <ComicCard comic={c} />
                      </motion.div>
                    ))}
                  </div>

                  {/* Load More */}
                  {pagination.hasNextPage && activeFilter === "all" && (
                    <button
                      onClick={loadMore}
                      disabled={loadingMore}
                      className="w-full py-3 text-xs font-bold text-blue-400 hover:text-blue-300 border border-[var(--color-border)] rounded-xl hover:bg-blue-500/5 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {loadingMore ? (
                        <><Loader2 size={13} className="animate-spin" /> Memuat...</>
                      ) : (
                        <>Muat Lebih Banyak <ChevronRight size={13} /></>
                      )}
                    </button>
                  )}
                </div>
              )}

              {/* Empty state */}
              {filteredLatest.length === 0 && popular.length === 0 && (
                <div className="py-12 text-center space-y-2">
                  <BookOpen size={32} className="text-[var(--color-text-muted)] mx-auto" />
                  <p className="text-sm font-bold">Data manga belum tersedia</p>
                  <p className="text-xs text-[var(--color-text-muted)]">API sedang dalam perbaikan</p>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <BottomNavbar />
    </>
  );
}
