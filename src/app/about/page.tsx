"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Play, BookOpen, Bell, List, Search, Star, Zap, Shield,
  Smartphone, Globe, ChevronRight, Tv2, Heart, Users,
  Sparkles, Code2, Database, ExternalLink
} from "lucide-react";
import { BottomNavbar } from "@/components/layout/BottomNavbar";
import { TopBar } from "@/components/layout/TopBar";

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
      <TopBar />
      
      {/* ── HERO ──────────────────────────────────────────── */}
      <div className="relative overflow-hidden bg-zinc-950/20 border-b border-white/5">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -left-20 w-80 h-80 rounded-full bg-purple-500/10 blur-3xl animate-pulse" />
          <div className="absolute top-10 right-0 w-72 h-72 rounded-full bg-pink-500/10 blur-3xl animate-pulse" style={{ animationDelay: "1s" }} />
          <div className="absolute top-40 left-1/2 w-60 h-60 rounded-full bg-blue-500/5 blur-3xl animate-pulse" style={{ animationDelay: "2s" }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 md:px-8 pt-24 md:pt-32 pb-16">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Headline */}
            <div className="md:col-span-7 text-center md:text-left space-y-5">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-xs font-bold text-purple-400"
              >
                <Sparkles size={12} /> Platform ACG Pilihanmu
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-4xl sm:text-5xl font-black mb-2 text-white leading-tight"
                style={{ fontFamily: "var(--font-display)" }}
              >
                Jelajahi Jagat{" "}
                <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                  AniVerse
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-[var(--color-text-secondary)] text-sm md:text-base leading-relaxed max-w-lg mx-auto md:mx-0"
              >
                Platform anime & manga all-in-one terlengkap untuk komunitas Indonesia.
                Streaming, baca manga, dan kelola daftar tontonan Anda secara instan —{" "}
                <strong className="text-white">gratis selamanya.</strong>
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2"
              >
                <Link href="/">
                  <button className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold text-sm shadow-lg shadow-purple-500/20 hover:scale-[1.03] transition-transform">
                    <Play size={14} fill="white" /> Mulai Menonton
                  </button>
                </Link>
                <Link href="/manga">
                  <button className="flex items-center gap-2 px-5 py-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] text-sm font-bold text-zinc-200 hover:border-purple-500/40 transition-colors">
                    <BookOpen size={14} /> Baca Manga
                  </button>
                </Link>
              </motion.div>
            </div>

            {/* Right Column: Visual Maskot Logo */}
            <div className="md:col-span-5 hidden md:flex justify-center items-center">
              <motion.div
                initial={{ scale: 0.8, rotate: -10, opacity: 0 }}
                animate={{ scale: 1, rotate: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.2 }}
                className="relative w-64 h-64 rounded-[40px] bg-gradient-to-br from-purple-500 to-pink-500 shadow-2xl shadow-purple-500/20 flex items-center justify-center group cursor-pointer"
              >
                <div className="absolute inset-2 bg-zinc-950 rounded-[32px] flex items-center justify-center transition-colors group-hover:bg-zinc-900 duration-500">
                  <Tv2 size={96} className="text-purple-400 group-hover:text-pink-400 transition-colors duration-500" />
                </div>
              </motion.div>
            </div>

          </div>
        </div>
      </div>

      {/* ── STATS ─────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 -mt-8 mb-12 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="flex items-center gap-4 p-4.5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-md"
            >
              <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-400 shrink-0">
                <s.icon size={20} />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-black text-white leading-none">{s.value}</p>
                <p className="text-[10px] text-[var(--color-text-muted)] font-bold uppercase tracking-wider mt-1">{s.label}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── FEATURES ──────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mb-12 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={16} className="text-purple-400" />
          <h2 className="text-lg font-black text-white" style={{ fontFamily: "var(--font-display)" }}>Fitur Unggulan</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 * i }}
              className={`p-5 rounded-3xl bg-gradient-to-br ${f.gradient} border border-[var(--color-border)] hover:border-opacity-50 transition-all`}
              style={{ borderColor: `${f.color}20` }}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl shrink-0 shadow" style={{ backgroundColor: `${f.color}15` }}>
                  <f.icon size={20} style={{ color: f.color }} />
                </div>
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-extrabold text-white">{f.title}</h3>
                    <span
                      className="text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase"
                      style={{ backgroundColor: `${f.color}15`, color: f.color }}
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
      </div>

      {/* ── ROW: MANGA READER & TECH STACK (DESKTOP COLUMN SIDE-BY-SIDE) ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 mb-12 grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Manga Reader Section */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-transparent border border-blue-500/15 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen size={18} className="text-blue-400" />
              <h2 className="text-base font-black text-white">Manga Reader Terintegrasi</h2>
              <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full bg-blue-500/15 text-blue-400 uppercase tracking-wider">Terbaru</span>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              Didukung oleh <strong className="text-white">Sanka Comic API</strong> — Dapatkan akses instan ke 12+ sumber manga dan manhwa bahasa Indonesia dengan loading cepat dan bypass hotlink protection.
            </p>
            <div className="grid grid-cols-3 gap-2 pt-2">
              {["Manga", "Manhwa", "Manhua"].map(t => (
                <div key={t} className="text-center py-2 rounded-xl bg-blue-500/5 border border-blue-500/10">
                  <p className="text-xs font-bold text-blue-300">{t}</p>
                </div>
              ))}
            </div>
          </div>
          <Link href="/manga" className="block pt-2">
            <button className="flex items-center gap-2 w-full justify-center px-4 py-2.5 rounded-xl bg-blue-500/15 border border-blue-500/20 text-blue-300 font-extrabold text-xs hover:bg-blue-500/25 transition-colors">
              <BookOpen size={12} /> Buka Manga Reader <ChevronRight size={12} />
            </button>
          </Link>
        </div>

        {/* Tech Stack Section */}
        <div className="p-5 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Code2 size={18} className="text-pink-400" />
              <h2 className="text-base font-black text-white">Teknologi Modern</h2>
            </div>
            <p className="text-xs text-[var(--color-text-secondary)]">
              AniVerse dibangun menggunakan teknologi pengembangan web modern yang menjamin kecepatan, performa tinggi, dan keamanan enkripsi.
            </p>
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              {techStack.map(t => (
                <div key={t.name} className="flex items-center gap-3 p-3 bg-zinc-950/40 border border-white/5 rounded-xl">
                  <div className="p-1.5 rounded-lg shrink-0" style={{ backgroundColor: `${t.color}15` }}>
                    <t.icon size={16} style={{ color: t.color }} />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{t.name}</p>
                    <p className="text-[9px] text-[var(--color-text-muted)] font-semibold truncate">{t.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ── ROW: PRIVACY & SHORTCUT (DESKTOP COLUMN SIDE-BY-SIDE) ── */}
      <div className="max-w-7xl mx-auto px-4 md:px-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Privacy Card */}
        <div className="p-5 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] flex flex-col justify-center text-center space-y-3">
          <Shield size={22} className="text-zinc-500 mx-auto" />
          <p className="text-xs font-bold text-white">AniVerse tidak menyimpan atau mendistribusikan berkas video.</p>
          <p className="text-[10px] text-[var(--color-text-muted)] leading-relaxed">
            Seluruh konten pemutar streaming disediakan oleh pihak ketiga. Data katalog anime disinkronkan melalui GraphQL API dari AniList.
          </p>
          <div className="flex justify-center gap-4 pt-1 font-bold">
            <a href="https://anilist.co" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-blue-400 hover:underline">
              AniList GraphQL <ExternalLink size={9} />
            </a>
            <a href="https://sankavollerei.web.id" target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-[10px] text-blue-400 hover:underline">
              Sanka API <ExternalLink size={9} />
            </a>
          </div>
        </div>

        {/* Settings Shortcut Card */}
        <Link href="/settings" className="block">
          <div className="p-5 rounded-3xl bg-[var(--color-surface)] border border-[var(--color-border)] hover:border-purple-500/25 transition-colors group flex items-center gap-4 h-full">
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 shrink-0">
              <Zap size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors">Pengaturan & Keamanan</p>
              <p className="text-xs text-[var(--color-text-muted)] mt-1">Konfigurasi tema tampilan, notifikasi, sandi akun, dan manajemen sesi perangkat Anda.</p>
            </div>
            <ChevronRight size={16} className="text-zinc-500 group-hover:text-purple-400 transition-colors shrink-0" />
          </div>
        </Link>

      </div>

    </div>
  );
}
