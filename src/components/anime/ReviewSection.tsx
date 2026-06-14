import { motion } from "framer-motion";
import { Star, MessageSquare } from "lucide-react";
import Image from "next/image";
import { getScoreColor } from "@/lib/utils";
import type { AnimeReview } from "@/types/anime";

interface ReviewSectionProps {
  reviews: AnimeReview[];
}

export function ReviewSection({ reviews }: ReviewSectionProps) {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="py-12 text-center text-[var(--color-text-muted)]">
        <MessageSquare size={32} className="mx-auto mb-3 opacity-20" />
        <p>No reviews yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review, i) => (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          key={review.id}
          className="bg-[var(--color-surface)] p-4 rounded-[var(--radius-card)] border border-[var(--color-border)]"
        >
          {/* Header */}
          <div className="flex items-center gap-3 mb-3">
            <div className="relative w-10 h-10 rounded-full bg-[var(--color-surface-3)] overflow-hidden shrink-0">
              {review.user?.avatar ? (
                <Image
                  src={review.user.avatar}
                  alt={review.user?.name ?? "User"}
                  fill
                  className="object-cover"
                  unoptimized
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-xs text-[var(--color-text-muted)]">
                  {review.user?.name?.[0] ?? "?"}
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm truncate">{review.user?.name ?? "Anonymous"}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {review.score != null ? (
                  <BadgeScore score={review.score / 10} />
                ) : null}
                {review.createdAt && (
                  <span className="text-[10px] text-[var(--color-text-muted)]">
                    {new Date(review.createdAt * 1000).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="space-y-2">
            {review.summary && (
              <h4 className="text-sm font-bold leading-tight line-clamp-2">
                {review.summary}
              </h4>
            )}
            {/* Some reviews might have HTML in body, but AniList guarantees safe or markdown, but let's just strip html for safety or just show text summary */}
            <p className="text-xs leading-relaxed text-[var(--color-text-secondary)] line-clamp-6">
              {review.body ? review.body.replace(/<[^>]*>/g, '').trim() : ""}
            </p>
          </div>
          
          {/* Footer */}
          {review.rating != null && review.rating > 0 && (
             <div className="mt-3 text-[10px] font-medium text-[var(--color-text-muted)]">
               {review.rating} users found this helpful
             </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function BadgeScore({ score }: { score: number }) {
  return (
    <div className="flex items-center gap-1 bg-[var(--color-surface-2)] px-1.5 py-0.5 rounded pl-1">
      <Star size={10} fill={getScoreColor(score)} color={getScoreColor(score)} />
      <span className="text-[10px] font-bold leading-none" style={{ color: getScoreColor(score) }}>
        {score.toFixed(1)}
      </span>
    </div>
  );
}
