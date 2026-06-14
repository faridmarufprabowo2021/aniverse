"use client";

import { useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, X, Loader2, Search, ImageIcon, Sparkles } from "lucide-react";

function escapeHTML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

interface ImageSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImageSearchModal({ isOpen, onClose }: ImageSearchModalProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("File harus berupa gambar");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("Ukuran gambar maksimal 10MB");
      return;
    }

    setError(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleSearch = useCallback(async () => {
    if (!preview) return;
    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("imageBase64", preview);

      const res = await fetch("/api/gemini/image-search", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setResult(data.result);
      } else {
        setError(data.error || "Gagal mengidentifikasi gambar");
      }
    } catch {
      setError("Gagal menghubungi server. Coba lagi.");
    }

    setLoading(false);
  }, [preview]);

  const reset = useCallback(() => {
    setPreview(null);
    setResult(null);
    setError(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25 }}
            className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-[520px] sm:max-h-[90vh] z-[61] bg-[var(--color-bg)] border border-[var(--color-border)] rounded-3xl shadow-2xl overflow-y-auto flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-border)]">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-pink-500 to-orange-500 flex items-center justify-center">
                <Camera size={18} className="text-white" />
              </div>
              <div className="flex-1">
                <h2 className="text-sm font-bold">Anime Image Search</h2>
                <p className="text-[10px] text-[var(--color-text-muted)]">Upload gambar → AI identifikasi anime</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-[var(--color-surface-2)] transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 flex-1">
              {!preview ? (
                /* Upload Area */
                <div
                  onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={handleDrop}
                  onClick={() => fileRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                    isDragging
                      ? "border-pink-500 bg-pink-500/5"
                      : "border-[var(--color-border)] hover:border-pink-500/40 hover:bg-pink-500/5"
                  }`}
                >
                  <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-br from-pink-500/10 to-orange-500/10 flex items-center justify-center">
                    <ImageIcon size={28} className="text-pink-400" />
                  </div>
                  <p className="text-sm font-semibold">Drop gambar di sini</p>
                  <p className="text-xs text-[var(--color-text-muted)] mt-1">atau klik untuk upload • Max 10MB</p>
                  <div className="flex justify-center gap-2 mt-4">
                    <span className="px-2.5 py-1 bg-[var(--color-surface)] rounded-lg text-[10px] text-[var(--color-text-muted)]">JPG</span>
                    <span className="px-2.5 py-1 bg-[var(--color-surface)] rounded-lg text-[10px] text-[var(--color-text-muted)]">PNG</span>
                    <span className="px-2.5 py-1 bg-[var(--color-surface)] rounded-lg text-[10px] text-[var(--color-text-muted)]">WEBP</span>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
                    className="hidden"
                  />
                </div>
              ) : (
                /* Preview + Results */
                <div className="space-y-4">
                  {/* Image Preview */}
                  <div className="relative rounded-2xl overflow-hidden bg-[var(--color-surface)]">
                    <img src={preview} alt="Preview" className="w-full max-h-36 object-contain" />
                    <button
                      onClick={reset}
                      className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>

                  {/* Search Button */}
                  {!result && !loading && (
                    <button
                      onClick={handleSearch}
                      className="w-full py-3 rounded-2xl bg-gradient-to-r from-pink-500 to-orange-500 text-white font-bold text-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-pink-500/20 transition-all"
                    >
                      <Search size={16} />
                      Identifikasi Anime & Karakter
                    </button>
                  )}

                  {/* Loading */}
                  {loading && (
                    <div className="py-6 text-center space-y-3">
                      <Loader2 size={28} className="mx-auto animate-spin text-pink-400" />
                      <div>
                        <p className="text-sm font-semibold">Menganalisis gambar...</p>
                        <p className="text-[10px] text-[var(--color-text-muted)]">AI sedang mengidentifikasi anime, karakter & sinopsis</p>
                      </div>
                    </div>
                  )}

                  {/* Result */}
                  {result && (
                    <div className="p-4 rounded-2xl bg-[var(--color-surface)] border border-[var(--color-border)] space-y-2">
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles size={14} className="text-pink-400" />
                        <span className="text-xs font-bold text-pink-400">Hasil Identifikasi</span>
                      </div>
                      <div
                        className="text-xs leading-relaxed whitespace-pre-wrap result-markdown"
                        dangerouslySetInnerHTML={{
                          __html: escapeHTML(result)
                            .replace(/### (.*)/g, '<div class="result-heading">$1</div>')
                            .replace(/## (.*)/g, '<div class="result-heading">$1</div>')
                            .replace(/---/g, '<hr class="result-hr"/>')
                            .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
                            .replace(/\n/g, "<br/>")
                        }}
                      />
                      <style jsx>{`
                        :global(.result-heading) {
                          font-weight: 800;
                          font-size: 13px;
                          margin-top: 12px;
                          margin-bottom: 4px;
                          padding-bottom: 4px;
                          border-bottom: 1px solid rgba(168,85,247,0.15);
                          color: #a855f7;
                        }
                        :global(.result-hr) {
                          border: none;
                          border-top: 1px solid rgba(255,255,255,0.06);
                          margin: 10px 0;
                        }
                      `}</style>
                      <button
                        onClick={reset}
                        className="mt-3 w-full py-2 rounded-xl bg-[var(--color-surface-2)] text-xs font-semibold hover:bg-[var(--color-surface-3)] transition-colors"
                      >
                        Coba Gambar Lain
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
                  ⚠️ {error}
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
