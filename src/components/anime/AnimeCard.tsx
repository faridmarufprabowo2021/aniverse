"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Star, Tv } from "lucide-react";
import type { AnimeCard as AnimeCardType } from "@/types/anime";
import {
  cn,
  formatScore,
  getScoreColor,
  getBestTitle,
  getCoverImage,
  formatStatus,
  formatCountdown,
} from "@/lib/utils";
import { itemVariants } from "@/lib/animations";
import { Skeleton } from "@/components/ui/Skeleton";

// ═══════════════════════════════════════
// ANIME CARD
// ═══════════════════════════════════════

interface AnimeCardProps {
  anime: AnimeCardType;
  rank?: number;
  showScore?: boolean;
  className?: string;
}

export function AnimeCard({ anime, rank, showScore = true, className }: AnimeCardProps) {
  const title = getBestTitle(anime.title);
  const cover = getCoverImage(anime.coverImage);
  const score = anime.averageScore;
  const dominantColor = anime.coverImage?.color ?? "var(--color-primary)";

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ scale: 1.03, boxShadow: "0 8px 32px rgba(108,99,255,0.3)" }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={cn("relative group cursor-pointer", className)}
    >
      <Link href={`/anime/${anime.id}`} className="block">
        {/* Poster */}
        <div
          className="relative overflow-hidden bg-[var(--color-surface)] rounded-[var(--radius-card)]"
          style={{ aspectRatio: "var(--poster-ratio)" }}
        >
          <Image
            src={cover}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {/* Gradient overlay */}
          <div className="absolute inset-0 gradient-bottom pointer-events-none" />

          {/* Rank badge */}
          {rank != null && (
            <div
              className="absolute top-2 left-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white"
              style={{ background: dominantColor }}
            >
              #{rank}
            </div>
          )}

          {/* Airing badge */}
          {anime.isAiring && (
            <div className="absolute top-2 right-2 badge-airing px-2 py-0.5 rounded-full text-xs font-semibold">
              LIVE
            </div>
          )}

          {/* Score pill */}
          {showScore && score != null && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1">
              <Star size={10} fill="currentColor" style={{ color: getScoreColor(score) }} />
              <span
                className="text-xs font-bold"
                style={{ color: getScoreColor(score) }}
              >
                {formatScore(score)}
              </span>
            </div>
          )}

          {/* Format pill */}
          {anime.format && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded bg-black/50 text-xs text-[var(--color-text-secondary)]">
              <Tv size={8} />
              {anime.format === "TV_SHORT" ? "Short" : anime.format}
            </div>
          )}
        </div>

        {/* Title + Meta */}
        <div className="mt-2 space-y-0.5">
          <h3 className="text-sm font-semibold line-clamp-2 text-[var(--color-text-primary)] group-hover:text-[var(--color-primary)] transition-colors duration-150">
            {title}
          </h3>
          <p className="text-xs text-[var(--color-text-muted)]">
            {anime.year && `${anime.year} · `}
            {formatStatus(anime.status)}
            {anime.nextAiringEpisode && (
              <span className="ml-1 text-[var(--color-accent-2)]">
                · Ep {anime.nextAiringEpisode.episode} in{" "}
                {formatCountdown(anime.nextAiringEpisode.timeUntilAiring)}
              </span>
            )}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}

// ═══════════════════════════════════════
// SKELETON
// ═══════════════════════════════════════

export function AnimeCardSkeleton({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <div className={cn("space-y-2", className)} style={style}>
      <Skeleton
        className="w-full"
        style={{ aspectRatio: "2/3" }}
        rounded="md"
      />
      <Skeleton height={14} className="w-4/5" />
      <Skeleton height={12} className="w-2/5" />
    </div>
  );
}

// ═══════════════════════════════════════
// ANIME GRID
// ═══════════════════════════════════════

interface AnimeGridProps {
  anime: AnimeCardType[];
  loading?: boolean;
  skeletonCount?: number;
  showScore?: boolean;
  className?: string;
}

export function AnimeGrid({
  anime,
  loading,
  skeletonCount = 12,
  showScore = true,
  className,
}: AnimeGridProps) {
  if (loading) {
    return (
      <div
        className={cn(
          "grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
          className
        )}
      >
        {Array.from({ length: skeletonCount }).map((_, i) => (
          <AnimeCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: 0.04, delayChildren: 0.05 } },
      }}
      className={cn(
        "grid grid-cols-2 gap-x-3 gap-y-5 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6",
        className
      )}
    >
      {anime.map((a) => (
        <AnimeCard key={a.id} anime={a} rank={undefined} showScore={showScore} />
      ))}
    </motion.div>
  );
}

// ═══════════════════════════════════════
// ANIME CAROUSEL (horizontal scroll)
// ═══════════════════════════════════════

interface AnimeCarouselProps {
  anime: AnimeCardType[];
  loading?: boolean;
  showScore?: boolean;
  cardWidth?: number;
}

export function AnimeCarousel({
  anime,
  loading,
  showScore = true,
  cardWidth = 140,
}: AnimeCarouselProps) {
  if (loading) {
    return (
      <div className="scroll-x flex gap-3 pb-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <AnimeCardSkeleton
            key={i}
            className="shrink-0"
            style={{ width: cardWidth }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="scroll-x flex gap-3 pb-2">
      {anime.map((a) => (
        <div key={a.id} className="shrink-0 snap-item" style={{ width: cardWidth }}>
          <AnimeCard anime={a} showScore={showScore} />
        </div>
      ))}
    </div>
  );
}
