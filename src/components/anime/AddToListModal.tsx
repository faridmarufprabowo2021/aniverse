"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, PlayCircle, CheckCircle2, BookmarkPlus, XCircle, Star, Loader2, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createClient } from "@/lib/supabase/client";

// ─── Status must match the DB CHECK constraint (uppercase) ───
type WatchStatus = "WATCHING" | "COMPLETED" | "PLAN_TO_WATCH" | "DROPPED";

interface AddToListModalProps {
  isOpen: boolean;
  onClose: () => void;
  anime: any; // Full anime object from AniList
  userId: string;
}

const STATUS_OPTIONS: { id: WatchStatus; label: string; icon: typeof PlayCircle; color: string }[] = [
  { id: "WATCHING",      label: "Sedang Nonton", icon: PlayCircle,    color: "text-purple-400 border-purple-500/50 bg-purple-500/10" },
  { id: "COMPLETED",     label: "Selesai",        icon: CheckCircle2,  color: "text-green-400 border-green-500/50 bg-green-500/10" },
  { id: "PLAN_TO_WATCH", label: "Ingin Nonton",   icon: BookmarkPlus,  color: "text-blue-400 border-blue-500/50 bg-blue-500/10" },
  { id: "DROPPED",       label: "Drop",           icon: XCircle,       color: "text-red-400 border-red-500/50 bg-red-500/10" },
];

export function AddToListModal({ isOpen, onClose, anime, userId }: AddToListModalProps) {
  const [status, setStatus] = useState<WatchStatus>("PLAN_TO_WATCH");
  const [progress, setProgress] = useState(0);
  const [score, setScore] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [existingId, setExistingId] = useState<string | null>(null);

  const supabase = createClient();

  useEffect(() => {
    if (!isOpen || !userId || !anime?.id) return;
    setLoading(true);
    const load = async () => {
      // Use maybeSingle() — returns null (not 406) when no row found
      const { data, error } = await supabase
        .from("user_anime_list")
        .select("*")
        .eq("user_id", userId)
        .eq("anime_id", anime.id)
        .maybeSingle();

      if (data) {
        setStatus(data.status as WatchStatus);
        setProgress(data.progress || 0);
        setScore(data.score || 0);
        setExistingId(data.id);
      } else {
        setStatus("WATCHING");
        setProgress(0);
        setScore(0);
        setExistingId(null);
      }
      setLoading(false);
    };
    load();
  }, [isOpen, userId, anime?.id]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!userId || !anime?.id) return;
    setSaving(true);

    try {
      // ─── 1. Upsert anime_cache using correct DB column names ───
      const { error: cacheErr } = await supabase.from("anime_cache").upsert({
        id: anime.id,
        source: "anilist",
        title_romaji: anime.title?.romaji || "Unknown",
        title_english: anime.title?.english || null,
        title_native: anime.title?.native || null,
        cover_image_url: anime.coverImage?.medium || null,
        cover_image_large: anime.coverImage?.large || null,
        format: anime.format || null,
        episodes: anime.episodes || null,
        status: anime.status || "FINISHED",
        average_score: anime.averageScore ? anime.averageScore / 10 : null,
        is_airing: anime.status === "RELEASING",
      }, { onConflict: "id" });

      if (cacheErr) {
        console.error("anime_cache upsert error:", cacheErr);
        setToast(`❌ Error cache: ${cacheErr.message}`);
        setSaving(false);
        return;
      }

      // ─── 2. Upsert user_anime_list with UPPERCASE status ───
      const { error: listErr } = await supabase.from("user_anime_list").upsert({
        user_id: userId,
        anime_id: anime.id,
        status,                           // Already UPPERCASE from state
        progress,
        score: score === 0 ? null : score,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id,anime_id" }); // No space between columns

      if (listErr) {
        console.error("user_anime_list upsert error:", listErr);
        setToast(`❌ Error simpan: ${listErr.message}`);
        setSaving(false);
        return;
      }

      setToast("✓ Daftar berhasil disimpan!");
      setTimeout(onClose, 1200);
    } catch (e: any) {
      console.error("handleSave error:", e);
      setToast(`❌ ${e?.message || "Gagal menyimpan"}`);
    }
    setSaving(false);
  };

  const handleRemove = async () => {
    if (!existingId) return;
    setSaving(true);
    const { error } = await supabase
      .from("user_anime_list")
      .delete()
      .eq("id", existingId);
    if (error) {
      setToast(`❌ Gagal hapus: ${error.message}`);
    } else {
      setToast("🗑 Dihapus dari daftar");
      setTimeout(onClose, 1200);
    }
    setSaving(false);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
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
          transition={{ type: "spring", damping: 25, stiffness: 200 }}
          className="relative w-full sm:w-[400px] bg-[var(--color-surface)] sm:rounded-2xl rounded-t-2xl border-t sm:border border-[var(--color-border)] shadow-2xl overflow-hidden shadow-purple-500/10 flex flex-col max-h-[90vh]"
        >
          {/* Loading overlay */}
          {loading && (
            <div className="absolute inset-0 z-10 bg-[var(--color-surface)]/80 flex items-center justify-center">
              <Loader2 className="animate-spin text-purple-500" />
            </div>
          )}

          {/* Toast */}
          <AnimatePresence>
            {toast && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className={`absolute top-14 left-4 right-4 z-20 px-4 py-2.5 rounded-xl text-sm font-bold text-center shadow-lg ${
                  toast.startsWith("✓") ? "bg-green-600 text-white" : "bg-red-600 text-white"
                }`}
              >
                {toast}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Header */}
          <div className="px-5 py-4 border-b border-[var(--color-border)] flex items-center justify-between sticky top-0 bg-[var(--color-surface)] z-10">
            <div>
              <h3 className="font-black text-lg" style={{ fontFamily: "var(--font-display)" }}>
                Tambah Daftar
              </h3>
              <p className="text-[11px] text-[var(--color-text-muted)] line-clamp-1">
                {anime?.title?.english || anime?.title?.romaji}
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-[var(--color-surface-2)]">
              <X size={18} />
            </button>
          </div>

          <div className="p-5 flex-1 overflow-y-auto space-y-6">
            {/* Status Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)]">
                Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                {STATUS_OPTIONS.map(s => {
                  const isActive = status === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setStatus(s.id)}
                      className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border transition-all ${
                        isActive ? s.color : "border-[var(--color-border)] bg-[var(--color-surface-2)] hover:border-[var(--color-text-muted)] text-[var(--color-text-secondary)]"
                      }`}
                    >
                      <s.icon size={20} />
                      <span className="text-[11px] font-bold">{s.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Progress */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex justify-between">
                <span>Progress Episode</span>
                <span className="text-purple-400">{progress} / {anime?.episodes || "?"}</span>
              </label>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setProgress(p => Math.max(0, p - 1))}
                  className="w-10 h-10 rounded-xl bg-[var(--color-surface-2)] flex items-center justify-center font-bold hover:bg-purple-500 hover:text-white transition-colors"
                >-</button>
                <input
                  type="number"
                  value={progress}
                  onChange={e => setProgress(Math.max(0, parseInt(e.target.value) || 0))}
                  className="flex-1 h-10 bg-[var(--color-surface-2)] rounded-xl text-center font-bold border border-transparent focus:border-purple-500 outline-none"
                />
                <button
                  onClick={() => setProgress(p => anime?.episodes ? Math.min(anime.episodes, p + 1) : p + 1)}
                  className="w-10 h-10 rounded-xl bg-[var(--color-surface-2)] flex items-center justify-center font-bold hover:bg-purple-500 hover:text-white transition-colors"
                >+</button>
              </div>
            </div>

            {/* Rating */}
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[var(--color-text-muted)] flex justify-between">
                <span>Rating</span>
                <span className="text-yellow-500">{score > 0 ? `${score}/10` : "Belum dinilai"}</span>
              </label>
              <div className="flex items-center justify-between">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(star => (
                  <button
                    key={star}
                    onClick={() => setScore(score === star ? 0 : star)}
                    className="p-1 hover:scale-125 transition-transform"
                  >
                    <Star
                      size={20}
                      className={star <= score ? "text-yellow-500 fill-yellow-500" : "text-zinc-600"}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="p-5 border-t border-[var(--color-border)] bg-[var(--color-surface)] flex gap-2">
            {existingId && (
              <button
                onClick={handleRemove}
                disabled={saving}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-red-500/30 bg-red-500/10 text-red-400 hover:bg-red-500/20 text-xs font-bold transition-all disabled:opacity-50"
              >
                <Trash2 size={14} /> Hapus
              </button>
            )}
            <Button fullWidth onClick={handleSave} loading={saving} className="flex-1">
              {saving ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
