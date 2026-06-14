"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Sparkles, Loader2, RefreshCcw, BookOpen, Tv,
  Brain, Zap, ChevronRight, ArrowLeft
} from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNavbar } from "@/components/layout/BottomNavbar";
import { getWatchHistory } from "@/lib/watchHistory";
import { getMangaHistory } from "@/lib/mangaHistory";
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

export default function RecommendationsPage() {
  const [activeTab, setActiveTab] = useState<"anime" | "manga" | "profile">("anime");
  const [animeRecs, setAnimeRecs] = useState<string | null>(null);
  const [mangaRecs, setMangaRecs] = useState<string | null>(null);
  const [profileAnalysis, setProfileAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasData, setHasData] = useState(false);

  useEffect(() => {
    const ctx = getUserContext();
    const total = (ctx.watchHistory?.length || 0) + (ctx.favorites?.length || 0) + (ctx.mangaHistory?.length || 0);
    setHasData(total > 0);

    // Auto-fetch anime recommendations on mount if we have data
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
        // Use watch history as anime list
        const titles = [
          ...(userContext.watchHistory?.map((h: any) => h.animeTitle) || []),
          ...(userContext.favorites?.map((f: any) => f.title || f.anime_title) || []),
        ];
        extraPayload.animeList = [...new Set(titles)].slice(0, 20);
      } else if (type === "manga") {
        action = "chat";
        const mangaTitles = userContext.mangaHistory?.map((m: any) => m.mangaTitle) || [];
        extraPayload.message = `Berdasarkan riwayat baca manga saya: ${mangaTitles.join(", ")}. Rekomendasikan 5-7 manga/manhwa/manhua yang cocok. Untuk setiap rekomendasi jelaskan alasannya dan hubungkan dengan manga yang sudah saya baca. Tambahkan genre dan rating kepercayaan (🔥 Sangat cocok / ✨ Mungkin suka / 💡 Coba ini).`;
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
    // Auto-fetch if not already fetched
    if (tab === "anime" && !animeRecs) fetchRecs("anime");
    if (tab === "manga" && !mangaRecs) fetchRecs("manga");
    if (tab === "profile" && !profileAnalysis) fetchRecs("profile");
  }, [animeRecs, mangaRecs, profileAnalysis, fetchRecs]);

  const currentResult = activeTab === "anime" ? animeRecs : activeTab === "manga" ? mangaRecs : profileAnalysis;

  return (
    <>
      <TopBar />
      <main className="pt-safe pb-safe min-h-dvh">
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="pb-28">
          {/* Header */}
          <motion.div variants={itemVariants} className="px-4 pt-20 pb-3">
            <Link href="/profile" className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-muted)] hover:text-purple-400 transition-colors mb-3">
              <ArrowLeft size={14} /> Kembali ke Profil
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Sparkles size={22} className="text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black" style={{ fontFamily: "var(--font-display)" }}>
                  Rekomendasi AI
                </h1>
                <p className="text-xs text-[var(--color-text-muted)]">
                  Dipersonalisasi berdasarkan riwayat kamu
                </p>
              </div>
            </div>
          </motion.div>

          {/* No Data State */}
          {!hasData && (
            <motion.div variants={itemVariants} className="px-4 mt-8">
              <div className="text-center py-12 bg-[var(--color-surface)] rounded-3xl border border-[var(--color-border)]">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-purple-500/10 flex items-center justify-center mb-4">
                  <Brain size={28} className="text-purple-400 opacity-50" />
                </div>
                <p className="text-sm font-bold">Belum Ada Data</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1 max-w-xs mx-auto">
                  Tonton anime atau baca manga dulu, lalu AI akan memberikan rekomendasi personal untukmu!
                </p>
                <div className="flex gap-2 justify-center mt-4">
                  <Link href="/" className="px-4 py-2 rounded-xl bg-purple-500/10 text-purple-400 text-xs font-semibold hover:bg-purple-500/20 transition-colors">
                    Jelajahi Anime
                  </Link>
                  <Link href="/manga" className="px-4 py-2 rounded-xl bg-blue-500/10 text-blue-400 text-xs font-semibold hover:bg-blue-500/20 transition-colors">
                    Jelajahi Manga
                  </Link>
                </div>
              </div>
            </motion.div>
          )}

          {hasData && (
            <>
              {/* Tabs */}
              <motion.div variants={itemVariants} className="px-4 mt-2 mb-4">
                <div className="flex gap-1 p-1 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)]">
                  {[
                    { key: "anime", label: "Anime", icon: Tv, color: "purple" },
                    { key: "manga", label: "Manga", icon: BookOpen, color: "blue" },
                    { key: "profile", label: "Analisis", icon: Brain, color: "pink" },
                  ].map(t => (
                    <button
                      key={t.key}
                      onClick={() => handleTabChange(t.key as any)}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] font-bold transition-all ${
                        activeTab === t.key
                          ? `bg-${t.color}-500/20 text-${t.color}-400 border border-${t.color}-500/30`
                          : "text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]"
                      }`}
                      style={activeTab === t.key ? {
                        backgroundColor: t.color === "purple" ? "rgba(168,85,247,0.15)" : t.color === "blue" ? "rgba(59,130,246,0.15)" : "rgba(236,72,153,0.15)",
                        color: t.color === "purple" ? "#a855f7" : t.color === "blue" ? "#3b82f6" : "#ec4899",
                        borderColor: t.color === "purple" ? "rgba(168,85,247,0.3)" : t.color === "blue" ? "rgba(59,130,246,0.3)" : "rgba(236,72,153,0.3)",
                        borderWidth: "1px",
                        borderStyle: "solid",
                      } : undefined}
                    >
                      <t.icon size={13} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Content */}
              <motion.div variants={itemVariants} className="px-4">
                {loading && !currentResult ? (
                  <div className="py-16 text-center space-y-4">
                    <div className="relative w-16 h-16 mx-auto">
                      <Loader2 size={40} className="animate-spin text-purple-400 mx-auto" />
                      <Sparkles size={16} className="absolute top-0 right-0 text-pink-400 animate-pulse" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">AI sedang menganalisis...</p>
                      <p className="text-xs text-[var(--color-text-muted)] mt-1">
                        {activeTab === "anime" ? "Mencari anime yang cocok untukmu" :
                         activeTab === "manga" ? "Mencari manga berdasarkan selera kamu" :
                         "Menganalisis profil tontonan kamu"}
                      </p>
                    </div>
                  </div>
                ) : error && !currentResult ? (
                  <div className="py-12 text-center space-y-3">
                    <p className="text-sm text-red-400 font-semibold">⚠️ {error}</p>
                    <button
                      onClick={() => fetchRecs(activeTab)}
                      className="px-4 py-2 rounded-xl bg-[var(--color-surface)] text-xs font-semibold hover:bg-[var(--color-surface-2)] transition-colors flex items-center gap-1.5 mx-auto"
                    >
                      <RefreshCcw size={12} /> Coba Lagi
                    </button>
                  </div>
                ) : currentResult ? (
                  <div className="space-y-3">
                    {/* Result Card */}
                    <div className="p-5 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)]">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Zap size={14} className="text-yellow-400" />
                          <span className="text-xs font-bold">
                            {activeTab === "anime" ? "Rekomendasi Anime" :
                             activeTab === "manga" ? "Rekomendasi Manga" :
                             "Analisis Profil Kamu"}
                          </span>
                        </div>
                        <button
                          onClick={() => {
                            if (activeTab === "anime") setAnimeRecs(null);
                            else if (activeTab === "manga") setMangaRecs(null);
                            else setProfileAnalysis(null);
                            fetchRecs(activeTab);
                          }}
                          disabled={loading}
                          className="p-1.5 rounded-lg hover:bg-[var(--color-surface-2)] text-[var(--color-text-muted)] hover:text-purple-400 transition-colors disabled:opacity-30"
                        >
                          <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
                        </button>
                      </div>
                      <div
                        className="text-[13px] leading-relaxed whitespace-pre-wrap"
                        dangerouslySetInnerHTML={{
                          __html: currentResult
                            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                            .replace(/\n/g, "<br/>")
                        }}
                      />
                    </div>

                    {/* Note */}
                    <p className="text-[10px] text-center text-[var(--color-text-muted)] px-4">
                      ✨ Ditenagai oleh Gemini AI • Rekomendasi berdasarkan {
                        ((getUserContext().watchHistory?.length || 0) + (getUserContext().favorites?.length || 0))
                      } anime & {getUserContext().mangaHistory?.length || 0} manga yang kamu ikuti
                    </p>
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
