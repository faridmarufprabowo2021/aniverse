"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Calendar, Clock, Play, Loader2, Tv, Star } from "lucide-react";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNavbar } from "@/components/layout/BottomNavbar";
import { containerVariants, itemVariants } from "@/lib/animations";

// ═══════════════════════════════════════
// TYPES
// ═══════════════════════════════════════

interface ScheduleItem {
  id: number;
  airingAt: number;
  episode: number;
  timeUntilAiring: number;
  media: {
    id: number;
    title: { romaji: string; english?: string };
    coverImage: { large?: string; color?: string };
    format?: string;
    episodes?: number;
    averageScore?: number;
    genres: string[];
  };
}

// ═══════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════

const DAYS_ID = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const DAYS_SHORT = ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

function getWeekDays(): { label: string; short: string; date: Date; isToday: boolean }[] {
  const today = new Date();
  const days = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      label: DAYS_ID[d.getDay()],
      short: DAYS_SHORT[d.getDay()],
      date: d,
      isToday: i === 0,
    });
  }
  return days;
}

function formatTime(ts: number) {
  return new Date(ts * 1000).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}

function formatCountdown(seconds: number) {
  if (seconds <= 0) return "Sudah tayang";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 24) return `${Math.floor(h / 24)}h ${h % 24}j lagi`;
  if (h > 0) return `${h}j ${m}m lagi`;
  return `${m} menit lagi`;
}

// ═══════════════════════════════════════
// SCHEDULE CARD
// ═══════════════════════════════════════

function ScheduleCard({ item }: { item: ScheduleItem }) {
  const title = item.media.title.english || item.media.title.romaji;
  const isAired = item.timeUntilAiring <= 0;

  return (
    <Link href={`/anime/${item.media.id}`}>
      <motion.div
        whileHover={{ x: 4, scale: 1.01 }}
        className={`flex gap-4 p-3.5 rounded-2xl border transition-all group ${
          isAired
            ? "bg-green-500/5 border-green-500/10 hover:border-green-500/30"
            : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-purple-500/30"
        }`}
      >
        {/* Cover */}
        <div className="relative w-16 h-22 rounded-xl overflow-hidden bg-[var(--color-surface-2)] shrink-0 shadow-sm border border-white/5">
          {item.media.coverImage.large && (
            <Image
              src={item.media.coverImage.large}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-550"
              sizes="64px"
            />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <p className="text-sm font-bold line-clamp-1 group-hover:text-purple-400 transition-colors">
              {title}
            </p>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-1 font-semibold">
              Episode {item.episode}
              {item.media.episodes && ` / ${item.media.episodes}`}
              {item.media.format && ` • ${item.media.format}`}
            </p>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1.5">
              <Clock size={12} className={isAired ? "text-green-400 animate-pulse" : "text-purple-400"} />
              <span className={`text-[11px] font-extrabold ${isAired ? "text-green-400" : "text-purple-400"}`}>
                {isAired ? formatTime(item.airingAt) : formatCountdown(item.timeUntilAiring)}
              </span>
            </div>
            {item.media.averageScore && (
              <div className="flex items-center gap-1 bg-yellow-500/10 border border-yellow-500/20 px-1.5 py-0.5 rounded-lg text-yellow-500">
                <Star size={10} className="fill-yellow-500" />
                <span className="text-[10px] font-extrabold">
                  {(item.media.averageScore / 10).toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Play icon */}
        <div className="self-center shrink-0">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-md ${
            isAired ? "bg-green-500/10 text-green-400 hover:bg-green-500/20" : "bg-purple-500/10 text-purple-400"
          }`}>
            {isAired ? <Play size={14} fill="currentColor" className="ml-0.5" /> : <Clock size={14} />}
          </div>
        </div>
      </motion.div>
    </Link>
  );
}

// ═══════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════

export default function SchedulePage() {
  const weekDays = getWeekDays();
  const [selectedDay, setSelectedDay] = useState(0);
  const [schedules, setSchedules] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    const day = weekDays[selectedDay].date;
    const start = new Date(day);
    start.setHours(0, 0, 0, 0);
    const end = new Date(day);
    end.setHours(23, 59, 59, 999);

    const startTs = Math.floor(start.getTime() / 1000);
    const endTs = Math.floor(end.getTime() / 1000);

    fetch(`/api/anime/schedule?start=${startTs}&end=${endTs}`)
      .then(r => r.json())
      .then(data => {
        setSchedules(data.schedules || []);
        setLoading(false);
      })
      .catch(() => { setSchedules([]); setLoading(false); });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDay]);

  const selectedDate = weekDays[selectedDay];

  return (
    <>
      <TopBar />
      <main className="pt-safe pb-safe min-h-dvh">
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-7xl mx-auto w-full px-4 md:px-8 pb-28">
          {/* Header */}
          <motion.div variants={itemVariants} className="pt-20 pb-4">
            <h1 className="text-2xl font-black flex items-center gap-2 text-white" style={{ fontFamily: "var(--font-display)" }}>
              <Calendar size={24} className="text-purple-400" />
              Jadwal Tayang
            </h1>
            <p className="text-xs text-[var(--color-text-muted)] mt-1">
              Jadwal tayang anime simulcast terbaru hari demi hari
            </p>
          </motion.div>

          {/* Day Tabs */}
          <motion.div variants={itemVariants} className="mb-6">
            <div className="flex lg:grid lg:grid-cols-7 gap-2 overflow-x-auto lg:overflow-x-visible pb-2 lg:pb-0 scrollbar-none">
              {weekDays.map((day, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedDay(i)}
                  className={`flex flex-col items-center min-w-[62px] lg:min-w-0 py-3 px-3 rounded-2xl border transition-all ${
                    selectedDay === i
                      ? "bg-purple-500 border-purple-500 text-white shadow-lg shadow-purple-500/20 scale-[1.02]"
                      : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-purple-500/30"
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase tracking-wider">{day.short}</span>
                  <span className="text-lg font-black mt-0.5">{day.date.getDate()}</span>
                  {day.isToday && (
                    <div className={`w-1.5 h-1.5 rounded-full mt-1 ${selectedDay === i ? "bg-white" : "bg-purple-500"}`} />
                  )}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Day Label */}
          <motion.div variants={itemVariants} className="mb-4">
            <div className="flex items-center gap-2 border-b border-white/5 pb-2">
              <Tv size={16} className="text-purple-400" />
              <h2 className="text-sm font-extrabold text-white" style={{ fontFamily: "var(--font-display)" }}>
                {selectedDate.label}, {selectedDate.date.toLocaleDateString("id-ID", { day: "numeric", month: "long" })}
              </h2>
              <span className="ml-auto text-xs text-[var(--color-text-muted)] font-extrabold">
                {schedules.length} Anime Tayang
              </span>
            </div>
          </motion.div>

          {/* Schedule Grid */}
          <motion.div
            variants={itemVariants}
            className={loading || schedules.length === 0 ? "space-y-2" : "grid grid-cols-1 md:grid-cols-2 gap-4"}
          >
            {loading ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-3 col-span-full">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                <p className="text-xs text-[var(--color-text-muted)] font-semibold">Memuat jadwal tayang...</p>
              </div>
            ) : schedules.length === 0 ? (
              <div className="py-20 text-center space-y-3 col-span-full bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)]">
                <Calendar size={40} className="mx-auto text-[var(--color-text-muted)] opacity-30" />
                <p className="text-sm font-bold text-[var(--color-text-muted)]">Tidak ada anime yang dijadwalkan hari ini</p>
              </div>
            ) : (
              schedules.map(item => <ScheduleCard key={item.id} item={item} />)
            )}
          </motion.div>
        </motion.div>
      </main>
      <BottomNavbar />
    </>
  );
}
