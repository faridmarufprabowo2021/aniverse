"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Play, BookOpen, Bell, List, Search, Star, Zap, Shield,
  Smartphone, Globe, ChevronRight, Tv2, Heart, Users,
  Sparkles, Code2, Database, ExternalLink
} from "lucide-react";
import { BottomNavbar } from "@/components/layout/BottomNavbar";

const features = [
  {
    icon: Tv2,
    title: "Streaming Anime",
    desc: "Tonton ribuan anime Sub Indo gratis dengan 5 provider: Samehadaku, Stream HD, Otakudesu, Oploverz, Winbu. Multi-server dengan fallback otomatis.",
    color: "#a855f7",
    gradient: "from-purple-500/20 to-pink-500/5",
    badge: "5 Provider",
  },
  {
    icon: BookOpen,
    title: "Baca Manga",
    desc: "Baca manga, manhwa & manhua langsung di app. Reader long-strip & paging dengan 12+ sumber termasuk Komiku, BacaKomik, Komikstation.",
    color: "#3b82f6",
    gradient: "from-blue-500/20 to-cyan-500/5",
    badge: "12+ Sumber",
  },
  {
    icon: Bell,
    title: "Notifikasi Episode",
    desc: "Dapatkan push notification otomatis saat episode anime favoritmu tayang. Notif langsung ke HP tanpa perlu buka app.",
    color: "#f59e0b",
    gradient: "from-amber-500/20 to-orange-500/5",
    badge: "Real-time",
  },
  {
    icon: List,
    title: "Daftar Anime",
    desc: "Kelola anime dengan status Watching, Completed, Plan to Watch, Dropped. Simpan rating bintang dan progres episode.",
    color: "#10b981",
    gradient: "from-emerald-500/20 to-green-500/5",
    badge: "Sync Cloud",
  },
  {
    icon: Search,
    title: "Cari Multi-Provider",
    desc: "Cari anime di semua provider sekaligus. Jika tidak ditemukan di satu provider, sistem otomatis coba provider lain.",
    color: "#ec4899",
    gradient: "from-pink-500/20 to-rose-500/5",
    badge: "Pintar",
  },
  {
    icon: Smartphone,
    title: "Progressive Web App",
    desc: "Install AniVerse seperti app native di HP kamu. Works offline, layar penuh, dan bisa di-install dari browser tanpa App Store.",
    color: "#06b6d4",
    gradient: "from-cyan-500/20 to-blue-500/5",
    badge: "Installable",
  },
];

const techStack = [
  { name: "Next.js 15", desc: "App Framework", icon: Code2, color: "#ffffff" },
  { name: "Supabase", desc: "Database & Auth", icon: Database, color: "#3ecf8e" },
  { name: "AniList API", desc: "Anime Data", icon: Star, color: "#02a9ff" },
  { name: "Sanka API", desc: "Streaming & Manga", icon: Play, color: "#f59e0b" },
];

const stats = [
  { label: "Anime Tersedia", value: "10.000+", icon: Tv2 },
  { label: "Sumber Manga", value: "12+", icon: BookOpen },
  { label: "Provider Streaming", value: "5", icon: Globe },
  { label: "Gratis Selamanya", value: "100%", icon: Heart },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--color-bg)] pb-28">
      {/* ── HERO ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-72 h-72 rounded-full bg-purple-500/20 blur-3xl animate-pulse" />
          <div className="absolute top-10 right-0 w-60 h-60 rounded-full bg-pink-500/15 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute top-40 left-1/2 w-48 h-48 rounded-full bg-blue-500/10 blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
        </div>

        <div className="relative max-w-lg mx-auto px-4 pt-16 pb-10 text-center">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-purple-500 to-pink-500 shadow-2xl shadow-purple-500/40 mb-4"
          >
            <Tv2 size={36} className="text-white" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-black mb-2"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              AniVerse
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-[var(--color-text-secondary)] text-sm leading-relaxed max-w-xs mx-auto"
          >
            Platform anime & manga all-in-one untuk Indonesia. <br />
            Streaming, baca, dan kelola daftar tontonmu — <strong className="text-white">gratis selamanya.</strong>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-3 mt-5"
          >
            <Link href="/">
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm shadow-lg shadow-purple-500/30 hover:scale-105 transition-transform">
                <Play size={16} fill="white" /> Mulai Nonton
              </button>
            </Link>
            <Link href="/manga">
              <button className="flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-bold hover:border-purple-500/40 transition-colors">
                <BookOpen size={16} /> Baca Manga
              </button>
            </Link>
          </motion.div>
        </div>
      </div>

      {/* ── STATS ─────────────────────────────────────────── */}
      <div className="max-w-lg mx-auto px-4 mb-8">
        <div className="grid grid-cols-2 gap-3">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1 * i }}
              className="flex items-center gap-3 p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl"
            >
              <div className="p-2 rounded-xl bg-purple-500/10">
                <s.icon size={18} className="text-purple-400" />
              </div>
              <div>
                <p className="text-xl font-black">{s.value}</p>
                <p className="text-[10px] text-[var(--color-text-muted)]">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ──────────────────────────────────────── */}
      <div className="max-w-lg mx-auto px-4 mb-8 space-y-3">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles size={16} className="text-purple-400" />
          <h2 className="text-lg font-black">Fitur Unggulan</h2>
        </div>

        {features.map((f, i) => (
          <motion.div
            key={f.title}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.05 * i }}
            className={`p-4 rounded-2xl bg-gradient-to-r ${f.gradient} border border-[var(--color-border)] hover:border-opacity-50 transition-all`}
            style={{ borderColor: `${f.color}20` }}
          >
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl shrink-0" style={{ backgroundColor: `${f.color}20` }}>
                <f.icon size={20} style={{ color: f.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-black">{f.title}</h3>
                  <span
                    className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ backgroundColor: `${f.color}20`, color: f.color }}
                  >
                    {f.badge}
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{f.desc}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* ── COMIC API SECTION ─────────────────────────────── */}
      <div className="max-w-lg mx-auto px-4 mb-8">
        <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-transparent border border-blue-500/20">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen size={18} className="text-blue-400" />
            <h2 className="text-base font-black">Manga Reader</h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400">BARU</span>
          </div>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed mb-4">
            Powered by <strong className="text-white">Sanka Vollerei Comic API</strong> — akses 12+ sumber manga Indonesia
            termasuk Komiku, BacaKomik, Komikstation, dan lebih banyak lagi.
          </p>
          <div className="grid grid-cols-3 gap-2 mb-4">
            {["Manga", "Manhwa", "Manhua"].map(t => (
              <div key={t} className="text-center p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <p className="text-xs font-bold text-blue-300">{t}</p>
              </div>
            ))}
          </div>
          <Link href="/manga">
            <button className="flex items-center gap-2 w-full justify-center px-4 py-2.5 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-300 font-bold text-sm hover:bg-blue-500/30 transition-colors">
              <BookOpen size={14} /> Buka Manga Reader <ChevronRight size={14} />
            </button>
          </Link>
        </div>
      </div>

      {/* ── TECH STACK ────────────────────────────────────── */}
      <div className="max-w-lg mx-auto px-4 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <Code2 size={16} className="text-pink-400" />
          <h2 className="text-lg font-black">Teknologi</h2>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {techStack.map(t => (
            <div key={t.name} className="flex items-center gap-3 p-3 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-xl">
              <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${t.color}20` }}>
                <t.icon size={16} style={{ color: t.color }} />
              </div>
              <div>
                <p className="text-xs font-black">{t.name}</p>
                <p className="text-[9px] text-[var(--color-text-muted)]">{t.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── PRIVACY & LEGAL ───────────────────────────────── */}
      <div className="max-w-lg mx-auto px-4 mb-4">
        <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] text-center space-y-2">
          <Shield size={20} className="text-[var(--color-text-muted)] mx-auto" />
          <p className="text-xs font-bold">AniVerse tidak menyimpan atau mendistribusikan konten video.</p>
          <p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed">
            Seluruh konten streaming disediakan oleh pihak ketiga melalui Sanka Vollerei API.
            Data anime disediakan oleh AniList GraphQL API.
          </p>
          <div className="flex justify-center gap-4 pt-1">
            <a href="https://anilist.co" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-blue-400 hover:underline">
              AniList <ExternalLink size={9} />
            </a>
            <a href="https://sankavollerei.web.id" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-blue-400 hover:underline">
              Sanka API <ExternalLink size={9} />
            </a>
          </div>
        </div>
      </div>

      {/* ── SETTINGS SHORTCUT ─────────────────────────────── */}
      <div className="max-w-lg mx-auto px-4">
        <Link href="/settings">
          <div className="flex items-center gap-3 p-4 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl hover:border-purple-500/30 transition-colors group">
            <div className="p-2 rounded-xl bg-purple-500/10">
              <Zap size={18} className="text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-black group-hover:text-purple-400 transition-colors">Pengaturan & Keamanan</p>
              <p className="text-[10px] text-[var(--color-text-muted)]">Tema, notifikasi, password, dan akun</p>
            </div>
            <ChevronRight size={16} className="text-[var(--color-text-muted)]" />
          </div>
        </Link>
      </div>

      <BottomNavbar />
    </div>
  );
}
