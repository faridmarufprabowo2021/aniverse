"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, BookmarkPlus, Loader2, Play, Star, ChevronRight, CheckCircle2, List as ListIcon, Clock } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNavbar } from "@/components/layout/BottomNavbar";
import { getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";

// Types — match the flat anime_cache DB schema
interface AnimeListEntry {
  id: string;
  anime_id: number;
  status: "WATCHING" | "COMPLETED" | "PLAN_TO_WATCH" | "DROPPED";
  progress: number;
  score: number | null;
  updated_at: string;
  anime_cache: {
    id: number;
    title_romaji: string;
    title_english?: string | null;
    cover_image_url?: string | null;
    cover_image_large?: string | null;
    episodes?: number | null;
    format?: string | null;
  } | null;
}

const TABS = [
  { id: "all",           label: "Semua" },
  { id: "WATCHING",      label: "Sedang Ditonton" },
  { id: "COMPLETED",     label: "Selesai" },
  { id: "PLAN_TO_WATCH", label: "Ingin Ditonton" }
];

export default function MyListPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [list, setList] = useState<AnimeListEntry[]>([]);
  const [activeTab, setActiveTab] = useState("all");

  useEffect(() => {
    async function loadData() {
      const u = await getCurrentUser();
      setUser(u);
      
      if (u) {
        // Fetch list if logged in
        try {
          const supabase = createClient();
          // We need metadata for anime here. Usually we join with a cache table,
          // but for now let's just fetch from user_anime_list assuming it has anime JSON 
          // or we can fetch the IDs from anilist later.
          // For now, let's just query the table and see what we have.
          const { data, error } = await supabase
            .from("user_anime_list")
            .select("*, anime_cache(*)")
            .eq("user_id", u.id)
            .order("updated_at", { ascending: false });
            
          if (!error && data) {
            setList(data as AnimeListEntry[]);
          }
        } catch (err) {
          console.error("Failed to load list", err);
        }
      }
      setLoading(false);
    }
    loadData();
  }, []);

  const filteredList = activeTab === "all" 
    ? list 
    : list.filter(item => item.status === activeTab);

  if (loading) {
    return (
      <>
        <TopBar />
        <main className="pt-safe pb-safe min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </main>
        <BottomNavbar />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <TopBar />
        <main className="pt-safe pb-safe min-h-screen flex flex-col max-w-2xl mx-auto w-full px-4">
          <div className="pt-20 pb-2">
            <h1 className="text-2xl font-black" style={{ fontFamily: "var(--font-display)" }}>
              📋 Daftar Anime Saya
            </h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Lacak anime yang sedang ditonton, sudah selesai, atau ingin ditonton
            </p>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center py-12">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4 }}
              className="text-center max-w-sm space-y-5"
            >
              <div className="w-20 h-20 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center mx-auto">
                <Lock size={32} className="text-[var(--color-text-muted)]" />
              </div>
              <div>
                <h2 className="text-lg font-bold">Masuk untuk Melanjutkan</h2>
                <p className="text-sm text-[var(--color-text-muted)] mt-2">
                  Daftar dan masuk untuk menyimpan daftar anime kamu, melacak progres, dan mendapatkan rekomendasi personal.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <Link href="/login?redirect=/mylist">
                  <Button fullWidth icon={<BookmarkPlus size={16} />}>
                    Masuk ke AniVerse
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline" fullWidth>
                    Buat Akun Gratis
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </main>
        <BottomNavbar />
      </>
    );
  }

  return (
    <>
      <TopBar />
      <main className="pt-safe pb-safe min-h-screen flex flex-col max-w-5xl mx-auto w-full px-4 md:px-8">
        {/* Header */}
        <div className="pt-20 pb-4">
          <h1 className="text-2xl font-black flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
            <ListIcon size={24} className="text-purple-400" />
            Daftarku
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            {list.length} anime tersimpan
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-4">
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  activeTab === tab.id
                    ? "bg-purple-500 border-purple-500 text-white shadow-lg shadow-purple-500/20"
                    : "bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:text-white"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 pb-28">
          <AnimatePresence mode="popLayout">
            {filteredList.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-16 text-center space-y-3"
              >
                <div className="w-16 h-16 rounded-full bg-purple-500/10 flex items-center justify-center mx-auto">
                  <BookmarkPlus size={24} className="text-purple-400 opacity-50" />
                </div>
                <p className="text-sm font-semibold text-[var(--color-text-muted)]">
                  Belum ada anime di daftar ini
                </p>
                <Link href="/search">
                  <Button size="sm" variant="outline" className="mt-2 text-xs">Cari Anime</Button>
                </Link>
              </motion.div>
            ) : (
              <div className="grid gap-3">
                {filteredList.map((item) => (
                  <motion.div
                    key={item.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="flex gap-3 p-2 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl hover:border-purple-500/30 transition-colors group"
                  >
                    {/* Cover */}
                    <Link href={`/anime/${item.anime_id}`} className="shrink-0">
                      <div className="relative w-16 h-24 rounded-xl overflow-hidden bg-[var(--color-surface-2)]">
                        {item.anime_cache?.cover_image_large && (
                          <Image
                            src={item.anime_cache.cover_image_large}
                            alt={item.anime_cache.title_romaji || ''}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform"
                            sizes="64px"
                          />
                        )}
                        <div className="absolute inset-x-0 bottom-0 py-1 px-1 bg-black/60 backdrop-blur-sm text-[10px] font-bold text-center text-white border-t border-white/10">
                          {item.status === 'WATCHING'      ? '👁️ Nonton'
                            : item.status === 'COMPLETED'     ? '✅ Selesai'
                            : item.status === 'PLAN_TO_WATCH' ? '📅 Plan'
                            : '❌ Drop'}
                        </div>
                      </div>
                    </Link>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-center py-1">
                      <Link href={`/anime/${item.anime_id}`}>
                        <h3 className="text-sm font-bold line-clamp-1 group-hover:text-purple-400 transition-colors">
                          {item.anime_cache?.title_english || item.anime_cache?.title_romaji || `Anime #${item.anime_id}`}
                        </h3>
                      </Link>
                      
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {item.status === 'WATCHING' && (
                          <div className="flex items-center gap-1 text-[11px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md">
                            <Play size={10} fill="currentColor" />
                            Eps {item.progress} {item.anime_cache?.episodes ? `/ ${item.anime_cache.episodes}` : ''}
                          </div>
                        )}
                        {item.status === 'COMPLETED' && (
                          <div className="flex items-center gap-1 text-[11px] font-bold text-green-400 bg-green-500/10 px-2 py-0.5 rounded-md">
                            <CheckCircle2 size={10} />
                            Eps {item.progress} {item.anime_cache?.episodes ? `/ ${item.anime_cache.episodes}` : ''}
                          </div>
                        )}
                        {item.score && (
                          <div className="flex items-center gap-1 text-[11px] font-bold text-yellow-500 bg-yellow-500/10 px-2 py-0.5 rounded-md">
                            <Star size={10} fill="currentColor" />
                            {item.score}/10
                          </div>
                        )}
                      </div>
                      
                      {item.anime_cache?.format && (
                        <p className="text-[10px] text-[var(--color-text-muted)] mt-2">
                          {item.anime_cache.format.replace(/_/g, ' ')}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>
      <BottomNavbar />
    </>
  );
}
