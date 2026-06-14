"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  BookOpen, ChevronLeft, Star, Clock, List as ListIcon,
  BookMarked, ChevronRight, Loader2, AlertTriangle, Play,
  User2, Tag, Info, ArrowUpDown, Palette
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNavbar } from "@/components/layout/BottomNavbar";
import { getMangaDetail, type MangaDetailData } from "@/lib/manga-api";
import { cn } from "@/lib/utils";

const TYPE_COLORS: Record<string, string> = {
  Manga: "#a855f7", Manhwa: "#3b82f6", Manhua: "#f59e0b", Komik: "#10b981",
};

export default function MangaDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = decodeURIComponent(params.slug as string);

  const [comic, setComic] = useState<MangaDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [showAllChapters, setShowAllChapters] = useState(false);
  const [chapterOrder, setChapterOrder] = useState<"newest" | "oldest">("newest");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(false);
      const data = await getMangaDetail(slug);
      if (data) setComic(data);
      else setError(true);
      setLoading(false);
    }
    load();
  }, [slug]);

  if (loading) return (
    <>
      <TopBar />
      <main className="pt-safe pb-safe min-h-screen flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-blue-400" size={32} />
        <p className="text-sm text-[var(--color-text-muted)] font-medium animate-pulse">Memuat detail manga...</p>
      </main>
      <BottomNavbar />
    </>
  );

  if (error || !comic) return (
    <>
      <TopBar />
      <main className="pt-safe pb-safe min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <AlertTriangle size={40} className="text-yellow-500" />
        <p className="font-bold text-lg">Manga tidak ditemukan</p>
        <p className="text-sm text-[var(--color-text-muted)]">Judul ini mungkin belum tersedia atau terjadi kesalahan API</p>
        <button onClick={() => router.back()} className="text-sm text-blue-400 hover:underline flex items-center gap-1">
          <ChevronLeft size={14} /> Kembali
        </button>
      </main>
      <BottomNavbar />
    </>
  );

  // Unified data extraction
  const isKomikindo = comic._provider === "komikindo";
  const comicType = isKomikindo ? comic.detail?.type : comic.metadata?.type;
  const author = isKomikindo ? comic.detail?.author : comic.metadata?.author;
  const illustrator = isKomikindo ? comic.detail?.illustrator : undefined;
  const status = isKomikindo ? comic.detail?.status : comic.metadata?.status;
  const altTitle = isKomikindo ? comic.detail?.alternativeTitle : undefined;
  const theme = isKomikindo ? comic.detail?.theme : comic.metadata?.concept;
  const typeColor = TYPE_COLORS[comicType || ""] || "#6b7280";
  const chapters = comic.chapters || [];
  const sortedChapters = chapterOrder === "oldest" ? [...chapters].reverse() : chapters;
  const displayedChapters = showAllChapters ? sortedChapters : sortedChapters.slice(0, 30);
  const firstChapter = comic.firstChapter || chapters[chapters.length - 1];
  const latestChapter = comic.latestChapter || chapters[0];
  const synopsis = comic.description || comic.synopsis_full || comic.synopsis || "";

  return (
    <>
      <TopBar />
      <main className="pt-safe pb-safe min-h-screen">
        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-4 pb-28 space-y-5">
          {/* Back button */}
          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] transition-colors self-start">
            <ChevronLeft size={16} /> Kembali
          </button>

          {/* 🖥️ DESKTOP LAYOUT (Visible on large screens) */}
          <div className="hidden lg:grid lg:grid-cols-12 lg:gap-8 items-start">
            {/* Left Column (Sticky Sidebar): Poster, Actions, Stats, Alt Titles */}
            <aside className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-[90px] space-y-5">
              <div className="relative aspect-[3/4] w-full rounded-2xl overflow-hidden bg-[var(--color-surface-2)] border border-[var(--color-border)] shadow-xl group">
                {comic.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={comic.image}
                    alt={comic.title}
                    className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                    onError={e => { (e.target as HTMLImageElement).src = "/placeholder-manga.svg"; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[var(--color-surface-3)]">
                    <BookOpen size={48} className="text-[var(--color-text-muted)]" />
                  </div>
                )}
              </div>

              {/* Quick Actions */}
              {chapters.length > 0 && (
                <div className="flex flex-col gap-2">
                  <Link href={`/manga/chapter/${encodeURIComponent(firstChapter?.slug || "")}`} className="w-full">
                    <button className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-black hover:shadow-lg hover:shadow-blue-500/20 active:scale-95 transition-all">
                      <BookMarked size={16} /> Mulai Baca
                    </button>
                  </Link>
                  <Link href={`/manga/chapter/${encodeURIComponent(latestChapter?.slug || "")}`} className="w-full">
                    <button className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-black hover:border-blue-500/40 active:scale-95 transition-all text-[var(--color-text-primary)]">
                      <Play size={16} className="fill-purple-500 text-purple-500" /> Ch. Terbaru
                    </button>
                  </Link>
                </div>
              )}

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2">
                <div className="text-center p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-sm">
                  <p className="text-lg font-black text-blue-400">{chapters.length}</p>
                  <p className="text-[9px] text-[var(--color-text-muted)] uppercase font-bold">Chapter</p>
                </div>
                <div className="text-center p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-sm">
                  <p className="text-lg font-black truncate" style={{ color: typeColor }}>{comicType || "—"}</p>
                  <p className="text-[9px] text-[var(--color-text-muted)] uppercase font-bold">Tipe</p>
                </div>
                <div className="text-center p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-sm">
                  <p className="text-lg font-black text-yellow-400">{comic.rating || "—"}</p>
                  <p className="text-[9px] text-[var(--color-text-muted)] uppercase font-bold">Rating</p>
                </div>
              </div>

              {/* Alternative Titles */}
              {altTitle && (
                <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-sm">
                  <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Judul Alternatif</p>
                  <p className="text-[10px] text-[var(--color-text-secondary)] leading-relaxed">{altTitle}</p>
                </div>
              )}
            </aside>

            {/* Right Column: Title, Metadata, Synopsis, Chapters */}
            <div className="lg:col-span-8 xl:col-span-9 space-y-5">
              {/* Header Title Block */}
              <div className="p-6 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl space-y-4 shadow-sm">
                <h1 className="text-3xl font-black leading-tight text-[var(--color-text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
                  {comic.title}
                </h1>
                
                <div className="flex flex-wrap items-center gap-3 border-b border-[var(--color-border)] pb-4">
                  {comicType && (
                    <span
                      className="inline-block text-[10px] font-black px-2.5 py-0.5 rounded-full border shadow-sm"
                      style={{ backgroundColor: `${typeColor}20`, color: typeColor, borderColor: `${typeColor}30` }}
                    >
                      {comicType}
                    </span>
                  )}
                  {comic.rating && (
                    <div className="flex items-center gap-1">
                      <Star size={13} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-sm font-black text-yellow-400">{comic.rating}</span>
                      {comic.votes && <span className="text-[10px] text-[var(--color-text-muted)] font-medium">({comic.votes} rating)</span>}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-1">
                  {author && (
                    <div className="flex flex-col justify-center">
                      <span className="text-[9px] text-[var(--color-text-muted)] uppercase font-bold tracking-wider mb-0.5">Penulis</span>
                      <span className="text-xs font-bold text-[var(--color-text-primary)] truncate">{author}</span>
                    </div>
                  )}
                  {illustrator && illustrator !== author && (
                    <div className="flex flex-col justify-center">
                      <span className="text-[9px] text-[var(--color-text-muted)] uppercase font-bold tracking-wider mb-0.5">Ilustrator</span>
                      <span className="text-xs font-bold text-[var(--color-text-primary)] truncate">{illustrator}</span>
                    </div>
                  )}
                  {status && (
                    <div className="flex flex-col justify-center">
                      <span className="text-[9px] text-[var(--color-text-muted)] uppercase font-bold tracking-wider mb-0.5">Status</span>
                      <span className={cn(
                        "text-xs font-black",
                        status.includes("Berjalan") || status.includes("Ongoing") || status.includes("ongoing") ? "text-green-400" : "text-[var(--color-text-muted)]"
                      )}>
                        {status}
                      </span>
                    </div>
                  )}
                  {theme && (
                    <div className="flex flex-col justify-center">
                      <span className="text-[9px] text-[var(--color-text-muted)] uppercase font-bold tracking-wider mb-0.5">Tema</span>
                      <span className="text-xs font-bold text-[var(--color-text-primary)] truncate">{theme}</span>
                    </div>
                  )}
                </div>

                {/* Genres */}
                {comic.genres && comic.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[var(--color-border)]">
                    {comic.genres.map((g, i) => (
                      <span key={g.name + i} className="text-[10px] px-2.5 py-1 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-secondary)] font-bold shadow-sm">
                        {g.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Synopsis */}
              {synopsis && (
                <div className="p-5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl space-y-3 shadow-sm">
                  <div className="flex items-center gap-2 border-b border-[var(--color-border)] pb-2">
                    <Info size={14} className="text-blue-400" />
                    <h2 className="text-xs font-black uppercase tracking-wider text-[var(--color-text-muted)]">Sinopsis</h2>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line font-medium">{synopsis}</p>
                </div>
              )}

              {/* Chapter list container */}
              {chapters.length > 0 && (
                <div className="p-5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl space-y-4 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ListIcon size={15} className="text-blue-400" />
                      <h2 className="text-sm font-black">{chapters.length} Chapter Tersedia</h2>
                    </div>
                    <button
                      onClick={() => setChapterOrder(o => o === "newest" ? "oldest" : "newest")}
                      className="flex items-center gap-1.5 text-[10px] font-bold text-[var(--color-text-muted)] hover:text-blue-400 transition-colors px-2.5 py-1 rounded-lg border border-[var(--color-border)]"
                    >
                      <ArrowUpDown size={11} />
                      {chapterOrder === "newest" ? "Terbaru" : "Terlama"}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {displayedChapters.map((ch, i) => (
                      <Link key={ch.slug + i} href={`/manga/chapter/${encodeURIComponent(ch.slug)}`}>
                        <motion.div
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: Math.min(i * 0.01, 0.25) }}
                          className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group shadow-sm"
                        >
                          <div className="p-1.5 rounded-lg bg-blue-500/10 shrink-0">
                            <BookOpen size={13} className="text-blue-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold truncate group-hover:text-blue-400 transition-colors">
                              {ch.title}
                            </p>
                            {ch.releaseTime && (
                              <p className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-0.5 mt-0.5 font-medium">
                                <Clock size={9} className="shrink-0" />{ch.releaseTime}
                              </p>
                            )}
                          </div>
                          <ChevronRight size={14} className="text-[var(--color-text-muted)] group-hover:text-blue-400 shrink-0 transition-colors" />
                        </motion.div>
                      </Link>
                    ))}
                  </div>

                  {chapters.length > 30 && (
                    <button
                      onClick={() => setShowAllChapters(p => !p)}
                      className="w-full py-3 text-xs font-black text-blue-400 hover:text-blue-300 border border-[var(--color-border)] rounded-xl hover:bg-blue-500/5 transition-all mt-2"
                    >
                      {showAllChapters ? "Sembunyikan" : `Tampilkan semua ${chapters.length} chapter`}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* 📱 MOBILE LAYOUT (Visible on small screens, identical to mobile design) */}
          <div className="lg:hidden space-y-5">
            {/* Hero Section */}
            <div className="flex gap-4">
              <div className="w-32 h-44 rounded-2xl overflow-hidden bg-[var(--color-surface-2)] shrink-0 border border-[var(--color-border)] shadow-lg">
                {comic.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={comic.image}
                    alt={comic.title}
                    className="w-full h-full object-cover"
                    onError={e => { (e.target as HTMLImageElement).src = "/placeholder-manga.svg"; }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-[var(--color-surface-3)]">
                    <BookOpen size={32} className="text-[var(--color-text-muted)]" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0 space-y-2">
                <h1 className="text-lg font-black leading-tight" style={{ fontFamily: "var(--font-display)" }}>
                  {comic.title}
                </h1>

                {/* Type badge & rating */}
                <div className="flex items-center gap-2 flex-wrap">
                  {comicType && (
                    <span
                      className="inline-block text-[10px] font-black px-2.5 py-0.5 rounded-full border"
                      style={{ backgroundColor: `${typeColor}20`, color: typeColor, borderColor: `${typeColor}40` }}
                    >
                      {comicType}
                    </span>
                  )}
                  {comic.rating && (
                    <div className="flex items-center gap-0.5">
                      <Star size={11} className="text-yellow-400 fill-yellow-400" />
                      <span className="text-xs font-bold text-yellow-400">{comic.rating}</span>
                      {comic.votes && <span className="text-[9px] text-[var(--color-text-muted)] font-medium">({comic.votes})</span>}
                    </div>
                  )}
                </div>

                {/* Meta info */}
                <div className="space-y-1.5">
                  {author && (
                    <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] font-medium">
                      <User2 size={11} className="shrink-0 text-[var(--color-text-muted)]" />
                      <span className="truncate">{author}</span>
                    </div>
                  )}
                  {illustrator && illustrator !== author && (
                    <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] font-medium">
                      <Palette size={11} className="shrink-0 text-[var(--color-text-muted)]" />
                      <span className="truncate">{illustrator}</span>
                    </div>
                  )}
                  {status && (
                    <div className="flex items-center gap-1.5">
                      <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        status.includes("Berjalan") || status.includes("Ongoing") || status.includes("ongoing") ? "bg-green-400" : "bg-zinc-500"
                      }`} />
                      <span className={`text-xs font-bold ${
                        status.includes("Berjalan") || status.includes("Ongoing") || status.includes("ongoing") ? "text-green-400" : "text-[var(--color-text-muted)]"
                      }`}>
                        {status}
                      </span>
                    </div>
                  )}
                  {theme && (
                    <div className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] font-medium">
                      <Tag size={11} className="shrink-0 text-[var(--color-text-muted)]" />
                      <span className="truncate">{theme}</span>
                    </div>
                  )}
                </div>

                {/* Genres */}
                {comic.genres && comic.genres.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {comic.genres.map((g, i) => (
                      <span key={g.name + i} className="text-[9px] px-1.5 py-0.5 rounded-lg bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-secondary)] font-semibold">
                        {g.name}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Alternative Titles */}
            {altTitle && (
              <div className="p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-sm">
                <p className="text-[10px] font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-1">Judul Alternatif</p>
                <p className="text-[10px] text-[var(--color-text-secondary)] leading-relaxed font-medium">{altTitle}</p>
              </div>
            )}

            {/* Quick Actions */}
            {chapters.length > 0 && (
              <div className="flex gap-2">
                <Link href={`/manga/chapter/${encodeURIComponent(firstChapter?.slug || "")}`} className="flex-1">
                  <button className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-purple-500 text-white text-sm font-bold hover:shadow-lg hover:shadow-blue-500/30 transition-all">
                    <BookMarked size={16} /> Mulai Baca
                  </button>
                </Link>
                <Link href={`/manga/chapter/${encodeURIComponent(latestChapter?.slug || "")}`} className="flex-1">
                  <button className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-sm font-bold hover:border-blue-500/40 transition-colors text-[var(--color-text-primary)]">
                    <Play size={16} /> Ch. Terbaru
                  </button>
                </Link>
              </div>
            )}

            {/* Stats Card */}
            <div className="grid grid-cols-3 gap-2">
              <div className="text-center p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-sm">
                <p className="text-lg font-black text-blue-400">{chapters.length}</p>
                <p className="text-[9px] text-[var(--color-text-muted)] uppercase font-bold">Chapter</p>
              </div>
              <div className="text-center p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-sm">
                <p className="text-lg font-black truncate" style={{ color: typeColor }}>{comicType || "—"}</p>
                <p className="text-[9px] text-[var(--color-text-muted)] uppercase font-bold">Tipe</p>
              </div>
              <div className="text-center p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl shadow-sm">
                <p className="text-lg font-black text-yellow-400">{comic.rating || "—"}</p>
                <p className="text-[9px] text-[var(--color-text-muted)] uppercase font-bold">Rating</p>
              </div>
            </div>

            {/* Synopsis */}
            {synopsis && (
              <div className="p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl space-y-2 shadow-sm">
                <div className="flex items-center gap-2">
                  <Info size={14} className="text-blue-400" />
                  <h2 className="text-xs font-black uppercase tracking-wider text-[var(--color-text-muted)]">Sinopsis</h2>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed whitespace-pre-line font-medium">{synopsis}</p>
              </div>
            )}

            {/* Chapter List */}
            {chapters.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ListIcon size={15} className="text-blue-400" />
                    <h2 className="text-sm font-black">{chapters.length} Chapter</h2>
                  </div>
                  <button
                    onClick={() => setChapterOrder(o => o === "newest" ? "oldest" : "newest")}
                    className="flex items-center gap-1 text-[10px] font-bold text-[var(--color-text-muted)] hover:text-blue-400 transition-colors px-2 py-1 rounded-lg border border-[var(--color-border)]"
                  >
                    <ArrowUpDown size={11} />
                    {chapterOrder === "newest" ? "Terbaru" : "Terlama"}
                  </button>
                </div>

                <div className="space-y-1.5">
                  {displayedChapters.map((ch, i) => (
                    <Link key={ch.slug + i} href={`/manga/chapter/${encodeURIComponent(ch.slug)}`}>
                      <motion.div
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: Math.min(i * 0.015, 0.3) }}
                        className="flex items-center gap-3 p-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] hover:border-blue-500/30 hover:bg-blue-500/5 transition-all group shadow-sm"
                      >
                        <div className="p-1.5 rounded-lg bg-blue-500/10 shrink-0">
                          <BookOpen size={13} className="text-blue-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold truncate group-hover:text-blue-400 transition-colors">
                            {ch.title}
                          </p>
                          {ch.releaseTime && (
                            <p className="text-[10px] text-[var(--color-text-muted)] flex items-center gap-0.5 font-medium">
                              <Clock size={9} className="shrink-0" />{ch.releaseTime}
                            </p>
                          )}
                        </div>
                        <ChevronRight size={14} className="text-[var(--color-text-muted)] group-hover:text-blue-400 shrink-0 transition-colors" />
                      </motion.div>
                    </Link>
                  ))}
                </div>

                {chapters.length > 30 && (
                  <button
                    onClick={() => setShowAllChapters(p => !p)}
                    className="w-full py-3 text-xs font-bold text-blue-400 hover:text-blue-300 border border-[var(--color-border)] rounded-xl hover:bg-blue-500/5 transition-all"
                  >
                    {showAllChapters ? "Sembunyikan" : `Tampilkan semua ${chapters.length} chapter`}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      <BottomNavbar />
    </>
  );
}
