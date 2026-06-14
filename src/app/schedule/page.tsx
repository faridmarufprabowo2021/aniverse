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
        whileHover={{ x: 4 }}
        className={`flex gap-3 p-3 rounded-2xl border transition-all group ${
          isAired
            ? "bg-green-500/5 border-green-500/10 hover:border-green-500/30"
            : "bg-[var(--color-surface)] border-[var(--color-border)] hover:border-purple-500/30"
        }`}
      >
        {/* Cover */}
        <div className="relative w-14 h-20 rounded-xl overflow-hidden bg-[var(--color-surface-2)] shrink-0">
          {item.media.coverImage.large && (
            <Image
              src={item.media.coverImage.large}
              alt={title}
              fill
              className="object-cover group-hover:scale-105 transition-transform"
              sizes="56px"
            />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
          <div>
            <p className="text-sm font-bold line-clamp-1 group-hover:text-purple-400 transition-colors">
              {title}
            </p>
            <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
              Episode {item.episode}
              {item.media.episodes && ` / ${item.media.episodes}`}
              {item.media.format && ` • ${item.media.format}`}
            </p>
          </div>
          <div className="flex items-center justify-between mt-1.5">
            <div className="flex items-center gap-1.5">
              <Clock size={11} className={isAired ? "text-green-400" : "text-purple-400"} />
              <span className={`text-[11px] font-semibold ${isAired ? "text-green-400" : "text-purple-400"}`}>
                {isAired ? formatTime(item.airingAt) : formatCountdown(item.timeUntilAiring)}
              </span>
            </div>
            {item.media.averageScore && (
              <div className="flex items-center gap-1">
                <Star size={10} className="text-yellow-500" fill="currentColor" />
                <span className="text-[10px] text-[var(--color-text-muted)]">
                  {(item.media.averageScore / 10).toFixed(1)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Play icon */}
        <div className="self-center shrink-0">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
            isAired ? "bg-green-500/10 text-green-400" : "bg-purple-500/10 text-purple-400"
          }`}>
            {isAired ? <Play size={12} fill="currentColor" /> : <Clock size={12} />}
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
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="max-w-2xl mx-auto w-full px-4 pb-28">
          {/* Header */}
          <motion.div variants={itemVariants} className="pt-20 pb-4">
            <h1 className="text-2xl font-black flex items-center gap-2" style={{ fontFamily: "var(--font-display)" }}>
              <Calendar size={24} className="text-purple-400" />
              Jadwal Tayang
            </h1>
            <p className="text-sm text-[var(--color-text-muted)] mt-1">
              Anime yang tayang minggu ini
            </p>
          </motion.div>

          {/* Day Tabs */}
          <motion.div variants={itemVariants} className="mb-6">
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {weekDays.map((day, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedDay(i)}
                  className={`flex flex-col items-center min-w-[56px] py-2.5 px-3 rounded-2xl border transition-all ${
                    selectedDay === i
                      ? "bg-purple-500 border-purple-500 text-white shadow-lg shadow-purple-500/20"
                      : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-purple-500/30"
                  }`}
                >
                  <span className="text-[10px] font-semibold uppercase">{day.short}</span>
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
            <div className="flex items-center gap-2">
              <Tv size={16} className="text-purple-400" />
              <h2 className="text-base font-bold" style={{ fontFamily: "var(--font-display)" }}>
                {selectedDate.label}, {selectedDate.date.toLocaleDateString("id-ID", { day: "numeric", month: "long" })}
              </h2>
              <span className="ml-auto text-xs text-[var(--color-text-muted)] font-semibold">
                {schedules.length} anime
              </span>
            </div>
          </motion.div>

          {/* Schedule List */}
          <motion.div variants={itemVariants} className="space-y-2">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16 space-y-3">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                <p className="text-xs text-[var(--color-text-muted)]">Memuat jadwal...</p>
              </div>
            ) : schedules.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <Calendar size={40} className="mx-auto text-[var(--color-text-muted)] opacity-40" />
                <p className="text-sm font-semibold text-[var(--color-text-muted)]">Tidak ada anime yang tayang hari ini</p>
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
