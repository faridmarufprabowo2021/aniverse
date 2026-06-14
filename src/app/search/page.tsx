"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Search, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import type { AnimeCard, AnimeSeason, AnimeStatus, AnimeFormat, AnimeSort } from "@/types/anime";
import { AnimeGrid } from "@/components/anime/AnimeCard";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNavbar } from "@/components/layout/BottomNavbar";
import { Button } from "@/components/ui/Button";
import { bottomSheetVariants, overlayVariants } from "@/lib/animations";

// ═══════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════

const GENRES = [
  "Action", "Adventure", "Comedy", "Drama", "Fantasy", "Horror",
  "Mystery", "Romance", "Sci-Fi", "Slice of Life", "Sports",
  "Supernatural", "Thriller", "Mecha", "Music", "Psychological",
  "Isekai", "Shounen", "Shoujo", "Seinen", "Josei",
];

const SEASONS: { label: string; value: AnimeSeason }[] = [
  { label: "Winter", value: "WINTER" },
  { label: "Spring", value: "SPRING" },
  { label: "Summer", value: "SUMMER" },
  { label: "Fall", value: "FALL" },
];

const FORMATS: { label: string; value: AnimeFormat }[] = [
  { label: "TV Series", value: "TV" },
  { label: "Movie", value: "MOVIE" },
  { label: "OVA", value: "OVA" },
  { label: "ONA", value: "ONA" },
  { label: "Special", value: "SPECIAL" },
];

const SORT_OPTIONS: { label: string; value: AnimeSort }[] = [
  { label: "Relevance", value: "SEARCH_MATCH" },
  { label: "Popularity", value: "POPULARITY_DESC" },
  { label: "Score", value: "SCORE_DESC" },
  { label: "Trending", value: "TRENDING_DESC" },
  { label: "Newest", value: "START_DATE_DESC" },
];

const YEARS = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i);

// ═══════════════════════════════════════
// FILTER COMPONENT (Re-used for Sidebar & Sheet)
// ═══════════════════════════════════════

interface Filters {
  genre?: string;
  year?: number;
  season?: AnimeSeason;
  format?: AnimeFormat;
  sort: AnimeSort;
}

interface FilterContentProps {
  filters: Filters;
  onChange: (filters: Filters) => void;
}

function FilterPill({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="px-3 py-1.5 rounded-full text-xs font-medium border transition-all duration-150 select-none"
      style={{
        background: selected ? "var(--color-primary)" : "var(--color-surface-2)",
        borderColor: selected ? "var(--color-primary)" : "var(--color-border)",
        color: selected ? "white" : "var(--color-text-secondary)",
      }}
    >
      {label}
    </button>
  );
}

function FilterContent({ filters, onChange }: FilterContentProps) {
  const update = (key: keyof Filters, val: unknown) => {
    onChange({ ...filters, [key]: val });
  };

  return (
    <div className="space-y-5">
      {/* Sort */}
      <div>
        <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
          Urutkan
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {SORT_OPTIONS.map((s) => (
            <FilterPill
              key={s.value}
              label={s.label}
              selected={filters.sort === s.value}
              onClick={() => update("sort", s.value)}
            />
          ))}
        </div>
      </div>

      {/* Genres */}
      <div>
        <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
          Genre
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {GENRES.map((g) => (
            <FilterPill
              key={g}
              label={g}
              selected={filters.genre === g}
              onClick={() => update("genre", filters.genre === g ? undefined : g)}
            />
          ))}
        </div>
      </div>

      {/* Format */}
      <div>
        <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
          Format
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {FORMATS.map((f) => (
            <FilterPill
              key={f.value}
              label={f.label}
              selected={filters.format === f.value}
              onClick={() => update("format", filters.format === f.value ? undefined : f.value)}
            />
          ))}
        </div>
      </div>

      {/* Season */}
      <div>
        <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
          Musim
        </h3>
        <div className="flex flex-wrap gap-1.5">
          {SEASONS.map((s) => (
            <FilterPill
              key={s.value}
              label={s.label}
              selected={filters.season === s.value}
              onClick={() => update("season", filters.season === s.value ? undefined : s.value)}
            />
          ))}
        </div>
      </div>

      {/* Year */}
      <div>
        <h3 className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-2">
          Tahun
        </h3>
        <div className="scroll-x flex gap-1.5 pb-1 max-w-full overflow-x-auto scrollbar-none">
          {YEARS.map((y) => (
            <FilterPill
              key={y}
              label={String(y)}
              selected={filters.year === y}
              onClick={() => update("year", filters.year === y ? undefined : y)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════
// FILTER BOTTOM SHEET (Mobile Only)
// ═══════════════════════════════════════

interface FilterSheetProps {
  open: boolean;
  onClose: () => void;
  filters: Filters;
  onChange: (filters: Filters) => void;
}

function FilterSheet({ open, onClose, filters, onChange }: FilterSheetProps) {
  const clear = () => onChange({ sort: "SEARCH_MATCH" });

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            variants={overlayVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="modal-overlay"
            onClick={onClose}
          />
          <motion.div
            variants={bottomSheetVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="bottom-sheet"
          >
            <div className="bottom-sheet-handle" />

            <div className="px-4 pb-8 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
                  Filters
                </h2>
                <button
                  onClick={clear}
                  className="text-xs text-[var(--color-primary)] font-semibold"
                >
                  Clear All
                </button>
              </div>

              <FilterContent filters={filters} onChange={onChange} />

              <Button fullWidth onClick={onClose} className="mt-4">Apply Filters</Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

// ═══════════════════════════════════════
// SEARCH PAGE CONTENT
// ═══════════════════════════════════════

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [filters, setFilters] = useState<Filters>({
    genre: searchParams.get("genre") ?? undefined,
    sort: (searchParams.get("sort") as AnimeSort) ?? "SEARCH_MATCH",
    year: searchParams.get("year") ? Number(searchParams.get("year")) : undefined,
    season: (searchParams.get("season") as AnimeSeason) ?? undefined,
    format: (searchParams.get("format") as AnimeFormat) ?? undefined,
  });
  const [results, setResults] = useState<AnimeCard[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const performSearch = useCallback(async (q: string, f: Filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q) params.set("q", q);
      if (f.genre) params.set("genre", f.genre);
      if (f.year) params.set("year", f.year.toString());
      if (f.season) params.set("season", f.season);
      if (f.format) params.set("format", f.format);
      if (f.sort) params.set("sort", f.sort);

      const res = await fetch(`/api/anime/search?${params.toString()}`);
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResults(data.data || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error(err);
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial search from deep links
  useEffect(() => {
    performSearch(searchParams.get("q") ?? "", filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update URL and search when query/filters change
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    
    debounceRef.current = setTimeout(() => {
      const url = new URL(window.location.href);
      if (query) url.searchParams.set("q", query);
      else url.searchParams.delete("q");
      
      if (filters.genre) url.searchParams.set("genre", filters.genre);
      else url.searchParams.delete("genre");

      if (filters.year) url.searchParams.set("year", filters.year.toString());
      else url.searchParams.delete("year");

      if (filters.season) url.searchParams.set("season", filters.season);
      else url.searchParams.delete("season");

      if (filters.format) url.searchParams.set("format", filters.format);
      else url.searchParams.delete("format");
      
      if (filters.sort !== "SEARCH_MATCH") url.searchParams.set("sort", filters.sort);
      else url.searchParams.delete("sort");

      window.history.replaceState({}, "", url.pathname + url.search);
      performSearch(query, filters);
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query, filters, performSearch]);

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <>
      <TopBar />
      
      {/* Search Header fixed below topbar */}
      <div className="sticky top-16 md:top-0 z-30 bg-[var(--color-bg)]/80 backdrop-blur-xl border-b border-[var(--color-border)] py-3">
        <div className="max-w-7xl mx-auto w-full px-4 md:px-8 space-y-3">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]" size={18} />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cari anime..."
                className="w-full h-11 pl-10 pr-4 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-[var(--radius-button)] text-sm text-[var(--color-text-primary)] focus:border-[var(--color-primary)] outline-none transition-colors"
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
            </div>
            
            {/* Mobile Filter Toggle */}
            <Button
              variant={activeFiltersCount > 0 ? "primary" : "outline"}
              onClick={() => setShowFilters(true)}
              className="w-11 px-0 shrink-0 relative lg:hidden"
            >
              <SlidersHorizontal size={18} />
              {activeFiltersCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--color-accent)] rounded-full text-[10px] font-bold flex items-center justify-center text-white border-2 border-[var(--color-bg)]">
                  {activeFiltersCount}
                </span>
              )}
            </Button>
          </div>

          {/* Quick Active Filters Scroll */}
          {activeFiltersCount > 0 && (
            <div className="scroll-x flex gap-2 pb-1 overflow-x-auto max-w-full scrollbar-none">
              {filters.genre && (
                <span className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 bg-[var(--color-primary-bg)] border border-[var(--color-primary)] rounded-full text-xs text-[var(--color-primary)] font-semibold">
                  {filters.genre}
                  <button onClick={() => setFilters((f) => ({ ...f, genre: undefined }))}>
                    <X size={10} />
                  </button>
                </span>
              )}
              {filters.year && (
                <span className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 bg-[var(--color-primary-bg)] border border-[var(--color-primary)] rounded-full text-xs text-[var(--color-primary)] font-semibold">
                  {filters.year}
                  <button onClick={() => setFilters((f) => ({ ...f, year: undefined }))}>
                    <X size={10} />
                  </button>
                </span>
              )}
              {filters.season && (
                <span className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 bg-[var(--color-primary-bg)] border border-[var(--color-primary)] rounded-full text-xs text-[var(--color-primary)] font-semibold uppercase">
                  {filters.season}
                  <button onClick={() => setFilters((f) => ({ ...f, season: undefined }))}>
                    <X size={10} />
                  </button>
                </span>
              )}
              {filters.format && (
                <span className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 bg-[var(--color-primary-bg)] border border-[var(--color-primary)] rounded-full text-xs text-[var(--color-primary)] font-semibold">
                  {filters.format}
                  <button onClick={() => setFilters((f) => ({ ...f, format: undefined }))}>
                    <X size={10} />
                  </button>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <main className="max-w-7xl mx-auto w-full px-4 md:px-8 py-6 pb-safe">
        {/* Visually hidden heading for SEO */}
        <h1 style={{ position: "absolute", width: "1px", height: "1px", padding: "0", margin: "-1px", overflow: "hidden", clip: "rect(0, 0, 0, 0)", whiteSpace: "nowrap", border: "0" }}>
          Cari Anime & Manga Sub Indo — AniVerse
        </h1>
        {/* Desktop Sidebar Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Sidebar Filter - Desktop Only */}
          <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 lg:sticky lg:top-20 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
              <h2 className="text-sm font-extrabold flex items-center gap-1.5" style={{ fontFamily: "var(--font-display)" }}>
                <SlidersHorizontal size={14} className="text-[var(--color-primary)]" /> Filter Anime
              </h2>
              {activeFiltersCount > 0 && (
                <button
                  onClick={() => setFilters({ sort: "SEARCH_MATCH" })}
                  className="text-xs text-[var(--color-primary)] hover:underline font-semibold"
                >
                  Reset
                </button>
              )}
            </div>
            <div className="overflow-y-auto max-h-[calc(100vh-220px)] pr-1 scrollbar-thin">
              <FilterContent filters={filters} onChange={(f) => setFilters(f)} />
            </div>
          </aside>

          {/* Search Results Area */}
          <div className="lg:col-span-8 xl:col-span-9 space-y-4">
            {/* Results header */}
            {!loading && (results.length > 0 || query) && (
              <p className="text-xs text-[var(--color-text-muted)]">
                {results.length > 0
                  ? `${total.toLocaleString()} hasil ditemukan${query ? ` untuk "${query}"` : ""}`
                  : `Tidak ada hasil${query ? ` untuk "${query}"` : ""}`}
              </p>
            )}

            {/* Empty state */}
            {!loading && results.length === 0 && !query && !filters.genre && !filters.year && !filters.season && !filters.format && (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                <div className="text-6xl">🔍</div>
                <div>
                  <p className="text-lg font-bold" style={{ fontFamily: "var(--font-display)" }}>
                    Cari di AniVerse
                  </p>
                  <p className="text-sm text-[var(--color-text-muted)] mt-1">
                    Cari anime berdasarkan judul, genre, tahun, dan lainnya
                  </p>
                </div>
              </div>
            )}

            {/* No results */}
            {!loading && results.length === 0 && (query || filters.genre || filters.year || filters.season || filters.format) && (
              <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
                <div className="text-5xl">😶</div>
                <div>
                  <p className="text-base font-bold" style={{ fontFamily: "var(--font-display)" }}>
                    Anime tidak ditemukan
                  </p>
                  <p className="text-sm text-[var(--color-text-muted)] mt-1">
                    Coba sesuaikan pencarian atau filter Anda
                  </p>
                </div>
              </div>
            )}

            {/* Results grid */}
            <AnimeGrid anime={results} loading={loading} skeletonCount={12} />
          </div>
        </div>
      </main>

      <BottomNavbar />

      <FilterSheet
        open={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onChange={(f) => setFilters(f)}
      />
    </>
  );
}

import { Suspense } from "react";

export default function SearchPage() {
  return (
    <div className="flex flex-col min-h-dvh bg-[var(--color-bg)]">
      <Suspense fallback={
        <div className="flex justify-center items-center h-full pt-32">
          <div className="w-8 h-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" />
        </div>
      }>
        <SearchContent />
      </Suspense>
    </div>
  );
}
