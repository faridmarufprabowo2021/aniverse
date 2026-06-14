"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  User, Clock, Star, PlaySquare, List, LogOut, Settings, Shield,
  ChevronRight, Tv, History, Calendar, Bell, Heart, Crown, Loader2,
  BookOpen, Palette, Globe, Sparkles, Camera, Brain
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNavbar } from "@/components/layout/BottomNavbar";
import { signOut, getCurrentUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/client";
import { containerVariants, itemVariants } from "@/lib/animations";

// ═══════════════════════════════════════
// FEATURES LIST
// ═══════════════════════════════════════

const FEATURES_LOGGED_IN = [
  {
    icon: List,
    title: "Daftar Anime",
    desc: "Simpan anime ke daftar Watching, Completed, Plan to Watch",
    href: "/mylist",
    color: "#a855f7",
  },
  {
    icon: History,
    title: "Riwayat Tonton",
    desc: "Riwayat anime & manga dengan progress tracking",
    href: "/history",
    color: "#3b82f6",
  },
  {
    icon: BookOpen,
    title: "Riwayat Manga",
    desc: "Lihat manga yang terakhir dibaca dan lanjutkan membaca",
    href: "/history?tab=manga",
    color: "#06b6d4",
  },
  {
    icon: Camera,
    title: "Image Search",
    desc: "Upload gambar anime → AI identifikasi judul & karakter",
    href: "#image-search",
    color: "#f43f5e",
  },
  {
    icon: Tv,
    title: "Streaming Gratis",
    desc: "Tonton anime Sub Indo dengan 5 provider: Samehadaku, Stream, Otakudesu, Oploverz, Winbu",
    href: "/",
    color: "#ec4899",
  },
  {
    icon: Calendar,
    title: "Jadwal Mingguan",
    desc: "Lihat jadwal tayang anime setiap hari dalam seminggu",
    href: "/schedule",
    color: "#f59e0b",
  },
  {
    icon: Heart,
    title: "Favorit & Rating",
    desc: "Beri rating dan tandai anime favoritmu",
    href: "/mylist",
    color: "#ef4444",
  },
  {
    icon: Bell,
    title: "Notifikasi Episode",
    desc: "Dapatkan pemberitahuan saat episode baru rilis",
    href: "#",
    color: "#10b981",
  },
  {
    icon: Globe,
    title: "Terjemahan Otomatis",
    desc: "Sinopsis anime diterjemahkan ke Bahasa Indonesia secara otomatis",
    href: "#",
    color: "#6366f1",
  },
  {
    icon: Sparkles,
    title: "Rekomendasi AI",
    desc: "Rekomendasi anime & manga personal dari AI berdasarkan riwayat kamu",
    href: "/recommendations",
    color: "#f97316",
  },
];

// ═══════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════

function StatCard({
  icon: Icon,
  value,
  label,
  color,
}: {
  icon: React.ElementType;
  value: string | number;
  label: string;
  color: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.03, y: -2 }}
      className="bg-[var(--color-surface)] p-4 rounded-2xl border border-[var(--color-border)] flex items-center gap-4 group"
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
        style={{ backgroundColor: `${color}15`, color }}
      >
        <Icon size={20} />
      </div>
      <div>
        <div className="text-xl font-black">{value}</div>
        <div className="text-[11px] text-[var(--color-text-muted)]">{label}</div>
      </div>
    </motion.div>
  );
}

// ═══════════════════════════════════════
// PROFILE PAGE
// ═══════════════════════════════════════

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<{ id: string; email?: string; user_metadata?: Record<string, string> } | null>(null);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);
  const [stats, setStats] = useState({ days: "0.0", episodes: 0, score: "0.0", total: 0 });
  const [notifStatus, setNotifStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' | 'info' } | null>(null);

  // Auto-dismiss toast after 4s
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    async function fetchUser() {
      const u = await getCurrentUser();
      if (!u) {
        router.replace("/login?redirect=/profile");
        return;
      }
      setUser(u);

      // Fetch stats from Supabase watchlist
      try {
        const supabase = createClient();
        const { data: watchList } = await supabase
          .from("user_anime_list")
          .select("progress, score, status")
          .eq("user_id", u.id);

        if (watchList && watchList.length > 0) {
          let totalEps = 0, totalScore = 0, scoreCount = 0;
          watchList.forEach((entry: { progress?: number; score?: number }) => {
            totalEps += entry.progress || 0;
            if (entry.score) { totalScore += entry.score; scoreCount++; }
          });
          // Correct formula: avg episode ~24 min = 0.4 hours = 0.0167 days
          const daysWatched = (totalEps * 24) / (60 * 24);
          setStats({
            days: daysWatched.toFixed(1),
            episodes: totalEps,
            score: scoreCount > 0 ? (totalScore / scoreCount).toFixed(1) : "0.0",
            total: watchList.length,
          });
        } else {
          // Fallback: count from localStorage watch history
          try {
            const history = JSON.parse(localStorage.getItem('aniverse_watch_history') || '[]');
            const uniqueEps = new Set(history.map((h: { episodeId: string }) => h.episodeId)).size;
            const uniqueAnime = new Set(history.map((h: { animeId: number }) => h.animeId)).size;
            const daysWatched = (uniqueEps * 24) / (60 * 24);
            setStats({
              days: daysWatched.toFixed(1),
              episodes: uniqueEps,
              score: "–",
              total: uniqueAnime,
            });
          } catch { /* ignore */ }
        }
      } catch {
        // Supabase not available — try localStorage
        try {
          const history = JSON.parse(localStorage.getItem('aniverse_watch_history') || '[]');
          const uniqueEps = new Set(history.map((h: { episodeId: string }) => h.episodeId)).size;
          const uniqueAnime = new Set(history.map((h: { animeId: number }) => h.animeId)).size;
          const daysWatched = (uniqueEps * 24) / (60 * 24);
          setStats({
            days: daysWatched.toFixed(1),
            episodes: uniqueEps,
            score: "–",
            total: uniqueAnime,
          });
        } catch { /* ignore */ }
      }

      setLoading(false);
    }
    fetchUser();
  }, [router]);

  const handleLogout = async () => {
    setLoggingOut(true);
    await signOut();
    router.push("/");
    router.refresh();
  };

  if (loading) {
    return (
      <>
        <TopBar />
        <main className="pt-safe pb-safe min-h-dvh flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </main>
        <BottomNavbar />
      </>
    );
  }

  const username = user?.user_metadata?.username || user?.user_metadata?.display_name || user?.email?.split("@")[0] || "User";
  const avatarUrl = user?.user_metadata?.avatar_url;
  const email = user?.email || "";
  const joinDate = new Date().toLocaleDateString("id-ID", { year: "numeric", month: "long" });

  return (
    <>
      <TopBar />
      <main className="pt-safe pb-safe min-h-dvh">
        {/* Animated Toast */}
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-20 left-4 right-4 z-[9999] p-4 rounded-2xl shadow-2xl border flex items-start gap-3 ${
              toast.type === 'success'
                ? 'bg-green-950 border-green-500/30 text-green-300'
                : toast.type === 'error'
                ? 'bg-red-950 border-red-500/30 text-red-300'
                : 'bg-zinc-900 border-zinc-700 text-zinc-200'
            }`}
          >
            <span className="text-lg">{toast.type === 'success' ? '✅' : toast.type === 'error' ? '❌' : 'ℹ️'}</span>
            <p className="text-sm font-medium leading-relaxed flex-1">{toast.msg}</p>
            <button onClick={() => setToast(null)} className="text-zinc-500 hover:text-zinc-300 shrink-0 mt-0.5">
              ✕
            </button>
          </motion.div>
        )}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="max-w-2xl mx-auto px-4 space-y-6 pb-28"
        >
          {/* ═══ Profile Header ═══ */}
          <motion.div variants={itemVariants} className="relative pt-20 pb-8 px-6 text-center overflow-hidden">
            {/* Gradient Background */}
            <div className="absolute inset-0">
              <div className="absolute inset-0 bg-gradient-to-b from-purple-600/20 via-pink-600/10 to-transparent" />
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-purple-500/10 blur-3xl" />
            </div>

            {/* Avatar */}
            <div className="relative z-10 w-28 h-28 mx-auto mb-4">
              <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-purple-500 via-pink-500 to-blue-500 animate-spin-slow" style={{ animationDuration: "8s" }} />
              <div className="relative w-full h-full rounded-full bg-[var(--color-bg)] p-1">
                <div className="w-full h-full rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 flex items-center justify-center overflow-hidden">
                  {avatarUrl ? (
                    <Image src={avatarUrl} alt={username} fill className="object-cover rounded-full" />
                  ) : (
                    <span className="text-4xl font-black text-white">{username[0]?.toUpperCase()}</span>
                  )}
                </div>
              </div>
              {/* Online indicator */}
              <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-green-500 border-[3px] border-[var(--color-bg)]" />
            </div>

            {/* Name & Email */}
            <h1 className="text-2xl font-black relative z-10" style={{ fontFamily: "var(--font-display)" }}>
              {username}
            </h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-1 relative z-10">{email}</p>
            <div className="flex items-center justify-center gap-2 mt-2 relative z-10">
              <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                <Crown size={10} className="inline mr-1" />
                Member
              </span>
              <span className="text-[10px] text-[var(--color-text-muted)]">
                Bergabung {joinDate}
              </span>
            </div>
          </motion.div>

          {/* ═══ Stats Grid ═══ */}
          <motion.div variants={itemVariants} className="px-4">
            <h2 className="text-base font-bold mb-3 px-1" style={{ fontFamily: "var(--font-display)" }}>
              📊 Statistik Anime
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <StatCard icon={Clock} value={stats.days} label="Hari Menonton" color="#a855f7" />
              <StatCard icon={PlaySquare} value={stats.episodes} label="Episode Ditonton" color="#10b981" />
              <StatCard icon={Star} value={stats.score} label="Rata-rata Skor" color="#f59e0b" />
              <StatCard icon={List} value={stats.total} label="Total Anime" color="#3b82f6" />
            </div>
          </motion.div>

          {/* ═══ Features List ═══ */}
          <motion.div variants={itemVariants} className="px-4">
            <h2 className="text-base font-bold mb-3 px-1" style={{ fontFamily: "var(--font-display)" }}>
              ✨ Fitur AniVerse
            </h2>
            <div className="space-y-2">
              {FEATURES_LOGGED_IN.map((f) => {
                const isNotification = f.title === "Notifikasi Episode";

                const handleNotificationClick = async (e: React.MouseEvent) => {
                  e.preventDefault();
                  
                  try {
                    // 1. Request Notification Permission
                    const permission = await Notification.requestPermission();
                    if (permission !== "granted") {
                      setToast({ msg: "Izin notifikasi ditolak oleh browser.", type: 'error' });
                      setNotifStatus('error');
                      return;
                    }

                    setNotifStatus('loading');

                    // 2. Register Service Worker if not already
                    const registration = await navigator.serviceWorker.ready;

                    // 3. Web Push Vapid Key
                    const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
                    if (!vapidPublicKey) {
                      throw new Error("VAPID key belum dikonfigurasi.");
                    }

                    // helper to convert base64
                    const urlBase64ToUint8Array = (base64String: string) => {
                      const padding = '='.repeat((4 - base64String.length % 4) % 4);
                      const base64 = (base64String + padding)
                        .replace(/\-/g, '+')
                        .replace(/_/g, '/');
                    
                      const rawData = window.atob(base64);
                      const outputArray = new Uint8Array(rawData.length);
                    
                      for (let i = 0; i < rawData.length; ++i) {
                        outputArray[i] = rawData.charCodeAt(i);
                      }
                      return outputArray;
                    };

                    // 4. Subscribe to PushManager
                    const subscription = await registration.pushManager.subscribe({
                      userVisibleOnly: true,
                      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
                    });

                    // 5. Save subscription to Supabase for future episode notifications
                    if (user?.id) {
                      const supabase = createClient();
                      await supabase.from("push_subscriptions").upsert({
                        user_id: user.id,
                        subscription_data: JSON.parse(JSON.stringify(subscription)),
                        device_type: /Mobi/.test(navigator.userAgent) ? "mobile" : "desktop",
                        user_agent: navigator.userAgent.slice(0, 200),
                        is_active: true,
                        last_used_at: new Date().toISOString(),
                      }, { onConflict: "user_id" });
                    }

                    // 6. Send Test Push via Backend
                    const response = await fetch("/api/push", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        subscription,
                        title: "Yatta! Tes Notif Sukses 🎉",
                        body: "Kamu akan mendapat info kalau ada anime favoritmu yang rilis eps baru!",
                      }),
                    });

                    if (!response.ok) throw new Error("Gagal kirim notif dari server");

                    setNotifStatus('success');
                    setToast({ msg: "🎉 Notifikasi berhasil diaktifkan! Cek notif test di HP kamu.", type: 'success' });

                  } catch (err: unknown) {
                    const message = err instanceof Error ? err.message : 'Terjadi kesalahan';
                    console.error("Push Error", err);
                    setNotifStatus('error');
                    setToast({ msg: `Gagal mengaktifkan notifikasi: ${message}`, type: 'error' });
                  }
                };


                const CardContent = (
                  <motion.div
                    whileHover={{ x: 4 }}
                    className="flex items-center gap-4 p-3.5 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] hover:border-purple-500/30 transition-all group"
                  >
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                      style={{ backgroundColor: `${f.color}12`, color: f.color }}
                    >
                      <f.icon size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold group-hover:text-purple-400 transition-colors">{f.title}</p>
                      <p className="text-[11px] text-[var(--color-text-muted)] line-clamp-1">{f.desc}</p>
                    </div>
                    <ChevronRight size={16} className="text-[var(--color-text-muted)] group-hover:text-purple-400 transition-colors shrink-0" />
                  </motion.div>
                );

                if (isNotification) {
                  const notifBadge = notifStatus === 'loading'
                    ? <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-400 animate-pulse">Memproses...</span>
                    : notifStatus === 'success'
                    ? <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400">✓ Aktif</span>
                    : notifStatus === 'error'
                    ? <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400">Gagal</span>
                    : null;

                  return (
                    <button key={f.title} className="w-full text-left" onClick={handleNotificationClick}>
                      <motion.div
                        whileHover={{ x: 4 }}
                        className="flex items-center gap-4 p-3.5 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] hover:border-purple-500/30 transition-all group"
                      >
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                          style={{ backgroundColor: `${f.color}12`, color: f.color }}
                        >
                          <f.icon size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-bold group-hover:text-purple-400 transition-colors">{f.title}</p>
                            {notifBadge}
                          </div>
                          <p className="text-[11px] text-[var(--color-text-muted)] line-clamp-1">{f.desc}</p>
                        </div>
                        <ChevronRight size={16} className="text-[var(--color-text-muted)] group-hover:text-purple-400 transition-colors shrink-0" />
                      </motion.div>
                    </button>
                  );
                }

                return (
                  <Link key={f.title} href={f.href}>
                    {CardContent}
                  </Link>
                );
              })}
            </div>
          </motion.div>

          {/* ═══ Account Actions ═══ */}
          <motion.div variants={itemVariants} className="px-4 space-y-2">
            <h2 className="text-base font-bold mb-3 px-1" style={{ fontFamily: "var(--font-display)" }}>
              ⚙️ Pengaturan Akun
            </h2>

            <Link href="/settings" className="w-full flex items-center gap-4 p-3.5 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] hover:border-purple-500/30 transition-all group text-left">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-zinc-500/10 text-zinc-400 group-hover:bg-purple-500/10 group-hover:text-purple-400 transition-colors">
                <Settings size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold group-hover:text-purple-400 transition-colors">Pengaturan</p>
                <p className="text-[11px] text-[var(--color-text-muted)]">Tema, bahasa, notifikasi</p>
              </div>
              <ChevronRight size={16} className="text-[var(--color-text-muted)] group-hover:text-purple-400 transition-colors" />
            </Link>

            <Link href="/settings" className="w-full flex items-center gap-4 p-3.5 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] hover:border-purple-500/30 transition-all group text-left">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-zinc-500/10 text-zinc-400 group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-colors">
                <Shield size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold group-hover:text-blue-400 transition-colors">Keamanan</p>
                <p className="text-[11px] text-[var(--color-text-muted)]">Password, sesi login</p>
              </div>
              <ChevronRight size={16} className="text-[var(--color-text-muted)] group-hover:text-blue-400 transition-colors" />
            </Link>

            <Link href="/about" className="w-full flex items-center gap-4 p-3.5 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] hover:border-purple-500/30 transition-all group text-left">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-zinc-500/10 text-zinc-400 group-hover:bg-pink-500/10 group-hover:text-pink-400 transition-colors">
                <BookOpen size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold group-hover:text-pink-400 transition-colors">Tentang AniVerse</p>
                <p className="text-[11px] text-[var(--color-text-muted)]">Info aplikasi, API, fitur</p>
              </div>
              <ChevronRight size={16} className="text-[var(--color-text-muted)] group-hover:text-pink-400 transition-colors" />
            </Link>

            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="w-full flex items-center gap-4 p-3.5 bg-red-500/5 rounded-2xl border border-red-500/10 hover:border-red-500/30 transition-all group text-left"
            >
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-red-500/10 text-red-500">
                {loggingOut ? <Loader2 size={20} className="animate-spin" /> : <LogOut size={20} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-red-400">Keluar</p>
                <p className="text-[11px] text-[var(--color-text-muted)]">Logout dari akun AniVerse</p>
              </div>
            </button>
          </motion.div>

          {/* App Info */}
          <motion.div variants={itemVariants} className="px-4 text-center space-y-1 pb-4">
            <p className="text-[10px] text-[var(--color-text-muted)]">AniVerse v2.0 — Tracker Anime Indonesia</p>
            <p className="text-[10px] text-[var(--color-text-muted)]">Data dari AniList • Streaming via Sanka Vollerei API</p>
          </motion.div>
        </motion.div>
      </main>
      <BottomNavbar />
    </>
  );
}
