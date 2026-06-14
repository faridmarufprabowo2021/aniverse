"use client";

import { useState, useTransition } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { upsertWatchlistEntry, deleteWatchlistEntry, WatchlistStatus } from "@/lib/actions/list";

interface WatchlistModalProps {
  animeId: number;
  titleRomaji: string;
  coverImage?: string;
  totalEpisodes?: number | null;
  currentEntry?: {
    status: WatchlistStatus;
    progress: number;
    score: number | null;
    notes: string | null;
  };
  onClose: () => void;
}

export function WatchlistModal({
  animeId,
  titleRomaji,
  coverImage,
  totalEpisodes,
  currentEntry,
  onClose,
}: WatchlistModalProps) {
  const [status, setStatus] = useState<WatchlistStatus>(currentEntry?.status || "PLAN_TO_WATCH");
  const [progress, setProgress] = useState(currentEntry?.progress || 0);
  const [score, setScore] = useState(currentEntry?.score || 0);
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    startTransition(async () => {
      const res = await upsertWatchlistEntry({
        animeId,
        titleRomaji,
        coverImage,
        status,
        progress,
        score: score > 0 ? score : undefined,
      });

      if (!res.error) {
        onClose();
      } else {
        alert(res.error);
      }
    });
  };

  const handleDelete = () => {
    if (!confirm("Are you sure you want to remove this from your list?")) return;
    startTransition(async () => {
      const res = await deleteWatchlistEntry(animeId);
      if (!res.error) {
        onClose();
      } else {
        alert(res.error);
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 300 }}
        className="relative w-full max-w-md bg-[var(--color-surface)] sm:rounded-[var(--radius-modal)] rounded-t-[var(--radius-modal)] shadow-2xl flex flex-col max-h-[90vh]"
      >
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border)]">
          <h3 className="font-bold text-lg" style={{ fontFamily: "var(--font-display)" }}>
            List Entry
          </h3>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 overflow-y-auto space-y-6">
          {/* Status Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
              Status
            </label>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
              {(["WATCHING", "PLAN_TO_WATCH", "COMPLETED", "ON_HOLD", "DROPPED"] as WatchlistStatus[]).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setStatus(s);
                    if (s === "COMPLETED" && totalEpisodes) setProgress(totalEpisodes);
                  }}
                  className={`px-3 py-2 rounded-[var(--radius-button)] text-sm font-medium border transition-colors ${
                    status === s
                      ? "bg-[var(--color-primary-bg)] border-[var(--color-primary)] text-[var(--color-primary)]"
                      : "bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)]"
                  }`}
                >
                  {s.replace(/_/g, " ")}
                </button>
              ))}
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
             <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
              Episodes Watched
            </label>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={0}
                max={totalEpisodes || undefined}
                value={progress}
                onChange={(e) => setProgress(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-20 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-[var(--radius-button)] px-3 py-2 text-center outline-none focus:border-[var(--color-primary)]"
              />
              <span className="text-sm text-[var(--color-text-muted)]">
                / {totalEpisodes || "?"}
              </span>
              
              <div className="flex-1" />
              
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setProgress(p => Math.max(0, p - 1))}
              >-</Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setProgress(p => totalEpisodes ? Math.min(totalEpisodes, p + 1) : p + 1)}
              >+</Button>
            </div>
          </div>

          {/* Score */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
              Score (1-10)
            </label>
            <div className="flex items-center gap-1.5 scroll-x pb-1">
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <button
                  key={num}
                  onClick={() => setScore(num)}
                  className={`w-10 h-10 shrink-0 rounded-full text-sm font-semibold border transition-all ${
                    score === num
                      ? "bg-[var(--color-primary)] border-[var(--color-primary)] text-white shadow-lg"
                      : "bg-[var(--color-surface-2)] border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-border-hover)]"
                  }`}
                >
                  {num === 0 ? "-" : num}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-[var(--color-border)] flex gap-2 pt-safe">
          {currentEntry && (
             <Button variant="danger" size="lg" className="px-4" onClick={handleDelete} loading={isPending}>
               Remove
             </Button>
          )}
          <Button fullWidth size="lg" onClick={handleSave} loading={isPending}>
            {currentEntry ? "Update" : "Save"} Entry
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
