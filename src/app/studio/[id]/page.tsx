"use client";

import { useState, useEffect } from "react";
import { notFound } from "next/navigation";
import { motion } from "framer-motion";
import Link from "next/link";
import { Building2, ExternalLink } from "lucide-react";
import { AnimeGrid } from "@/components/anime/AnimeCard";
import type { AnimeCard } from "@/types/anime";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNavbar } from "@/components/layout/BottomNavbar";
import { containerVariants, itemVariants } from "@/lib/animations";

interface StudioData {
  id: number;
  name: string;
  siteUrl?: string;
  isAnimationStudio: boolean;
  anime: AnimeCard[];
  total: number;
  hasNextPage: boolean;
}

interface PageProps { params: Promise<{ id: string }> }

export default function StudioPage({ params }: PageProps) {
  const [studio, setStudio] = useState<StudioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFoundFlag, setNotFoundFlag] = useState(false);
  const [resolvedId, setResolvedId] = useState<string | null>(null);

  useEffect(() => { params.then(({ id }) => setResolvedId(id)); }, [params]);

  useEffect(() => {
    if (!resolvedId) return;
    fetch(`/api/studio/${resolvedId}?perPage=24`)
      .then(r => {
        if (r.status === 404) { setNotFoundFlag(true); return null; }
        return r.json();
      })
      .then(data => { if (data) setStudio(data); setLoading(false); })
      .catch(() => { setLoading(false); setNotFoundFlag(true); });
  }, [resolvedId]);

  if (notFoundFlag) notFound();

  return (
    <>
      <TopBar />
      <main className="pt-safe pb-safe">
        <motion.div
          variants={containerVariants} initial="hidden" animate="show"
          className="px-4 pt-4 pb-10 space-y-6"
        >
          {/* Header Studio */}
          <motion.div variants={itemVariants} className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center shrink-0">
              <Building2 size={28} className="text-[var(--color-primary)]" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-black leading-tight" style={{ fontFamily: "var(--font-display)" }}>
                {loading ? "Memuat…" : studio?.name ?? "Studio"}
              </h1>
              {studio && (
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {studio.isAnimationStudio ? "Studio Animasi" : "Studio"} • {studio.total} anime
                  </span>
                  {studio.siteUrl && (
                    <a href={studio.siteUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline">
                      <ExternalLink size={10} /> Website
                    </a>
                  )}
                </div>
              )}
            </div>
          </motion.div>

          {/* Anime List */}
          <motion.div variants={itemVariants}>
            <h2 className="text-base font-bold mb-3" style={{ fontFamily: "var(--font-display)" }}>
              🎬 Karya dari Studio Ini
            </h2>
            <AnimeGrid
              anime={studio?.anime ?? []}
              loading={loading}
              skeletonCount={12}
            />
          </motion.div>
        </motion.div>
      </main>
      <BottomNavbar />
    </>
  );
}
