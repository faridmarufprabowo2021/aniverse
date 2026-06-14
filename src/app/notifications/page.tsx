"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, BellOff, BellRing, Check, AlertTriangle,
  Loader2, Play, Star, RefreshCcw, ChevronRight, Tv2
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface Notification {
  id: string;
  type: string;
  payload: {
    anime_id?: number;
    title?: string;
    episode?: number;
    cover_image?: string;
    message?: string;
  };
  is_read: boolean;
  created_at: string;
}

interface AiringAnime {
  mediaId: number;
  title: string;
  episode: number;
  coverImage: string;
}

// Toast system
function useToast() {
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" | "info" } | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);
  return { toast, showToast: setToast };
}

export default function NotificationsPage() {
  const router = useRouter();
  const supabase = createClient();
  const { toast, showToast } = useToast();

  const [user, setUser] = useState<{ id: string } | null>(null);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [airings, setAirings] = useState<AiringAnime[]>([]);
  const [loading, setLoading] = useState(true);
  const [notifStatus, setNotifStatus] = useState<"idle" | "loading" | "active" | "denied" | "unsupported">("idle");
  const [unreadCount, setUnreadCount] = useState(0);

  // Check notification permission status
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("Notification" in window)) {
      setNotifStatus("unsupported");
      return;
    }
    if (Notification.permission === "granted") setNotifStatus("active");
    else if (Notification.permission === "denied") setNotifStatus("denied");
    else setNotifStatus("idle");
  }, []);

  // Fetch user + notifications
  useEffect(() => {
    async function load() {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) { router.replace("/login?redirect=/notifications"); return; }
      setUser(u);

      // Load in-app notifications
      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", u.id)
        .order("created_at", { ascending: false })
        .limit(50);
      setNotifs(data || []);
      setUnreadCount((data || []).filter((n: Notification) => !n.is_read).length);
      setLoading(false);
    }
    load();
  }, []);

  // Fetch recent airings
  useEffect(() => {
    fetch("/api/notify-airing")
      .then(r => r.json())
      .then(d => setAirings(d.airings || []))
      .catch(() => {});
  }, []);

  const subscribeToNotifications = async () => {
    if (!user) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      showToast({ msg: "Browser tidak mendukung notifikasi push", type: "error" });
      return;
    }
    setNotifStatus("loading");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setNotifStatus("denied");
        showToast({ msg: "Izin notifikasi ditolak", type: "error" });
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error("VAPID key not configured");

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidKey,
      });

      await supabase.from("push_subscriptions").upsert({
        user_id: user.id,
        subscription_data: JSON.parse(JSON.stringify(sub)),
        device_type: /Mobi/.test(navigator.userAgent) ? "mobile" : "desktop",
        user_agent: navigator.userAgent.slice(0, 200),
        is_active: true,
        last_used_at: new Date().toISOString(),
      }, { onConflict: "user_id" });

      setNotifStatus("active");
      showToast({ msg: "✓ Notifikasi episode baru diaktifkan!", type: "success" });
    } catch (err: unknown) {
      setNotifStatus("idle");
      showToast({ msg: `Gagal: ${err instanceof Error ? err.message : "Error"}`, type: "error" });
    }
  };

  const markAllRead = async () => {
    if (!user || unreadCount === 0) return;
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id)
      .eq("is_read", false);
    setNotifs(prev => prev.map(n => ({ ...n, is_read: true })));
    setUnreadCount(0);
    showToast({ msg: "Semua notifikasi dibaca", type: "info" });
  };

  const markRead = async (id: string) => {
    await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const timeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return "baru saja";
    if (m < 60) return `${m} menit lalu`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h} jam lalu`;
    return `${Math.floor(h / 24)} hari lalu`;
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg)] pb-24">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -60 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -60 }}
            className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl shadow-2xl text-sm font-bold flex items-center gap-2 ${
              toast.type === "success" ? "bg-green-600 text-white" :
              toast.type === "error" ? "bg-red-600 text-white" :
              "bg-zinc-800 text-white"
            }`}
          >
            {toast.type === "success" ? <Check size={16} /> : toast.type === "error" ? <AlertTriangle size={16} /> : <Bell size={16} />}
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
              <Bell size={22} className="text-purple-400" />
              Notifikasi
              {unreadCount > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-purple-500 text-white text-xs font-bold">{unreadCount}</span>
              )}
            </h1>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Episode baru & update anime favoritmu</p>
          </div>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs font-semibold text-purple-400 hover:underline">
              Tandai semua dibaca
            </button>
          )}
        </div>

        {/* Push Notification Subscribe Banner */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-4 rounded-2xl border flex items-center gap-4 ${
            notifStatus === "active"
              ? "bg-green-500/5 border-green-500/20"
              : notifStatus === "denied"
              ? "bg-red-500/5 border-red-500/20"
              : "bg-purple-500/5 border-purple-500/20"
          }`}
        >
          <div className={`p-3 rounded-xl shrink-0 ${
            notifStatus === "active" ? "bg-green-500/10" :
            notifStatus === "denied" ? "bg-red-500/10" : "bg-purple-500/10"
          }`}>
            {notifStatus === "active" ? <BellRing size={22} className="text-green-400" /> :
             notifStatus === "denied" ? <BellOff size={22} className="text-red-400" /> :
             notifStatus === "loading" ? <Loader2 size={22} className="text-purple-400 animate-spin" /> :
             <Bell size={22} className="text-purple-400" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold">
              {notifStatus === "active" ? "Notifikasi Aktif ✓" :
               notifStatus === "denied" ? "Notifikasi Diblokir" :
               notifStatus === "unsupported" ? "Tidak Didukung" :
               "Aktifkan Notifikasi Episode Baru"}
            </p>
            <p className="text-xs text-[var(--color-text-muted)] mt-0.5">
              {notifStatus === "active" ? "Kamu akan dapat notifikasi saat episode baru tayang" :
               notifStatus === "denied" ? "Aktifkan notifikasi di pengaturan browser kamu" :
               notifStatus === "unsupported" ? "Browser ini tidak mendukung push notification" :
               "Dapatkan notifikasi langsung saat episode anime barumu tayang"}
            </p>
          </div>
          {(notifStatus === "idle" || notifStatus === "loading") && (
            <Button
              size="sm"
              onClick={subscribeToNotifications}
              loading={notifStatus === "loading"}
              className="shrink-0"
            >
              Aktifkan
            </Button>
          )}
        </motion.div>

        {/* Recently Aired Section */}
        {airings.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Tv2 size={14} className="text-pink-400" />
              <h2 className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Baru Tayang (24 Jam Terakhir)</h2>
            </div>
            <div className="space-y-2">
              {airings.slice(0, 8).map(a => (
                <Link key={`${a.mediaId}-${a.episode}`} href={`/anime/${a.mediaId}`}>
                  <div className="flex items-center gap-3 p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl hover:border-purple-500/30 transition-all group">
                    {a.coverImage && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={a.coverImage} alt={a.title} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate group-hover:text-purple-400 transition-colors">{a.title}</p>
                      <p className="text-xs text-[var(--color-text-muted)]">Episode {a.episode} sudah tayang</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 border border-green-500/20">BARU</span>
                      <ChevronRight size={14} className="text-[var(--color-text-muted)]" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* In-App Notifications */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell size={14} className="text-purple-400" />
              <h2 className="text-xs font-bold text-[var(--color-text-secondary)] uppercase tracking-wider">Riwayat Notifikasi</h2>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-1 text-[11px] text-[var(--color-text-muted)] hover:text-white transition-colors"
            >
              <RefreshCcw size={11} /> Refresh
            </button>
          </div>

          {loading ? (
            <div className="py-12 flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-purple-400" size={28} />
              <p className="text-xs text-[var(--color-text-muted)]">Memuat notifikasi...</p>
            </div>
          ) : notifs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 flex flex-col items-center gap-3 text-center"
            >
              <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center">
                <Bell size={28} className="text-[var(--color-text-muted)]" />
              </div>
              <div>
                <p className="text-sm font-bold">Belum ada notifikasi</p>
                <p className="text-xs text-[var(--color-text-muted)] mt-1">
                  Aktifkan notifikasi dan tambahkan anime ke daftar &quot;Sedang Nonton&quot;
                </p>
              </div>
              <Link href="/mylist">
                <Button size="sm" icon={<Play size={13} />}>Kelola Daftar Anime</Button>
              </Link>
            </motion.div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {notifs.map((n, i) => (
                  <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => !n.is_read && markRead(n.id)}
                    className={`relative flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-all ${
                      n.is_read
                        ? "bg-[var(--color-surface)] border-[var(--color-border)] opacity-70"
                        : "bg-purple-500/5 border-purple-500/20 hover:bg-purple-500/10"
                    }`}
                  >
                    {/* Unread dot */}
                    {!n.is_read && (
                      <div className="absolute top-3 right-3 w-2 h-2 rounded-full bg-purple-500" />
                    )}

                    {/* Icon */}
                    <div className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                      n.type === "new_episode" ? "bg-green-500/10" : "bg-blue-500/10"
                    }`}>
                      {n.type === "new_episode"
                        ? <Play size={14} className="text-green-400" fill="currentColor" />
                        : <Star size={14} className="text-blue-400" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      {n.type === "new_episode" && n.payload.title ? (
                        <>
                          <p className="text-sm font-bold text-[var(--color-text)] truncate">{n.payload.title}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">
                            Episode {n.payload.episode} sudah tayang!
                          </p>
                        </>
                      ) : (
                        <p className="text-sm text-[var(--color-text-secondary)]">{n.payload.message || "Notifikasi baru"}</p>
                      )}
                      <p className="text-[10px] text-[var(--color-text-muted)] mt-1">{timeAgo(n.created_at)}</p>
                    </div>

                    {n.payload.anime_id && (
                      <Link href={`/anime/${n.payload.anime_id}`} onClick={e => e.stopPropagation()}>
                        <ChevronRight size={16} className="text-[var(--color-text-muted)] hover:text-purple-400 transition-colors shrink-0 mt-1" />
                      </Link>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
