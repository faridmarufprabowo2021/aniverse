"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Play, Plus, Star, ChevronLeft, ChevronRight } from "lucide-react";
import type { AnimeCard } from "@/types/anime";
import {
  getCoverImage,
  getBestTitle,
  formatScore,
  getScoreColor,
  formatStatus,
  formatCountdown,
} from "@/lib/utils";
import { heroVariants } from "@/lib/animations";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Skeleton } from "@/components/ui/Skeleton";

// ═══════════════════════════════════════
// HERO BANNER CAROUSEL
// ═══════════════════════════════════════

interface HeroBannerProps {
  anime: AnimeCard[];
  loading?: boolean;
}

export function HeroBanner({ anime, loading }: HeroBannerProps) {
  const [current, setCurrent] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  const next = useCallback(() => {
    if (anime.length > 0) setCurrent((c) => (c + 1) % anime.length);
  }, [anime.length]);

  const prev = useCallback(() => {
    if (anime.length > 0) setCurrent((c) => (c - 1 + anime.length) % anime.length);
  }, [anime.length]);

  // Auto-advance
  useEffect(() => {
    if (!autoPlay || anime.length === 0) return;
    const id = setInterval(next, 6000);
    return () => clearInterval(id);
  }, [autoPlay, next, anime.length]);

  if (loading || anime.length === 0) {
    return (
      <div className="relative w-full overflow-hidden" style={{ height: "65vw", maxHeight: 520 }}>
        <Skeleton className="absolute inset-0" rounded="lg" />
        <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3">
          <Skeleton height={28} className="w-2/3" rounded="sm" />
          <Skeleton height={14} className="w-1/2" rounded="sm" />
          <Skeleton height={40} className="w-32" rounded="md" />
        </div>
      </div>
    );
  }

  const item = anime[current];
  if (!item) return null;

  const title = getBestTitle(item.title);
  const banner = item.coverImage?.extraLarge ?? getCoverImage(item.coverImage);

  return (
    <div
      className="relative w-full overflow-hidden select-none"
      style={{ height: "70vw", maxHeight: 560 }}
      onMouseEnter={() => setAutoPlay(false)}
      onMouseLeave={() => setAutoPlay(true)}
    >
      {/* Backgrounds (cross-fade) */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          variants={heroVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          className="absolute inset-0"
        >
          <Image
            src={banner}
            alt={title}
            fill
            priority
            className="object-cover hero-bg"
            sizes="100vw"
          />
          {/* Gradient overlays */}
          <div className="absolute inset-0 gradient-bottom" />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-bg)] via-transparent to-transparent" />
        </motion.div>
      </AnimatePresence>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`content-${current}`}
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.45, delay: 0.1 } }}
          exit={{ opacity: 0 }}
          className="absolute bottom-0 left-0 right-0 px-4 pb-6 space-y-3 pt-safe"
        >
          {/* Genre tags */}
          <div className="flex flex-wrap gap-1.5">
            {item.genres.slice(0, 3).map((g) => (
              <Badge key={g} variant="genre" genre={g} />
            ))}
          </div>

          {/* Title */}
          <h1
            className="text-2xl font-black leading-tight line-clamp-2 max-w-xs"
            style={{ fontFamily: "var(--font-display)", textShadow: "0 2px 12px rgba(0,0,0,0.6)" }}
          >
            {title}
          </h1>

          {/* Meta */}
          <div className="flex items-center gap-3 text-sm">
            {item.averageScore != null && (
              <div className="flex items-center gap-1">
                <Star size={14} fill={getScoreColor(item.averageScore)} color={getScoreColor(item.averageScore)} />
                <span className="font-bold" style={{ color: getScoreColor(item.averageScore) }}>
                  {formatScore(item.averageScore)}
                </span>
              </div>
            )}
            <span className="text-[var(--color-text-secondary)]">{formatStatus(item.status)}</span>
            {item.episodes && (
              <span className="text-[var(--color-text-secondary)]">{item.episodes} eps</span>
            )}
            {item.nextAiringEpisode && (
              <span className="text-[var(--color-accent-2)] font-semibold">
                Ep {item.nextAiringEpisode.episode} in {formatCountdown(item.nextAiringEpisode.timeUntilAiring)}
              </span>
            )}
          </div>

          {/* CTA Buttons */}
          <div className="flex items-center gap-2">
            <Link href={`/anime/${item.id}`}>
              <Button icon={<Play size={16} fill="white" />} size="md">
                View Details
              </Button>
            </Link>
            <Button variant="outline" size="md" icon={<Plus size={16} />}>
              Add to List
            </Button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Arrow controls */}
      <button
        onClick={prev}
        className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full glass flex items-center justify-center text-white opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Previous"
      >
        <ChevronLeft size={18} />
      </button>
      <button
        onClick={next}
        className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full glass flex items-center justify-center text-white opacity-60 hover:opacity-100 transition-opacity"
        aria-label="Next"
      >
        <ChevronRight size={18} />
      </button>

      {/* Dot indicators */}
      <div className="absolute bottom-3 right-4 flex items-center gap-1.5">
        {anime.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className="transition-all duration-300 rounded-full"
            style={{
              width: i === current ? 20 : 6,
              height: 6,
              background: i === current ? "var(--color-primary)" : "var(--color-border-hover)",
            }}
            aria-label={`Slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
