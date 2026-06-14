"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { WifiOff, Home, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-[var(--color-bg)]">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center space-y-6 max-w-sm"
      >
        <div className="w-24 h-24 rounded-full bg-[var(--color-surface-2)] border border-[var(--color-border)] flex items-center justify-center mx-auto">
          <WifiOff size={40} className="text-[var(--color-text-muted)]" />
        </div>

        <div>
          <h1 className="text-2xl font-black" style={{ fontFamily: "var(--font-display)" }}>
            Tidak Ada Koneksi
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-2">
            Sepertinya kamu sedang offline. Periksa koneksi internet dan coba lagi.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => window.location.reload()}
            className="flex items-center justify-center gap-2 h-11 px-6 rounded-[var(--radius-button)] gradient-brand text-white text-sm font-semibold"
            style={{ boxShadow: "0 4px 12px var(--color-primary-glow)" }}
          >
            <RefreshCw size={16} />
            Coba Lagi
          </button>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 h-11 px-6 rounded-[var(--radius-button)] bg-[var(--color-surface-2)] border border-[var(--color-border)] text-sm font-semibold text-[var(--color-text-primary)]"
          >
            <Home size={16} />
            Kembali ke Beranda
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
