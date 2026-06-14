"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ChevronLeft, ChevronRight, BookOpen, Loader2,
  AlertTriangle, List as ListIcon, Maximize2, Minimize2,
  Image as ImageIcon, Layers, RefreshCcw
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

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(false);
      const data = await getChapter(slug);
      if (data && data.images.length > 0) {
        setChapter(data);
        
        // Fetch manga details for cover image & genres
        const mangaSlug = data.navigation?.chapterList || slug.split("-chapter")[0] || slug;
        getMangaDetail(mangaSlug).then((mangaDetail) => {
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

  const prevChSlug = chapter?.navigation?.previousChapter;
  const nextChSlug = chapter?.navigation?.nextChapter;
  const listSlug = chapter?.navigation?.chapterList;

  if (loading) return (
    <>
      <TopBar />
      <main className="pt-safe pb-safe min-h-screen flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-blue-400" size={32} />
        <p className="text-sm text-[var(--color-text-muted)]">Memuat chapter...</p>
      </main>
      <BottomNavbar />
    </>
  );

  if (error || !chapter) return (
    <>
      <TopBar />
      <main className="pt-safe pb-safe min-h-screen flex flex-col items-center justify-center gap-4 px-6 text-center">
        <AlertTriangle size={40} className="text-yellow-500" />
        <p className="font-bold text-lg">Gagal memuat chapter</p>
        <p className="text-sm text-[var(--color-text-muted)]">Server mungkin sedang dalam perbaikan</p>
        <div className="flex gap-3">
          <button onClick={() => window.location.reload()} className="text-sm text-blue-400 hover:underline flex items-center gap-1">
            <RefreshCcw size={14} /> Coba lagi
          </button>
          <button onClick={() => router.back()} className="text-sm text-[var(--color-text-muted)] hover:underline flex items-center gap-1">
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
      <main className="min-h-screen bg-black">
        {/* ── Header Bar ──────────────────────────── */}
        <div
          className={`fixed top-[env(safe-area-inset-top,0px)] left-0 right-0 z-30 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <div className="bg-black/80 backdrop-blur-md border-b border-white/10 px-4 py-3">
            <div className="max-w-lg mx-auto flex items-center gap-3">
              <button onClick={() => router.back()} className="shrink-0 p-1.5 rounded-full hover:bg-white/10 transition-colors">
                <ChevronLeft size={18} className="text-white" />
              </button>
              <div className="flex-1 min-w-0">
                {chapter.manga_title && (
                  <p className="text-[10px] text-zinc-400 truncate">{chapter.manga_title}</p>
                )}
                <p className="text-xs font-bold text-white truncate">
                  {chapter.chapter_title || slug.replace(/-/g, " ")}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {listSlug && (
                  <Link href={`/manga/${encodeURIComponent(listSlug)}`}>
                    <button className="p-1.5 rounded-full hover:bg-white/10 transition-colors" title="Daftar Chapter">
                      <ListIcon size={16} className="text-white" />
                    </button>
                  </Link>
                )}
                <button
                  onClick={() => setMode(m => m === "longstrip" ? "paging" : "longstrip")}
                  className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                  title={mode === "longstrip" ? "Mode Halaman" : "Mode Long Strip"}
                >
                  {mode === "longstrip" ? <Layers size={16} className="text-white" /> : <ImageIcon size={16} className="text-white" />}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ── Reader Area ─────────────────────────── */}
        <div
          className="pt-16 pb-24"
          onClick={() => setShowControls(c => !c)}
        >
          {mode === "longstrip" ? (
            <div className="max-w-3xl mx-auto">
              {chapter.images.map((img, i) => (
                <ChapterImage key={i} src={img} index={i} total={chapter.images.length} />
              ))}
            </div>
          ) : (
            <div className="max-w-3xl mx-auto flex items-center justify-center min-h-[70vh] relative">
              <ChapterImage src={chapter.images[currentPage]} index={currentPage} total={chapter.images.length} />

              {/* Page navigation overlay */}
              <button
                onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.max(0, p - 1)); }}
                disabled={currentPage === 0}
                className="absolute left-0 top-0 bottom-0 w-1/4 flex items-center justify-start pl-2"
              >
                {currentPage > 0 && <ChevronLeft size={28} className="text-white/40 hover:text-white transition-colors" />}
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); setCurrentPage(p => Math.min(chapter.images.length - 1, p + 1)); }}
                disabled={currentPage === chapter.images.length - 1}
                className="absolute right-0 top-0 bottom-0 w-1/4 flex items-center justify-end pr-2"
              >
                {currentPage < chapter.images.length - 1 && <ChevronRight size={28} className="text-white/40 hover:text-white transition-colors" />}
              </button>
            </div>
          )}
        </div>

        {/* ── Bottom Navigation ───────────────────── */}
        <div
          className={`fixed bottom-0 left-0 right-0 z-30 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        >
          <div className="bg-black/80 backdrop-blur-md border-t border-white/10 px-4 py-3">
            <div className="max-w-lg mx-auto space-y-2">
              {/* Page indicator (paging mode) */}
              {mode === "paging" && (
                <div className="flex items-center justify-center gap-2">
                  <span className="text-xs text-zinc-400">
                    {currentPage + 1} / {chapter.images.length}
                  </span>
                  <input
                    type="range"
                    min={0}
                    max={chapter.images.length - 1}
                    value={currentPage}
                    onChange={e => setCurrentPage(Number(e.target.value))}
                    className="flex-1 accent-blue-400 max-w-40"
                    onClick={e => e.stopPropagation()}
                  />
                </div>
              )}

              {/* Chapter nav buttons */}
              <div className="flex gap-2">
                {prevChSlug ? (
                  <Link href={`/manga/chapter/${encodeURIComponent(prevChSlug)}`} className="flex-1">
                    <button className="w-full py-2.5 rounded-xl bg-[var(--color-surface)] border border-white/10 text-xs font-bold flex items-center justify-center gap-1 text-white hover:bg-white/10 transition-colors">
                      <ChevronLeft size={14} /> Sebelumnya
                    </button>
                  </Link>
                ) : (
                  <button disabled className="flex-1 py-2.5 rounded-xl bg-white/5 text-xs font-bold text-zinc-600 flex items-center justify-center gap-1 cursor-not-allowed">
                    <ChevronLeft size={14} /> Awal
                  </button>
                )}

                {listSlug && (
                  <Link href={`/manga/${encodeURIComponent(listSlug)}`}>
                    <button className="py-2.5 px-4 rounded-xl bg-blue-500/20 border border-blue-500/30 text-xs font-bold text-blue-400 hover:bg-blue-500/30 transition-colors">
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
                  <button disabled className="flex-1 py-2.5 rounded-xl bg-white/5 text-xs font-bold text-zinc-600 flex items-center justify-center gap-1 cursor-not-allowed">
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

function ChapterImage({ src, index, total }: { src: string; index: number; total: number }) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);
  const [retries, setRetries] = useState(0);

  const handleError = () => {
    if (retries < 2) {
      // Retry with cache-busting
      setRetries(r => r + 1);
    } else {
      setErrored(true);
    }
  };

  // Proxy all manga images through server-side to bypass CDN hotlink protection
  const proxied = proxyImageUrl(src);
  const imgSrc = retries > 0 ? `${proxied}${proxied.includes("?") ? "&" : "?"}retry=${retries}` : proxied;

  if (errored) {
    return (
      <div className="w-full aspect-[2/3] flex flex-col items-center justify-center gap-2 bg-zinc-900 border border-zinc-800">
        <ImageIcon size={24} className="text-zinc-600" />
        <p className="text-[10px] text-zinc-500">Halaman {index + 1} gagal dimuat</p>
        <button
          onClick={() => { setErrored(false); setRetries(0); }}
          className="text-[10px] text-blue-400 hover:underline flex items-center gap-1"
        >
          <RefreshCcw size={10} /> Coba lagi
        </button>
      </div>
    );
  }

  return (
    <div className="relative w-full">
      {!loaded && (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-zinc-900/50 min-h-[200px]">
          <Loader2 size={20} className="animate-spin text-zinc-600" />
          <p className="text-[9px] text-zinc-600">{index + 1}/{total}</p>
        </div>
      )}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imgSrc}
        alt={`Page ${index + 1}`}
        className={`w-full h-auto block select-none transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        loading={index < 3 ? "eager" : "lazy"}
        onLoad={() => setLoaded(true)}
        onError={handleError}
        draggable={false}
      />
    </div>
  );
}
