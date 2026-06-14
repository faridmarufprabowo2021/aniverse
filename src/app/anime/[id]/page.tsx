"use client";

import { useState, useEffect } from "react";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Star, Plus, Heart, Share2, ExternalLink,
  ChevronRight, Tv, Film, Clock, Calendar, Users, BookOpen,
} from "lucide-react";
import type { AnimeDetail } from "@/types/anime";
import {
  getBestTitle, getCoverImage, formatScore, getScoreColor,
  formatStatus, formatAnimeType, formatSeason, formatDuration,
  formatDate, formatNumber, formatCountdown, formatSource,
} from "@/lib/utils";
import { ScoreRing } from "@/components/anime/ScoreRing";
import { EpisodeList } from "@/components/anime/EpisodeList";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Skeleton } from "@/components/ui/Skeleton";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNavbar } from "@/components/layout/BottomNavbar";
import { containerVariants, itemVariants } from "@/lib/animations";
import { getCurrentUser } from "@/lib/auth";
import { AddToListModal } from "@/components/anime/AddToListModal";

// ═══════════════════════════════════════
// Sub-components
// ═══════════════════════════════════════

function Synopsis({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const [translated, setTranslated] = useState<string | null>(null);
  const [translating, setTranslating] = useState(false);
  const [showTranslated, setShowTranslated] = useState(false);

  const cleaned = text.replace(/<[^>]*>/g, "").replace(/\n{3,}/g, "\n\n");
  const displayText = showTranslated && translated ? translated : cleaned;
  const short = displayText.slice(0, 300);
  const isLong = displayText.length > 300;

  const handleTranslate = async () => {
    if (translated) {
      setShowTranslated(!showTranslated);
      return;
    }
    setTranslating(true);
    try {
      const res = await fetch(`/api/translate?text=${encodeURIComponent(cleaned)}&from=en&to=id`);
      const data = await res.json();
      if (data.translatedText) {
        setTranslated(data.translatedText);
        setShowTranslated(true);
      }
    } catch {
      // Translation failed silently
    }
    setTranslating(false);
  };

  return (
    <div>
      <p className="text-sm leading-relaxed text-[var(--color-text-secondary)] whitespace-pre-line">
        {expanded ? displayText : isLong ? `${short}…` : displayText}
      </p>
      <div className="flex items-center gap-3 mt-2">
        {isLong && (
          <button onClick={() => setExpanded(e => !e)}
            className="text-xs font-semibold text-[var(--color-primary)] hover:underline">
            {expanded ? "Sembunyikan" : "Selengkapnya"}
          </button>
        )}
        <button
          onClick={handleTranslate}
          disabled={translating}
          className="flex items-center gap-1 text-xs font-semibold text-blue-400 hover:text-blue-300 transition-colors disabled:opacity-50"
        >
          {translating ? (
            <><span className="w-3 h-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" /> Menerjemahkan...</>
          ) : showTranslated ? (
            "🌐 Tampilkan Asli"
          ) : (
            "🌐 Terjemahkan ke ID"
          )}
        </button>
      </div>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value?: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[10px] text-[var(--color-text-muted)] uppercase tracking-wider font-semibold">{label}</span>
      <span className="text-sm font-medium text-[var(--color-text-primary)]">{value}</span>
    </div>
  );
}

function ScoreBar({ score, amount, max }: { score: number; amount: number; max: number }) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <span className="w-3 text-right text-[var(--color-text-muted)] shrink-0">{score}</span>
      <div className="flex-1 h-2 bg-[var(--color-surface-3)] rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(amount / max) * 100}%` }}
          transition={{ duration: 0.8, delay: (10 - score) * 0.05 }}
          className="h-full rounded-full"
          style={{ background: getScoreColor(score) }}
        />
      </div>
      <span className="w-10 text-[var(--color-text-muted)] shrink-0">{formatNumber(amount)}</span>
    </div>
  );
}

// ─── Karakter + Seiyu Card ───────────────────────────────
function CharacterCard({ char }: { char: NonNullable<AnimeDetail["characters"]>[0] }) {
  return (
    <div className="shrink-0 w-[140px] glass rounded-xl overflow-hidden border border-[var(--color-border)]">
      {/* Character */}
      <div className="flex gap-2 p-2">
        <div className="w-12 h-12 rounded-lg overflow-hidden bg-[var(--color-surface-2)] relative shrink-0">
          {char.image?.medium
            ? <Image src={char.image.medium} alt={char.name.full} fill className="object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-xl">👤</div>}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold line-clamp-2 text-[var(--color-text-primary)]">{char.name.full}</p>
          <p className="text-[10px] text-[var(--color-primary)] capitalize mt-0.5">
            {char.role === "MAIN" ? "Utama" : char.role === "SUPPORTING" ? "Pendukung" : "Latar"}
          </p>
        </div>
      </div>

      {/* Voice Actor */}
      {char.voiceActor && (
        <div className="flex gap-2 p-2 pt-0 border-t border-[var(--color-border)] mt-1">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-[var(--color-surface-2)] relative shrink-0">
            {char.voiceActor.image?.medium
              ? <Image src={char.voiceActor.image.medium} alt={char.voiceActor.name.full} fill className="object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-sm">🎙️</div>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-medium line-clamp-2 text-[var(--color-text-secondary)]">
              {char.voiceActor.name.full}
            </p>
            {char.voiceActor.name.native && (
              <p className="text-[9px] text-[var(--color-text-muted)] mt-0.5" style={{ fontFamily: "var(--font-jp)" }}>
                {char.voiceActor.name.native}
              </p>
            )}
            <p className="text-[9px] text-[var(--color-text-muted)]">CV</p>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Studio Section ──────────────────────────────────────
function StudioSection({ studioId, studioName }: { studioId?: number; studioName: string }) {
  const [studioAnime, setStudioAnime] = useState<{id: number; title: {romaji: string}; coverImage: {large?: string}; averageScore?: number}[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!studioId) { setLoading(false); return; }
    fetch(`/api/studio/${studioId}?perPage=12`)
      .then(r => r.json())
      .then(data => { setStudioAnime(data.anime?.slice(0, 10) ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [studioId]);

  if (!studioId) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold" style={{ fontFamily: "var(--font-display)" }}>
          🏢 Studio: {studioName}
        </h2>
        <Link href={`/studio/${studioId}`} className="text-xs text-[var(--color-primary)] flex items-center gap-0.5 font-semibold">
          Lihat Semua <ChevronRight size={12} />
        </Link>
      </div>
      <p className="text-xs text-[var(--color-text-muted)]">Anime lain dari studio ini:</p>
      {loading ? (
        <div className="scroll-x flex gap-3 pb-2">
          {Array.from({length: 5}).map((_, i) => (
            <div key={i} className="shrink-0"><Skeleton width={80} height={120} rounded="sm" /></div>
          ))}
        </div>
      ) : (
        <div className="scroll-x flex gap-3 pb-2">
          {studioAnime.map(a => (
            <Link key={a.id} href={`/anime/${a.id}`}>
              <div className="shrink-0 w-20 space-y-1 group">
                <div className="relative rounded-lg overflow-hidden bg-[var(--color-surface-2)]" style={{width: 80, aspectRatio: "2/3"}}>
                  {a.coverImage.large && (
                    <Image src={a.coverImage.large} alt={a.title.romaji} fill className="object-cover group-hover:scale-105 transition-transform" sizes="80px" />
                  )}
                  {a.averageScore && (
                    <div className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-bold"
                      style={{ background: "rgba(0,0,0,0.7)", color: getScoreColor(a.averageScore) }}>
                      ⭐ {formatScore(a.averageScore)}
                    </div>
                  )}
                </div>
                <p className="text-[10px] line-clamp-2 text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-colors">
                  {a.title.romaji}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Manga Source Card ───────────────────────────────────
function MangaSourceCard({ animeTitle, titleEnglish }: { animeTitle: string; titleEnglish?: string | null }) {
  const [mangaResult, setMangaResult] = useState<{ title: string; slug: string; thumbnail?: string; type?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function search() {
      try {
        // Try romaji title first, then english
        for (const q of [animeTitle, titleEnglish].filter(Boolean)) {
          const res = await fetch(`https://www.sankavollerei.web.id/comic/search?q=${encodeURIComponent(q!)}`);
          if (!res.ok) continue;
          const json = await res.json();
          const results = json?.data ?? [];
          if (Array.isArray(results) && results.length > 0) {
            setMangaResult(results[0]);
            break;
          }
        }
      } catch { /* silent */ }
      setLoading(false);
    }
    search();
  }, [animeTitle, titleEnglish]);

  if (loading || !mangaResult) return null;

  return (
    <Link href={`/manga/${encodeURIComponent(mangaResult.slug)}`}>
      <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-500/10 via-purple-500/5 to-transparent border border-blue-500/20 rounded-2xl hover:border-blue-500/40 transition-all group cursor-pointer">
        {mangaResult.thumbnail && (
          <div className="w-12 h-16 rounded-lg overflow-hidden shrink-0 bg-[var(--color-surface-2)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mangaResult.thumbnail} alt={mangaResult.title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-0.5">
            <BookOpen size={13} className="text-blue-400 shrink-0" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Baca Manga Sumber</span>
          </div>
          <p className="text-sm font-bold truncate group-hover:text-blue-400 transition-colors">{mangaResult.title}</p>
          {mangaResult.type && (
            <span className="text-[9px] text-[var(--color-text-muted)]">{mangaResult.type}</span>
          )}
        </div>
        <ChevronRight size={16} className="text-[var(--color-text-muted)] group-hover:text-blue-400 transition-colors shrink-0" />
      </div>
    </Link>
  );
}

// ═══════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════
interface PageProps { params: Promise<{ id: string }> }

export default function AnimeDetailPage({ params }: PageProps) {
  const [anime, setAnime] = useState<AnimeDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundFlag, setNotFoundFlag] = useState(false);
  const [resolvedId, setResolvedId] = useState<string | null>(null);
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [user, setUser] = useState<{ id: string } | null>(null);

  useEffect(() => { params.then(({ id }) => setResolvedId(id)); }, [params]);

  // Fetch current user
  useEffect(() => {
    getCurrentUser().then(u => {
      if (u) setUser({ id: u.id });
    });
  }, []);

  useEffect(() => {
    if (!resolvedId) return;
    setLoading(true);
    fetch(`/api/anime/${resolvedId}`)
      .then(r => { if (r.status === 404) { setNotFoundFlag(true); return null; } return r.json(); })
      .then(data => { if (data) setAnime(data); setLoading(false); })
      .catch(() => { setLoading(false); setNotFoundFlag(true); });
  }, [resolvedId]);

  if (notFoundFlag) notFound();

  const title = anime ? getBestTitle(anime.title) : "Memuat…";
  const banner = anime?.bannerImage ?? (anime ? getCoverImage(anime.coverImage) : "");
  const cover = anime ? getCoverImage(anime.coverImage) : "";
  const mainStudio = anime?.studios?.[0];

  if (loading) {
    return (
      <>
        <TopBar />
        <main className="pb-safe pt-safe">
          <Skeleton className="w-full" style={{ height: 220 }} rounded="lg" />
          <div className="px-4 mt-4 space-y-4">
            <Skeleton height={28} className="w-3/4" />
            <Skeleton height={80} className="w-full" />
          </div>
        </main>
        <BottomNavbar />
      </>
    );
  }

  if (!anime) return null;

  return (
    <>
      <TopBar />
      <main className="pb-safe">

        {/* Banner */}
        <div className="relative w-full" style={{ height: 250 }}>
          {banner && <Image src={banner} alt={title} fill priority className="object-cover" sizes="100vw" />}
          <div className="absolute inset-0 gradient-bottom" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 to-transparent" />
        </div>

        <motion.div
          variants={containerVariants} initial="hidden" animate="show"
          className="px-4 md:px-8 max-w-7xl mx-auto w-full pb-10 -mt-28 relative z-10 space-y-6"
        >
          {/* Main Grid/Flex Container */}
          <div className="flex flex-col md:flex-row gap-6 lg:gap-10 items-start">
            
            {/* COLUMN 1: LEFT SIDEBAR (Desktop: 288px width, Mobile: full width) */}
            <div className="w-full md:w-72 shrink-0 space-y-6">
              
              {/* Cover Card and Titles for Mobile */}
              <div className="flex gap-4 items-end md:items-start md:flex-col">
                <div className="relative shrink-0 rounded-2xl overflow-hidden border-2 border-[var(--color-border)] shadow-2xl w-[110px] md:w-full aspect-[2/3]">
                  <Image src={cover} alt={title} fill className="object-cover" sizes="(max-width: 768px) 110px, 288px" />
                </div>
                
                {/* Titles for Mobile (hidden on Desktop) */}
                <div className="flex-1 min-w-0 pb-1 md:hidden">
                  {anime.title.native && (
                    <p className="text-xs text-[var(--color-text-muted)] mb-1" style={{ fontFamily: "var(--font-jp)" }}>{anime.title.native}</p>
                  )}
                  <h1 className="text-xl font-black leading-tight">{title}</h1>
                  {anime.title.english && anime.title.english !== title && (
                    <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{anime.title.english}</p>
                  )}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <Badge variant="status" statusClass={anime.status === "RELEASING" ? "badge-airing" : anime.status === "NOT_YET_RELEASED" ? "badge-upcoming" : anime.status === "CANCELLED" ? "badge-dropped" : "badge-finished"}>
                      {formatStatus(anime.status)}
                    </Badge>
                    {anime.format && <Badge>{formatAnimeType(anime.format)}</Badge>}
                  </div>
                </div>
              </div>

              {/* Action Buttons (CTA) */}
              <div className="flex gap-2">
                <Button 
                   icon={<Plus size={16} />} 
                   fullWidth
                   onClick={() => {
                     if (!user) {
                       window.location.href = `/login?redirect=/anime/${anime.id}`;
                     } else {
                       setIsModalOpen(true);
                     }
                   }}
                >
                   Tambah ke Daftar
                </Button>
                <Button variant="outline" size="md" icon={<Heart size={16} />} />
                <Button variant="outline" size="md" icon={<Share2 size={16} />} />
              </div>

              {/* Score & Stats Card */}
              <div className="flex items-center gap-4 p-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)]">
                <ScoreRing score={anime.averageScore} size={72} />
                <div className="flex-1 grid grid-cols-2 gap-3">
                  <div className="text-center">
                    <div className="text-sm font-black text-[var(--color-text-primary)]">
                      #{anime.rankings?.find(r => r.type === "RATED" && r.allTime)?.rank ?? "—"}
                    </div>
                    <div className="text-[9px] text-[var(--color-text-muted)]">Peringkat</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-black text-[var(--color-text-primary)]">
                      {formatNumber(anime.popularity)}
                    </div>
                    <div className="text-[9px] text-[var(--color-text-muted)]">Pengguna</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-black text-[var(--color-text-primary)]">
                      {formatNumber(anime.favourites)}
                    </div>
                    <div className="text-[9px] text-[var(--color-text-muted)]">Favorit</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm font-black" style={{ color: "var(--color-accent-3)" }}>
                      #{anime.rankings?.find(r => r.type === "POPULAR" && r.allTime)?.rank ?? "—"}
                    </div>
                    <div className="text-[9px] text-[var(--color-text-muted)]">Popularitas</div>
                  </div>
                </div>
              </div>

              {/* Genre Tags (Desktop) */}
              <div className="hidden md:flex flex-wrap gap-2">
                {anime.genres.map(g => (
                  <Link key={g} href={`/search?genre=${encodeURIComponent(g)}`}>
                    <Badge variant="genre" genre={g} />
                  </Link>
                ))}
              </div>

              {/* Info Grid Card (Desktop) */}
              <div className="hidden md:grid grid-cols-2 gap-x-4 gap-y-4 p-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)]">
                <InfoRow label="Format" value={anime.format ? formatAnimeType(anime.format) : undefined} />
                <InfoRow label="Episode" value={anime.episodes ? `${anime.episodes} ep` : undefined} />
                <InfoRow label="Durasi" value={formatDuration(anime.duration)} />
                <InfoRow label="Musim" value={anime.season ? formatSeason(anime.season, anime.year) : anime.year?.toString()} />
                <InfoRow label="Sumber" value={formatSource(anime.sourceMaterial)} />
                <InfoRow label="Studio" value={mainStudio?.name} />
                <InfoRow label="Tayang" value={formatDate(anime.airedFrom)} />
                <InfoRow label="Selesai" value={formatDate(anime.airedTo)} />
              </div>

            </div>

            {/* COLUMN 2: RIGHT PANEL (Desktop: 2/3 width) */}
            <div className="flex-1 w-full space-y-6">
              
              {/* Header Title (Desktop Only) */}
              <div className="hidden md:block pb-4 border-b border-[var(--color-border)]">
                {anime.title.native && (
                  <p className="text-sm text-[var(--color-text-muted)] mb-1.5" style={{ fontFamily: "var(--font-jp)" }}>{anime.title.native}</p>
                )}
                <h1 className="text-3xl lg:text-4xl font-black leading-tight" style={{ fontFamily: "var(--font-display)" }}>{title}</h1>
                {anime.title.english && anime.title.english !== title && (
                  <p className="text-sm text-[var(--color-text-muted)] mt-1">{anime.title.english}</p>
                )}
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <Badge variant="status" statusClass={anime.status === "RELEASING" ? "badge-airing" : anime.status === "NOT_YET_RELEASED" ? "badge-upcoming" : anime.status === "CANCELLED" ? "badge-dropped" : "badge-finished"}>
                    {formatStatus(anime.status)}
                  </Badge>
                  {anime.format && <Badge>{formatAnimeType(anime.format)}</Badge>}
                  {anime.nextAiringEpisode && (
                    <span className="text-sm text-[var(--color-accent-2)] font-semibold">
                      · Tayang Episode {anime.nextAiringEpisode.episode} dalam {formatCountdown(anime.nextAiringEpisode.timeUntilAiring)}
                    </span>
                  )}
                </div>
              </div>

              {/* Genre Tags for Mobile Only */}
              <div className="flex flex-wrap gap-2 md:hidden">
                {anime.genres.map(g => (
                  <Link key={g} href={`/search?genre=${encodeURIComponent(g)}`}>
                    <Badge variant="genre" genre={g} />
                  </Link>
                ))}
              </div>

              {/* Sinopsis */}
              {anime.synopsis && (
                <div className="space-y-2 bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)]">
                  <h2 className="text-base font-bold flex items-center gap-1.5">📖 Sinopsis</h2>
                  <Synopsis text={anime.synopsis} />
                </div>
              )}

              {/* ══════ STREAMING: Tonton Sekarang ══════ */}
              <EpisodeList
                animeId={anime.id}
                animeTitle={anime.title.romaji} 
                titleEnglish={anime.title.english || undefined}
                coverImage={cover}
                totalEpisodes={anime.episodes}
              />

              {/* Info Grid Card for Mobile Only */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-4 p-4 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] md:hidden">
                <InfoRow label="Format" value={anime.format ? formatAnimeType(anime.format) : undefined} />
                <InfoRow label="Episode" value={anime.episodes ? `${anime.episodes} ep` : undefined} />
                <InfoRow label="Durasi" value={formatDuration(anime.duration)} />
                <InfoRow label="Musim" value={anime.season ? formatSeason(anime.season, anime.year) : anime.year?.toString()} />
                <InfoRow label="Sumber" value={formatSource(anime.sourceMaterial)} />
                <InfoRow label="Studio" value={mainStudio?.name} />
                <InfoRow label="Tayang" value={formatDate(anime.airedFrom)} />
                <InfoRow label="Selesai" value={formatDate(anime.airedTo)} />
              </div>

              {/* Manga Source Link */}
              {(anime.sourceMaterial === "MANGA" || anime.sourceMaterial === "NOVEL") && (
                <MangaSourceCard animeTitle={anime.title.romaji} titleEnglish={anime.title.english} />
              )}

              {/* Trailer */}
              {anime.trailerUrl && (
                <div className="space-y-3 bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)]">
                  <h2 className="text-base font-bold">🎬 Trailer Resmi</h2>
                  <div className="relative rounded-2xl overflow-hidden bg-black" style={{ aspectRatio: "16/9" }}>
                    <iframe
                      src={`${anime.trailerUrl}?mute=1&controls=1`}
                      title={`${title} Trailer`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full"
                    />
                  </div>
                </div>
              )}

              {/* Karakter & Seiyu */}
              {anime.characters && anime.characters.length > 0 && (
                <div className="space-y-3 bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)]">
                  <h2 className="text-base font-bold">🎭 Karakter & Pengisi Suara</h2>
                  <div className="scroll-x flex gap-3 pb-2">
                    {anime.characters.slice(0, 20).map(c => (
                      <CharacterCard key={c.id} char={c} />
                    ))}
                  </div>
                </div>
              )}

              {/* Studio + Anime dari Studio */}
              {mainStudio && (
                <StudioSection studioId={mainStudio.id} studioName={mainStudio.name} />
              )}

              {/* Tags */}
              {anime.tags && anime.tags.length > 0 && (
                <div className="space-y-3 bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)]">
                  <h2 className="text-base font-bold">🏷️ Tag</h2>
                  <div className="flex flex-wrap gap-2">
                    {anime.tags
                      .filter(t => !t.isMediaSpoiler)
                      .slice(0, 20)
                      .map(t => (
                        <span key={t.name}
                          className="px-2.5 py-1 rounded-full text-xs font-medium bg-[var(--color-surface-2)] border border-[var(--color-border)] text-[var(--color-text-secondary)]">
                          {t.name}
                          {t.rank && <span className="text-[var(--color-text-muted)] ml-1">{t.rank}%</span>}
                        </span>
                      ))}
                  </div>
                </div>
              )}

              {/* Distribusi Skor */}
              {anime.scoreDistribution && anime.scoreDistribution.length > 0 && (
                <div className="space-y-3 p-5 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)]">
                  <h2 className="text-base font-bold">📊 Distribusi Skor</h2>
                  <div className="space-y-1.5">
                    {[10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(score => {
                      const d = anime.scoreDistribution!.find(x => x.score === score);
                      const max = Math.max(...anime.scoreDistribution!.map(x => x.amount), 1);
                      return <ScoreBar key={score} score={score} amount={d?.amount ?? 0} max={max} />;
                    })}
                  </div>
                </div>
              )}

              {/* Relasi */}
              {anime.relations && anime.relations.length > 0 && (
                <div className="space-y-3 bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)]">
                  <h2 className="text-base font-bold">🔗 Anime Terkait</h2>
                  <div className="scroll-x flex gap-3 pb-2">
                    {anime.relations.filter(r => r.type === "ANIME").slice(0, 10).map(rel => (
                      <Link key={rel.id} href={`/anime/${rel.id}`}>
                        <div className="shrink-0 w-24 space-y-1.5 group">
                          <div className="relative rounded-lg overflow-hidden bg-[var(--color-surface-2)]" style={{ width: 96, aspectRatio: "2/3" }}>
                            {rel.coverImage?.medium && (
                              <Image src={rel.coverImage.medium} alt={getBestTitle(rel.title)} fill
                                className="object-cover group-hover:scale-105 transition-transform" sizes="96px" />
                            )}
                          </div>
                          <p className="text-[10px] font-medium line-clamp-2 text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-colors">
                            {getBestTitle(rel.title)}
                          </p>
                          <p className="text-[9px] text-[var(--color-text-muted)] capitalize">
                            {rel.relationType?.replace(/_/g, " ").toLowerCase()}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Rekomendasi */}
              {anime.recommendations && anime.recommendations.length > 0 && (
                <div className="space-y-3 bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)]">
                  <h2 className="text-base font-bold">💡 Rekomendasi</h2>
                  <div className="scroll-x flex gap-3 pb-2">
                    {anime.recommendations.slice(0, 10).map(rec => (
                      <Link key={rec.id} href={`/anime/${rec.id}`}>
                        <div className="shrink-0 w-24 space-y-1.5 group">
                          <div className="relative rounded-lg overflow-hidden bg-[var(--color-surface-2)]" style={{ width: 96, aspectRatio: "2/3" }}>
                            {rec.coverImage?.medium && (
                              <Image src={rec.coverImage.medium} alt={getBestTitle(rec.title)} fill
                                className="object-cover group-hover:scale-105 transition-transform" sizes="96px" />
                            )}
                          </div>
                          <p className="text-[10px] font-medium line-clamp-2 text-[var(--color-text-muted)] group-hover:text-[var(--color-primary)] transition-colors">
                            {getBestTitle(rec.title)}
                          </p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              {/* Tempat Nonton */}
              {anime.externalLinks && anime.externalLinks.length > 0 && (
                <div className="space-y-3 bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)]">
                  <h2 className="text-base font-bold">📺 Tempat Nonton</h2>
                  <div className="flex flex-wrap gap-2">
                    {anime.externalLinks.slice(0, 10).map((link, i) => (
                      <a key={i} href={link.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-2 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-xl text-xs font-medium hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] transition-colors">
                        <ExternalLink size={12} />
                        {link.site}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Reviews dari AniList */}
              {anime.reviews && anime.reviews.length > 0 && (
                <div className="space-y-3 bg-[var(--color-surface)] p-5 rounded-2xl border border-[var(--color-border)]">
                  <h2 className="text-base font-bold">💬 Ulasan Komunitas</h2>
                  <div className="space-y-3">
                    {anime.reviews.slice(0, 5).map(review => (
                      <div key={review.id} className="p-4 bg-[var(--color-surface-2)] rounded-2xl border border-[var(--color-border)]">
                        <div className="flex items-center gap-3 mb-2">
                          {review.user?.avatar ? (
                            <div className="relative w-8 h-8 rounded-full overflow-hidden shrink-0">
                              <Image src={review.user.avatar} alt={review.user.name ?? ""} fill className="object-cover" />
                            </div>
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-[var(--color-surface-3)] flex items-center justify-center text-xs font-bold">
                              {review.user?.name?.[0]?.toUpperCase() ?? "?"}
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold">{review.user?.name ?? "Anonim"}</p>
                            {review.score && (
                              <div className="flex items-center gap-1 mt-0.5">
                                <Star size={10} fill={getScoreColor(review.score)} color={getScoreColor(review.score)} />
                                <span className="text-[10px] font-bold" style={{ color: getScoreColor(review.score) }}>{review.score}/10</span>
                              </div>
                            )}
                          </div>
                        </div>
                        {review.summary && <p className="text-xs text-[var(--color-text-secondary)] line-clamp-3">{review.summary}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>

          </div>
        </motion.div>
      </main>
      <BottomNavbar />

      {/* Add To List Modal */}
      <AddToListModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        anime={anime}
        userId={user?.id || ""}
      />
    </>
  );
}
