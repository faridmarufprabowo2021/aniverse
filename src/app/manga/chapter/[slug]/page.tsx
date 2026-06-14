"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft, ChevronRight, BookOpen, Loader2,
  AlertTriangle, List as ListIcon, Maximize2, Minimize2,
  Image as ImageIcon, Layers, RefreshCcw, Settings, ChevronDown
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNavbar } from "@/components/layout/BottomNavbar";
import { getChapter, getMangaDetail, proxyImageUrl, type ChapterData } from "@/lib/manga-api";
import { addToMangaHistory } from "@/lib/mangaHistory";

export default function MangaChapterPage() {
  const params = useParams();
  const router = useRouter();
  const slug = decodeURIComponent(params.slug as string);

  const [chapter, setChapter] = useState<ChapterData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [mode, setMode] = useState<"longstrip" | "paging">("longstrip");
  const [currentPage, setCurrentPage] = useState(0);
  const [showControls, setShowControls] = useState(true);

  // Premium Custom Settings States
  const [readerTheme, setReaderTheme] = useState<"black" | "dark" | "sepia" | "light">("black");
  const [imageFit, setImageFit] = useState<"width" | "height" | "original">("width");
  const [showSettings, setShowSettings] = useState(false);
  const [chaptersList, setChaptersList] = useState<{ title: string; slug: string }[]>([]);

  // Load preferences on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedTheme = localStorage.getItem("aniverse_manga_theme") as any;
      if (storedTheme && ["black", "dark", "sepia", "light"].includes(storedTheme)) {
        setReaderTheme(storedTheme);
      }
      const storedFit = localStorage.getItem("aniverse_manga_fit") as any;
      if (storedFit && ["width", "height", "original"].includes(storedFit)) {
        setImageFit(storedFit);
      }
    }
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(false);
      const data = await getChapter(slug);
      if (data && data.images.length > 0) {
        setChapter(data);
        
        // Fetch manga details for chapter list, cover image & genres
        const mangaSlug = data.navigation?.chapterList || slug.split("-chapter")[0] || slug;
        getMangaDetail(mangaSlug).then((mangaDetail) => {
          if (mangaDetail && mangaDetail.chapters) {
            setChaptersList(mangaDetail.chapters);
          }
          // Save to manga reading history with cover image
          addToMangaHistory({
            mangaSlug: mangaSlug,
            mangaTitle: data.manga_title || mangaDetail?.title || slug.replace(/-/g, " "),
            coverImage: mangaDetail?.image || "",
            lastChapterSlug: slug,
            lastChapterTitle: data.chapter_title || `Chapter ${slug.match(/chapter[- ]?(\d+)/i)?.[1] || "?"}`,
            totalPages: data.images.length,
            genres: mangaDetail?.genres?.map((g: any) => g.name) || [],
          });
        }).catch(() => {
          // Fallback if detail fetch fails
          addToMangaHistory({
            mangaSlug: mangaSlug,
            mangaTitle: data.manga_title || slug.replace(/-/g, " "),
            coverImage: "",
            lastChapterSlug: slug,
            lastChapterTitle: data.chapter_title || `Chapter ${slug.match(/chapter[- ]?(\d+)/i)?.[1] || "?"}`,
            totalPages: data.images.length,
          });
        });
      } else {
        setError(true);
      }
      setLoading(false);
    }
    load();
    setCurrentPage(0);
    window.scrollTo(0, 0);
  }, [slug]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") {
        if (mode === "paging") {
          setCurrentPage((p) => Math.min(chapter?.images?.length ? chapter.images.length - 1 : 0, p + 1));
        }
      } else if (e.key === "ArrowLeft") {
        if (mode === "paging") {
          setCurrentPage((p) => Math.max(0, p - 1));
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [mode, chapter?.images?.length]);

  const prevChSlug = chapter?.navigation?.previousChapter;
  const nextChSlug = chapter?.navigation?.nextChapter;
  const listSlug = chapter?.navigation?.chapterList;

  if (loading) return (
    <>
      <TopBar />
      <main className="pt-safe pb-safe min-h-screen flex flex-col items-center justify-center gap-3 bg-black">
        <Loader2 className="animate-spin text-blue-400" size={32} />
        <p className="text-sm text-zinc-400 animate-pulse">Memuat chapter...</p>
      </main>
      <BottomNavbar />
    </>
  );

  if (error || !chapter) return (
    <>
      <TopBar />
      <main className="pt-safe pb-safe min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center bg-black">
        <AlertTriangle size={40} className="text-yellow-500" />
        <p className="font-bold text-lg text-white">Gagal memuat chapter</p>
        <p className="text-sm text-zinc-400">Server mungkin sedang dalam perbaikan atau terblokir.</p>
        <div className="flex gap-3">
          <button onClick={() => window.location.reload()} className="text-sm text-blue-400 hover:underline flex items-center gap-1">
            <RefreshCcw size={14} /> Coba lagi
          </button>
          <button onClick={() => router.back()} className="text-sm text-zinc-400 hover:underline flex items-center gap-1">
            <ChevronLeft size={14} /> Kembali
          </button>
        </div>
      </main>
      <BottomNavbar />
    </>
  );

  return (
    <>
      <TopBar />
      <main className={`min-h-screen transition-colors duration-300 ${
        readerTheme === "black" ? "bg-black text-zinc-100" :
        readerTheme === "dark" ? "bg-zinc-950 text-zinc-200" :
        readerTheme === "sepia" ? "bg-[#f4ecd8] text-[#5b4636]" :
        "bg-zinc-50 text-zinc-900"
      }`}>
        {/* ── Header Bar ──────────────────────────── */}
        <div
          className={`fixed top-[env(safe-area-inset-top,0px)] left-0 right-0 z-30 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <div className="bg-black/90 backdrop-blur-md border-b border-white/10 px-4 py-3 shadow-lg">
            <div className="max-w-4xl mx-auto flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0 flex-1">
                <button onClick={() => router.back()} className="shrink-0 p-1.5 rounded-full hover:bg-white/10 text-white transition-colors">
                  <ChevronLeft size={18} />
                </button>
                <div className="min-w-0 flex-1">
                  {chapter.manga_title && (
                    <p className="text-[10px] text-zinc-400 truncate font-semibold uppercase tracking-wider">{chapter.manga_title}</p>
                  )}
                  {chaptersList.length > 0 ? (
                    <div className="relative inline-flex items-center max-w-full">
                      <select
                        value={slug}
                        onChange={(e) => router.push(`/manga/chapter/${encodeURIComponent(e.target.value)}`)}
                        className="text-xs font-bold text-white bg-transparent border border-white/20 rounded-lg py-1 pl-2.5 pr-8 appearance-none cursor-pointer focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 truncate max-w-[200px] sm:max-w-[320px]"
                      >
                        {chaptersList.map((ch) => (
                          <option key={ch.slug} value={ch.slug} className="bg-zinc-950 text-white text-xs">
                            {ch.title || ch.slug.replace(/-/g, " ")}
                          </option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-2.5 text-zinc-400 pointer-events-none" />
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-white truncate">
                      {chapter.chapter_title || slug.replace(/-/g, " ")}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2.5 shrink-0">
                {listSlug && (
                  <Link href={`/manga/${encodeURIComponent(listSlug)}`}>
                    <button className="p-1.5 rounded-full hover:bg-white/10 text-white transition-colors" title="Daftar Chapter">
                      <ListIcon size={16} />
                    </button>
                  </Link>
                )}
                
                {/* Toggle Reader Mode */}
                <button
                  onClick={() => setMode(m => m === "longstrip" ? "paging" : "longstrip")}
                  className="p-1.5 rounded-full hover:bg-white/10 text-white transition-colors"
                  title={mode === "longstrip" ? "Mode Halaman" : "Mode Long Strip"}
                >
                  {mode === "longstrip" ? <Layers size={16} /> : <ImageIcon size={16} />}
                </button>

                {/* Settings Toggle */}
                <button
                  onClick={() => setShowSettings(s => !s)}
                  className={`p-1.5 rounded-full hover:bg-white/10 transition-colors ${showSettings ? "bg-white/10 text-blue-400" : "text-white"}`}
                  title="Pengaturan"
                >
                  <Settings size={16} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Settings Panel ───────────────────────── */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="fixed top-16 right-4 sm:right-1/2 sm:translate-x-1/2 lg:right-4 lg:translate-x-0 z-40 w-72 rounded-2xl bg-zinc-950/95 backdrop-blur-md border border-white/10 p-4 shadow-xl text-white space-y-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <Settings size={14} className="text-blue-400 animate-spin-slow" /> Pengaturan Pembaca
                </span>
                <button
                  onClick={() => setShowSettings(false)}
                  className="text-zinc-400 hover:text-white text-[11px] font-medium"
                >
                  Tutup
                </button>
              </div>

              {/* Theme Selector */}
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Tema Latar Belakang</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(["black", "dark", "sepia", "light"] as const).map((t) => {
                    const themeNames = { black: "Hitam", dark: "Kelabu", sepia: "Sepia", light: "Terang" };
                    const themeColors = {
                      black: "bg-black border-zinc-800",
                      dark: "bg-zinc-900 border-zinc-700",
                      sepia: "bg-[#f4ecd8] border-[#dfd2be]",
                      light: "bg-zinc-100 border-zinc-300"
                    };
                    const isActive = readerTheme === t;
                    return (
                      <button
                        key={t}
                        onClick={() => {
                          setReaderTheme(t);
                          localStorage.setItem("aniverse_manga_theme", t);
                        }}
                        className={`h-9 rounded-xl border flex flex-col items-center justify-center text-[10px] font-bold transition-all ${themeColors[t]} ${
                          isActive ? "ring-2 ring-blue-500 scale-[1.03]" : "hover:opacity-85"
                        }`}
                        style={{ color: t === "sepia" ? "#5b4636" : t === "light" ? "#18181b" : "#f4f4f5" }}
                      >
                        {themeNames[t]}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Image Fit Selector */}
              <div className="space-y-1.5">
                <label className="text-[9px] uppercase tracking-wider text-zinc-400 font-bold">Ukuran Gambar (Fit)</label>
                <div className="grid grid-cols-3 gap-1.5">
                  {(["width", "height", "original"] as const).map((f) => {
                    const fitNames = { width: "Fit Width", height: "Fit Height", original: "Original" };
                    const isActive = imageFit === f;
                    return (
                      <button
                        key={f}
                        onClick={() => {
                          setImageFit(f);
                          localStorage.setItem("aniverse_manga_fit", f);
                        }}
                        className={`py-2 rounded-xl border text-[10px] font-bold transition-all text-center ${
                          isActive
                            ? "bg-blue-500 border-blue-400 text-white"
                            : "bg-zinc-900 border-white/10 text-zinc-300 hover:bg-zinc-850"
                        }`}
                      >
                        {fitNames[f]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Reader Area ─────────────────────────── */}
        <div
          className="pt-16 pb-24"
          onClick={() => {
            setShowControls(c => !c);
            if (showSettings) setShowSettings(false);
          }}
        >
          {mode === "longstrip" ? (
            <div className="max-w-3xl mx-auto flex flex-col">
              {chapter.images.map((img, i) => (
                <ChapterImage
                  key={i}
                  src={img}
                  index={i}
                  total={chapter.images.length}
                  imageFit={imageFit}
                  readerTheme={readerTheme}
                />
              ))}
            </div>
          ) : (
            <div className="max-w-3xl mx-auto flex items-center justify-center min-h-[75vh] relative px-4">
              <ChapterImage
                src={chapter.images[currentPage]}
                index={currentPage}
                total={chapter.images.length}
                imageFit={imageFit}
                readerTheme={readerTheme}
              />

              {/* Page navigation overlay */}
              <button
                onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.max(0, p - 1)); }}
                disabled={currentPage === 0}
                className="absolute left-0 top-0 bottom-0 w-1/4 flex items-center justify-start pl-4"
              >
                {currentPage > 0 && (
                  <div className="p-2 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-white hover:bg-black/80 transition-colors">
                    <ChevronLeft size={24} />
                  </div>
                )}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.min(chapter.images.length - 1, p + 1)); }}
                disabled={currentPage === chapter.images.length - 1}
                className="absolute right-0 top-0 bottom-0 w-1/4 flex items-center justify-end pr-4"
              >
                {currentPage < chapter.images.length - 1 && (
                  <div className="p-2 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 text-white hover:bg-black/80 transition-colors">
                    <ChevronRight size={24} />
                  </div>
                )}
              </button>
            </div>
          )}
        </div>

        {/* ── Bottom Navigation ───────────────────── */}
        <div
          className={`fixed bottom-0 left-0 right-0 z-30 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <div className="bg-black/90 backdrop-blur-md border-t border-white/10 px-4 py-3 shadow-lg">
            <div className="max-w-lg mx-auto space-y-2.5">
              {/* Page indicator (paging mode) */}
              {mode === "paging" && (
                <div className="flex items-center justify-center gap-3">
                  <span className="text-xs text-zinc-400 font-bold">
                    {currentPage + 1} / {chapter.images.length}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={chapter.images.length - 1}
                    value={currentPage}
                    onChange={e => setCurrentPage(Number(e.target.value))}
                    className="flex-1 accent-blue-500 max-w-44 h-1.5 rounded-lg bg-zinc-700 cursor-pointer"
                    onClick={e => e.stopPropagation()}
                  />
                </div>
              )}

              {/* Chapter nav buttons */}
              <div className="flex gap-2">
                {prevChSlug ? (
                  <Link href={`/manga/chapter/${encodeURIComponent(prevChSlug)}`} className="flex-1">
                    <button className="w-full py-2.5 rounded-xl bg-zinc-900 border border-white/10 text-xs font-bold flex items-center justify-center gap-1 text-white hover:bg-white/10 transition-colors">
                      <ChevronLeft size={14} /> Sebelumnya
                    </button>
                  </Link>
                ) : (
                  <button disabled className="flex-1 py-2.5 rounded-xl bg-white/5 text-xs font-bold text-zinc-650 flex items-center justify-center gap-1 cursor-not-allowed">
                    <ChevronLeft size={14} /> Awal
                  </button>
                )}

                {listSlug && (
                  <Link href={`/manga/${encodeURIComponent(listSlug)}`}>
                    <button className="py-2.5 px-4 rounded-xl bg-blue-500/20 border border-blue-500/30 text-xs font-bold text-blue-400 hover:bg-blue-500/30 transition-colors" title="Kembali ke Detail">
                      <ListIcon size={14} />
                    </button>
                  </Link>
                )}

                {nextChSlug ? (
                  <Link href={`/manga/chapter/${encodeURIComponent(nextChSlug)}`} className="flex-1">
                    <button className="w-full py-2.5 rounded-xl bg-blue-500 text-xs font-bold flex items-center justify-center gap-1 text-white hover:bg-blue-600 transition-colors">
                      Selanjutnya <ChevronRight size={14} />
                    </button>
                  </Link>
                ) : (
                  <button disabled className="flex-1 py-2.5 rounded-xl bg-white/5 text-xs font-bold text-zinc-650 flex items-center justify-center gap-1 cursor-not-allowed">
                    Akhir <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

function ChapterImage({
  src,
  index,
  total,
  imageFit,
  readerTheme
}: {
  src: string;
  index: number;
  total: number;
  imageFit: "width" | "height" | "original";
  readerTheme: "black" | "dark" | "sepia" | "light";
}) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const [retries, setRetries] = useState(0);

  const handleError = () => {
    if (retries < 2) {
      setRetries(r => r + 1);
    } else {
      setErrored(true);
    }
  };

  const proxied = proxyImageUrl(src);
  const imgSrc = retries > 0 ? `${proxied}${proxied.includes("?") ? "&" : "?"}retry=${retries}` : proxied;

  if (errored) {
    return (
      <div className={`w-full aspect-[2/3] max-w-md mx-auto flex flex-col items-center justify-center gap-2 border rounded-xl p-4 my-2 ${
        readerTheme === "sepia"
          ? "bg-[#efe6ce] border-[#dfd2be] text-[#5b4636]"
          : readerTheme === "light"
          ? "bg-zinc-100 border-zinc-200 text-zinc-700"
          : "bg-zinc-900 border-zinc-800 text-zinc-400"
      }`}>
        <ImageIcon size={24} />
        <p className="text-[10px] font-semibold">Halaman {index + 1} gagal dimuat</p>
        <button
          onClick={() => { setErrored(false); setRetries(0); }}
          className="text-[10px] text-blue-500 hover:underline flex items-center gap-1 font-bold"
        >
          <RefreshCcw size={10} /> Coba lagi
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full flex justify-center">
      {!loaded && (
        <div className={`absolute inset-0 flex flex-col items-center justify-center gap-2 min-h-[300px] ${
          readerTheme === "sepia" ? "bg-[#efe6ce]" :
          readerTheme === "light" ? "bg-zinc-200" :
          "bg-zinc-900/40"
        }`}>
          <Loader2 size={24} className={`animate-spin ${
            readerTheme === "sepia" ? "text-[#5b4636]" :
            readerTheme === "light" ? "text-zinc-500" :
            "text-blue-400"
          }`} />
          <p className="text-[10px] font-bold opacity-60">{index + 1}/{total}</p>
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgSrc}
        alt={`Page ${index + 1}`}
        className={`select-none transition-opacity duration-300 ${
          loaded ? 'opacity-100' : 'opacity-0'
        } ${
          imageFit === "width" ? "w-full h-auto block" :
          imageFit === "height" ? "h-[85vh] md:h-screen w-auto max-w-full object-contain mx-auto block" :
          "max-w-full h-auto mx-auto block"
        }`}
        loading={index < 3 ? "eager" : "lazy"}
        onLoad={() => setLoaded(true)}
        onError={handleError}
        draggable={false}
      />
    </div>
  );
}
