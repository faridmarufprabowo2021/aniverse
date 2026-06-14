"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Loader2, RefreshCcw, BookOpen, Tv,
  Brain, Zap, ChevronRight, ArrowLeft, Heart, Star, Award
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNavbar } from "@/components/layout/BottomNavbar";
import { containerVariants, itemVariants } from "@/lib/animations";

interface UserContext {
  watchHistory?: any[];
  favorites?: any[];
  mangaHistory?: any[];
}

function getUserContext(): UserContext {
  if (typeof window === "undefined") return {};
  const ctx: UserContext = {};

  try {
    const raw = localStorage.getItem("aniverse_watch_history");
    if (raw) ctx.watchHistory = JSON.parse(raw).slice(0, 25);
  } catch {}

  try {
    const raw = localStorage.getItem("aniverse_my_list");
    if (raw) ctx.favorites = JSON.parse(raw).slice(0, 15);
  } catch {}

  try {
    const raw = localStorage.getItem("aniverse_manga_history");
    if (raw) ctx.mangaHistory = JSON.parse(raw).slice(0, 20);
  } catch {}

  return ctx;
}

// ═══════════════════════════════════════
// PARSERS FOR AI DATA
// ═══════════════════════════════════════

interface ParsedRecommendation {
  index: number;
  title: string;
  badge: string; // 🔥, ✨, 💡
  genres: string;
  reason: string;
}

function parseAIRecommendations(text: string): ParsedRecommendation[] {
  if (!text) return [];
  const parts = text.split(/(?=\b\d+\.\s+\*\*)/g);
  const items: ParsedRecommendation[] = [];

  parts.forEach((part) => {
    const match = part.match(/^\b(\d+)\.\s+\*\*([^*]+)\*\*([^\n]*)\n?([\s\S]*)$/i);
    if (!match) return;

    const index = parseInt(match[1]);
    const title = match[2].trim();
    const badgeText = match[3].trim();
    const rest = match[4].trim();

    let badge = "💡";
    if (badgeText.includes("🔥")) badge = "🔥";
    else if (badgeText.includes("✨")) badge = "✨";
    else if (badgeText.includes("💡")) badge = "💡";

    let genres = "";
    let reason = rest;

    const genreMatch = rest.match(/(?:Genre|Genres|Kategori|Category):\s*([^\n]+)/i);
    if (genreMatch) {
      genres = genreMatch[1].trim().replace(/^[-•*\s]+/, "");
      reason = rest.replace(/(?:Genre|Genres|Kategori|Category):\s*[^\n]+/i, "").trim();
    }

    reason = reason
      .replace(/^[-•*\s]+/gm, "")
      .replace(/Alasan:\s*/i, "")
      .trim();

    items.push({
      index,
      title,
      badge,
      genres,
      reason
    });
  });

  return items;
}

function parseProfileAnalysis(text: string): Record<string, string> | null {
  if (!text) return null;
  const parts = text.split(/(?=\b\d+\.\s+\*\*)/g);
  const result: Record<string, string> = {};

  parts.forEach((part) => {
    const match = part.match(/^\b\d+\.\s+\*\*([^*]+)\*\*:\s*([\s\S]*)$/i);
    if (match) {
      const title = match[1].trim();
      const content = match[2].trim();
      result[title] = content;
    }
  });

  return Object.keys(result).length > 0 ? result : null;
}

// ═══════════════════════════════════════
// RECOMMENDATION CARD COMPONENT
// ═══════════════════════════════════════

interface ResolvedItem {
  id?: string | number;
  title: string;
  image: string;
  rating?: string | null;
  format?: string;
  episodes?: number | string;
  slug?: string;
}

function RecommendationCard({
  item,
  resolved,
  type
}: {
  item: ParsedRecommendation;
  resolved: ResolvedItem | null;
  type: "anime" | "manga";
}) {
  const detailHref = type === "anime"
    ? (resolved?.id ? `/anime/${resolved.id}` : null)
    : (resolved?.slug ? `/manga/${encodeURIComponent(resolved.slug)}` : null);

  const cardContent = (
    <div className="flex gap-4">
      {/* Cover Image */}
      <div className="w-20 sm:w-24 aspect-[3/4] rounded-xl overflow-hidden bg-zinc-900 border border-white/10 shrink-0 relative shadow-md">
        {resolved?.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={resolved.image}
            alt={resolved.title || item.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-zinc-500">
            {type === "anime" ? <Tv size={20} /> : <BookOpen size={20} />}
            <span className="text-[8px] font-bold uppercase tracking-wider">Loading</span>
          </div>
        )}
        
        {/* Confident Badge */}
        <span className="absolute top-1.5 left-1.5 text-xs bg-black/70 backdrop-blur-md w-6 h-6 rounded-lg flex items-center justify-center border border-white/10 shadow-sm" title="Tingkat Kecocokan AI">
          {item.badge}
        </span>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="text-sm font-black text-white leading-tight group-hover:text-purple-400 transition-colors truncate">
              {item.title}
            </h3>
            {resolved?.format && (
              <span className="text-[9px] font-extrabold px-1.5 py-0.5 bg-white/10 rounded-md text-zinc-300 uppercase tracking-wide">
                {resolved.format}
              </span>
            )}
            {resolved?.rating && (
              <span className="flex items-center gap-0.5 text-[9px] font-extrabold px-1.5 py-0.5 bg-yellow-500/10 border border-yellow-500/20 rounded-md text-yellow-500">
                <Star size={8} className="fill-yellow-500" /> {resolved.rating}
              </span>
            )}
          </div>

          {item.genres && (
            <p className="text-[10px] text-purple-400 font-bold mb-1.5">
              {item.genres}
            </p>
          )}

          <p className="text-xs text-zinc-300 leading-relaxed line-clamp-3">
            {item.reason}
          </p>
        </div>

        {detailHref && (
          <div className="flex items-center gap-1 text-[10px] font-extrabold text-blue-400 group-hover:underline mt-2">
            Lihat Detail {type === "anime" ? "Anime" : "Manga"} <ChevronRight size={10} />
          </div>
        )}
      </div>
    </div>
  );

  return detailHref ? (
    <Link href={detailHref} className="block group">
      <motion.div
        whileHover={{ y: -2, scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="p-3 sm:p-4 rounded-2xl bg-zinc-900/40 border border-white/5 hover:border-purple-500/30 hover:bg-zinc-900/60 hover:shadow-lg transition-all duration-300"
      >
        {cardContent}
      </motion.div>
    </Link>
  ) : (
    <div className="p-3 sm:p-4 rounded-2xl bg-zinc-900/20 border border-white/5 opacity-80">
      {cardContent}
    </div>
  );
}

// ═══════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════

export default function RecommendationsPage() {
  const [activeTab, setActiveTab] = useState<"anime" | "manga" | "profile">("anime");
  const [animeRecs, setAnimeRecs] = useState<string | null>(null);
  const [mangaRecs, setMangaRecs] = useState<string | null>(null);
  const [profileAnalysis, setProfileAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);

  // Resolved Poster Cover Items Caching
  const [resolvedItems, setResolvedItems] = useState<Record<string, ResolvedItem>>({});

  useEffect(() => {
    const ctx = getUserContext();
    const total = (ctx.watchHistory?.length || 0) + (ctx.favorites?.length || 0) + (ctx.mangaHistory?.length || 0);
    setHasData(total > 0);

    if (total > 0 && !animeRecs) {
      fetchRecs("anime");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRecs = useCallback(async (type: "anime" | "manga" | "profile") => {
    setLoading(true);
    setError(null);

    const userContext = getUserContext();

    try {
      let action: string, extraPayload: Record<string, any> = {};

      if (type === "anime") {
        action = "recommend";
        const titles = [
          ...(userContext.watchHistory?.map((h: any) => h.animeTitle) || []),
          ...(userContext.favorites?.map((f: any) => f.title || f.anime_title) || []),
        ];
        extraPayload.animeList = [...new Set(titles)].slice(0, 20);
      } else if (type === "manga") {
        action = "chat";
        const mangaTitles = userContext.mangaHistory?.map((m: any) => m.mangaTitle) || [];
        extraPayload.message = `Berdasarkan riwayat baca manga saya: ${mangaTitles.join(", ")}. Rekomendasikan 5-7 manga/manhwa/manhua yang cocok. Untuk setiap rekomendasi:
1. Sebutkan judul manga (diapit tanda double asterisk **Judul Manga**)
2. Beri rating kepercayaan (🔥 Sangat cocok / ✨ Mungkin suka / 💡 Coba ini)
3. Tuliskan "Genre: [daftar genre]" pada baris baru
4. Jelaskan alasannya secara singkat (1-2 kalimat) di baris baru.
Jangan rekomendasikan manga yang sudah ada di daftar.`;
      } else {
        action = "analyze";
      }

      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, userContext, ...extraPayload }),
      });

      const data = await res.json();
      if (data.success || data.result) {
        if (type === "anime") setAnimeRecs(data.result);
        else if (type === "manga") setMangaRecs(data.result);
        else setProfileAnalysis(data.result);
      } else {
        setError(data.error || "Gagal mendapatkan rekomendasi");
      }
    } catch {
      setError("Gagal menghubungi AI. Coba lagi.");
    }

    setLoading(false);
  }, []);

  const handleTabChange = useCallback((tab: "anime" | "manga" | "profile") => {
    setActiveTab(tab);
    if (tab === "anime" && !animeRecs) fetchRecs("anime");
    if (tab === "manga" && !mangaRecs) fetchRecs("manga");
    if (tab === "profile" && !profileAnalysis) fetchRecs("profile");
  }, [animeRecs, mangaRecs, profileAnalysis, fetchRecs]);

  const currentResult = activeTab === "anime" ? animeRecs : activeTab === "manga" ? mangaRecs : profileAnalysis;

  // Resolve image covers & details client side
  useEffect(() => {
    if (!currentResult || activeTab === "profile") return;
    const parsed = parseAIRecommendations(currentResult);
    if (parsed.length === 0) return;

    parsed.forEach(async (item) => {
      if (resolvedItems[item.title]) return; // already resolved or fetching

      try {
        if (activeTab === "anime") {
          const res = await fetch(`/api/anime/search?q=${encodeURIComponent(item.title)}`);
          if (res.ok) {
            const data = await res.json();
            if (data.data && data.data.length > 0) {
              setResolvedItems(prev => ({
                ...prev,
                [item.title]: {
                  id: data.data[0].id,
                  title: data.data[0].title,
                  image: data.data[0].coverImage || data.data[0].image,
                  rating: data.data[0].averageScore ? (data.data[0].averageScore / 10).toFixed(1) : null,
                  format: data.data[0].format,
                  episodes: data.data[0].episodes,
                }
              }));
            }
          }
        } else if (activeTab === "manga") {
          const { searchManga } = await import("@/lib/manga-api");
          const data = await searchManga(item.title);
          if (data.results && data.results.length > 0) {
            setResolvedItems(prev => ({
              ...prev,
              [item.title]: {
                title: data.results[0].title,
                image: data.results[0].image,
                rating: data.results[0].rating,
                format: data.results[0].type || "Manga",
                slug: data.results[0].slug,
              }
            }));
          }
        }
      } catch (err) {
        console.error("Lookup failed for", item.title, err);
      }
    });
  }, [currentResult, activeTab, resolvedItems]);

  const parsedRecs = activeTab !== "profile" && currentResult ? parseAIRecommendations(currentResult) : [];
  const parsedProfile = activeTab === "profile" && currentResult ? parseProfileAnalysis(currentResult) : null;

  return (
    <>
      <TopBar />
      <main className="pt-safe pb-safe min-h-dvh">
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-7xl mx-auto w-full px-4 md:px-8 pb-28">
          
          {/* Header */}
          <motion.div variants={itemVariants} className="pt-20 pb-4">
            <Link href="/profile" className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-purple-400 transition-colors mb-3">
              <ArrowLeft size={14} /> Kembali ke Profil
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 via-pink-500 to-red-500 flex items-center justify-center shadow-lg shadow-purple-500/10">
                <Sparkles size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white" style={{ fontFamily: "var(--font-display)" }}>
                  Rekomendasi AI Personal
                </h1>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Analisis pintar Gemini berdasarkan riwayat tontonan dan bacaan Anda
                </p>
              </div>
            </div>
          </motion.div>

          {/* No Data State */}
          {!hasData && (
            <motion.div variants={itemVariants} className="mt-8">
              <div className="text-center py-16 bg-[var(--color-surface)] rounded-3xl border border-[var(--color-border)] shadow-sm">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-500/10 flex items-center justify-center mb-4">
                  <Brain size={28} className="text-purple-400 opacity-50" />
                </div>
                <p className="text-base font-bold text-white">Belum Ada Riwayat Aktivitas</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-sm mx-auto px-4 leading-relaxed">
                  Tonton anime atau baca manga favorit Anda terlebih dahulu, lalu kembali ke sini agar AI dapat membuat rekomendasi khusus untuk Anda!
                </p>
                <div className="flex gap-3 justify-center mt-6">
                  <Link href="/" className="px-5 py-2.5 rounded-xl bg-purple-500 text-white text-xs font-bold hover:bg-purple-600 shadow-md shadow-purple-500/10 transition-colors">
                    Jelajahi Anime
                  </Link>
                  <Link href="/manga" className="px-5 py-2.5 rounded-xl bg-zinc-800 text-zinc-200 text-xs font-bold hover:bg-zinc-750 border border-white/5 transition-colors">
                    Jelajahi Manga
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {hasData && (
            <>
              {/* Tabs */}
              <motion.div variants={itemVariants} className="mt-2 mb-6">
                <div className="flex gap-1.5 p-1 bg-zinc-950 rounded-2xl border border-white/5 max-w-md">
                  {[
                    { key: "anime", label: "Anime", icon: Tv, color: "purple" },
                    { key: "manga", label: "Manga", icon: BookOpen, color: "blue" },
                    { key: "profile", label: "Analisis Profil", icon: Brain, color: "pink" },
                  ].map(t => (
                    <button
                      key={t.key}
                      onClick={() => handleTabChange(t.key as any)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-[11px] font-bold transition-all ${
                        activeTab === t.key
                          ? `bg-${t.color}-500/20 text-${t.color}-400 border border-${t.color}-500/30 shadow`
                          : "text-zinc-400 hover:text-zinc-200"
                      }`}
                      style={activeTab === t.key ? {
                        backgroundColor: t.color === "purple" ? "rgba(168,85,247,0.15)" : t.color === "blue" ? "rgba(59,130,246,0.15)" : "rgba(236,72,153,0.15)",
                        color: t.color === "purple" ? "#c084fc" : t.color === "blue" ? "#60a5fa" : "#f472b6",
                        borderColor: t.color === "purple" ? "rgba(168,85,247,0.3)" : t.color === "blue" ? "rgba(59,130,246,0.3)" : "rgba(236,72,153,0.3)",
                        borderWidth: "1px",
                        borderStyle: "solid",
                      } : undefined}
                    >
                      <t.icon size={14} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Main Recommendations Content Area */}
              <motion.div variants={itemVariants}>
                {loading && !currentResult ? (
                  <div className="py-20 text-center space-y-4">
                    <div className="relative w-16 h-16 mx-auto">
                      <Loader2 size={40} className="animate-spin text-purple-500 mx-auto" />
                      <Sparkles size={18} className="absolute top-0 right-0 text-pink-400 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">AI sedang menganalisis seleramu...</p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">
                        {activeTab === "anime" ? "Mencari anime terbaik yang cocok untukmu" :
                         activeTab === "manga" ? "Mencari manga/manhwa berdasarkan riwayat bacamu" :
                         "Mengevaluasi profil menonton kamu"}
                      </p>
                    </div>
                  </div>
                ) : error && !currentResult ? (
                  <div className="py-16 text-center space-y-4">
                    <p className="text-sm text-red-400 font-bold">⚠️ {error}</p>
                    <button
                      onClick={() => fetchRecs(activeTab)}
                      className="px-5 py-2.5 rounded-xl bg-zinc-800 text-xs font-semibold hover:bg-zinc-700 transition-colors flex items-center gap-1.5 mx-auto text-white border border-white/5 shadow"
                    >
                      <RefreshCcw size={13} /> Coba Lagi
                    </button>
                  </div>
                ) : currentResult ? (
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    
                    {/* LEFT COLUMN: Premium Visual Recommendations / Dashboards */}
                    <div className="lg:col-span-8 space-y-6">
                      
                      {/* Anime or Manga tab cards */}
                      {activeTab !== "profile" && parsedRecs.length > 0 && (
                        <div className="space-y-4">
                          <h2 className="text-sm font-extrabold flex items-center gap-2 text-white">
                            <Zap size={14} className="text-yellow-400" />
                            AI Rekomendasi Hasil Pencarian
                          </h2>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {parsedRecs.map((item, i) => (
                              <RecommendationCard
                                key={i}
                                item={item}
                                resolved={resolvedItems[item.title] || null}
                                type={activeTab}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Profile analysis parsed dashboard */}
                      {activeTab === "profile" && parsedProfile && (
                        <div className="space-y-4">
                          <h2 className="text-sm font-extrabold flex items-center gap-2 text-white">
                            <Brain size={14} className="text-pink-400" />
                            Dashboard Analisis Kepribadian Anime
                          </h2>
                          
                          {/* Main Title Personality Banner */}
                          {parsedProfile["Anime Personality"] && (
                            <div className="p-5 rounded-3xl bg-gradient-to-r from-purple-900/60 via-pink-900/40 to-zinc-950 border border-purple-500/25 flex items-center gap-4 shadow-lg">
                              <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
                                <Award size={32} className="text-purple-400" />
                              </div>
                              <div>
                                <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">Gelar Anime Kamu</span>
                                <h3 className="text-lg font-black text-white mt-1 leading-tight">
                                  {parsedProfile["Anime Personality"].replace(/^["']|["']$/g, "")}
                                </h3>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Profile Card */}
                            {parsedProfile["Profil Kamu"] && (
                              <div className="p-4 rounded-2xl bg-zinc-900/30 border border-white/5 hover:border-purple-500/20 transition-all">
                                <span className="text-[10px] font-extrabold text-purple-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                  <Sparkles size={11} /> Profil Kepenontonan
                                </span>
                                <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                                  {parsedProfile["Profil Kamu"]}
                                </p>
                              </div>
                            )}

                            {/* Genres Card */}
                            {parsedProfile["Genre Favorit"] && (
                              <div className="p-4 rounded-2xl bg-zinc-900/30 border border-white/5 hover:border-blue-500/20 transition-all">
                                <span className="text-[10px] font-extrabold text-blue-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                  <Heart size={11} className="fill-blue-500/20" /> Genre Teratas
                                </span>
                                <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                                  {parsedProfile["Genre Favorit"]}
                                </p>
                              </div>
                            )}

                            {/* Watch Pattern */}
                            {parsedProfile["Pola Menonton"] && (
                              <div className="p-4 rounded-2xl bg-zinc-900/30 border border-white/5 hover:border-pink-500/20 transition-all">
                                <span className="text-[10px] font-extrabold text-pink-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                  <Tv size={11} /> Pola Menonton
                                </span>
                                <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                                  {parsedProfile["Pola Menonton"]}
                                </p>
                              </div>
                            )}

                            {/* AI Suggestion */}
                            {parsedProfile["Saran"] && (
                              <div className="p-4 rounded-2xl bg-zinc-900/30 border border-white/5 hover:border-yellow-500/20 transition-all">
                                <span className="text-[10px] font-extrabold text-yellow-400 uppercase tracking-wider flex items-center gap-1.5 mb-2">
                                  <Zap size={11} className="fill-yellow-500/20" /> Saran Eksplorasi
                                </span>
                                <p className="text-xs text-zinc-300 leading-relaxed font-medium">
                                  {parsedProfile["Saran"]}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* If parsing fails completely, show standard fallback notice in left area */}
                      {activeTab !== "profile" && parsedRecs.length === 0 && (
                        <div className="p-5 rounded-2xl bg-zinc-900/20 border border-white/5 text-center">
                          <p className="text-sm text-zinc-400">Loading kartu visual rekomendasi...</p>
                        </div>
                      )}
                    </div>

                    {/* RIGHT COLUMN: Raw AI Text Response (Gemini Detailed Markdown Sidebar) */}
                    <div className="lg:col-span-4 space-y-4">
                      <div className="p-5 rounded-3xl bg-zinc-900/30 border border-white/5 space-y-4">
                        <div className="flex items-center justify-between pb-3 border-b border-white/10">
                          <div className="flex items-center gap-2">
                            <Sparkles size={14} className="text-purple-400" />
                            <span className="text-xs font-bold text-white">Catatan Gemini AI Lengkap</span>
                          </div>
                          <button
                            onClick={() => {
                              if (activeTab === "anime") setAnimeRecs(null);
                              else if (activeTab === "manga") setMangaRecs(null);
                              else setProfileAnalysis(null);
                              fetchRecs(activeTab);
                            }}
                            disabled={loading}
                            className="p-1.5 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-purple-400 transition-colors disabled:opacity-30"
                            title="Regenerate"
                          >
                            <RefreshCcw size={13} className={loading ? "animate-spin" : ""} />
                          </button>
                        </div>

                        <div
                          className="text-[12px] leading-relaxed text-zinc-300 whitespace-pre-wrap select-text pr-1 max-h-[500px] overflow-y-auto scrollbar-thin"
                          dangerouslySetInnerHTML={{
                            __html: currentResult
                              .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                              .replace(/\n/g, "<br/>")
                          }}
                        />
                      </div>

                      {/* Footer Note */}
                      <p className="text-[10px] text-center text-zinc-500 leading-normal">
                        ✨ Gemini 2.5 Flash • Rekomendasi dihitung dari {
                          ((getUserContext().watchHistory?.length || 0) + (getUserContext().favorites?.length || 0))
                        } anime & {getUserContext().mangaHistory?.length || 0} manga dalam riwayat tracker lokal kamu.
                      </p>
                    </div>

                  </div>
                ) : null}
              </motion.div>
            </>
          )}
        </motion.div>
      </main>
      <BottomNavbar />
    </>
  );
}
