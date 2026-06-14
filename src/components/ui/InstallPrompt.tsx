"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, Smartphone } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Jangan tampilkan jika sudah di-dismiss sebelumnya
    const wasDismissed = localStorage.getItem("pwa-install-dismissed");
    if (wasDismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setPrompt(e as BeforeInstallPromptEvent);
      // Tunda 3 detik setelah halaman dimuat
      setTimeout(() => setVisible(true), 3000);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted") {
      setVisible(false);
    }
    setPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    localStorage.setItem("pwa-install-dismissed", "1");
  };

  return (
    <AnimatePresence>
      {visible && !dismissed && (
        <motion.div
          initial={{ y: 120, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 120, opacity: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="fixed bottom-[calc(var(--bottom-nav-height)+var(--safe-area-bottom)+12px)] left-4 right-4 z-50"
        >
          <div className="glass-heavy border border-[var(--color-border)] rounded-2xl p-4 shadow-2xl">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center shrink-0"
                style={{ boxShadow: "0 4px 16px var(--color-primary-glow)" }}>
                <Smartphone size={22} className="text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[var(--color-text-primary)]">
                  Pasang AniVerse
                </p>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5 line-clamp-2">
                  Tambahkan ke layar utama untuk akses lebih cepat tanpa buka browser
                </p>
              </div>

              <button
                onClick={handleDismiss}
                className="w-6 h-6 flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] shrink-0"
              >
                <X size={16} />
              </button>
            </div>

            <button
              onClick={handleInstall}
              className="mt-3 w-full flex items-center justify-center gap-2 h-10 rounded-[var(--radius-button)] gradient-brand text-white text-sm font-semibold"
              style={{ boxShadow: "0 4px 12px var(--color-primary-glow)" }}
            >
              <Download size={16} />
              Pasang Sekarang
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
