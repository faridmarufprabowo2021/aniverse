"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, Zap, Chrome, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { signIn, signInWithGoogle } from "@/lib/auth";

import { Suspense } from "react";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/";
  const authError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(
    authError === "auth_callback_failed" ? "Autentikasi gagal. Coba lagi." : ""
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email) { setError("Email harus diisi."); return; }
    if (!password) { setError("Password harus diisi."); return; }

    setLoading(true);
    const { error: authErr } = await signIn(email, password);
    setLoading(false);

    if (authErr) {
      if (authErr.message.includes("Invalid login credentials")) {
        setError("Email atau password salah.");
      } else if (authErr.message.includes("Email not confirmed")) {
        setError("Email belum dikonfirmasi. Cek inbox kamu.");
      } else {
        setError(authErr.message ?? "Login gagal, coba lagi.");
      }
      return;
    }

    router.push(redirectTo);
    router.refresh();
  };

  const handleGoogle = async () => {
    setLoading(true);
    await signInWithGoogle();
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 relative z-10">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.4, type: "spring", stiffness: 300 }}
        className="flex flex-col items-center gap-3 mb-8"
      >
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center gradient-brand"
          style={{ boxShadow: "0 8px 32px var(--color-primary-glow)" }}>
          <Zap size={32} className="text-white" fill="white" />
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-black gradient-text" style={{ fontFamily: "var(--font-display)" }}>
            Selamat Datang Kembali
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Masuk ke AniVerse kamu
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="w-full max-w-sm space-y-4"
      >
        {/* Google OAuth */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface-2)] text-sm font-semibold text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] transition-colors disabled:opacity-50"
        >
          <Chrome size={18} />
          Masuk dengan Google
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[var(--color-border)]" />
          <span className="text-xs text-[var(--color-text-muted)]">atau</span>
          <div className="flex-1 h-px bg-[var(--color-border)]" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
              Email
            </label>
            <div className="flex items-center gap-2 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-[var(--radius-button)] px-3 py-2.5 focus-within:border-[var(--color-primary)] transition-colors">
              <Mail size={16} className="text-[var(--color-text-muted)] shrink-0" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="kamu@contoh.com"
                autoComplete="email"
                className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none"
              />
            </div>
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
              Password
            </label>
            <div className="flex items-center gap-2 bg-[var(--color-surface-2)] border border-[var(--color-border)] rounded-[var(--radius-button)] px-3 py-2.5 focus-within:border-[var(--color-primary)] transition-colors">
              <Lock size={16} className="text-[var(--color-text-muted)] shrink-0" />
              <input
                id="password"
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none"
              />
              <button type="button" onClick={() => setShowPw((s) => !s)} className="text-[var(--color-text-muted)]">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-[var(--radius-button)] bg-[var(--color-error)]/10 border border-[var(--color-error)]/30">
              <AlertCircle size={14} className="text-[var(--color-error)] shrink-0" />
              <p className="text-xs text-[var(--color-error)]">{error}</p>
            </div>
          )}

          <Button type="submit" fullWidth loading={loading} size="lg">
            Masuk
          </Button>
        </form>

        <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
          <Link href="/register" className="text-[var(--color-primary)] font-semibold hover:underline">
            Buat akun baru
          </Link>
          <button className="hover:text-[var(--color-text-secondary)] hover:underline">
            Lupa password?
          </button>
        </div>

        <div className="text-center pt-2">
          <Link href="/" className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] underline">
            Lanjutkan sebagai tamu
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-[var(--color-bg)]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -left-32 w-72 h-72 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, var(--color-primary), transparent)" }} />
        <div className="absolute -bottom-32 -right-32 w-72 h-72 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, var(--color-accent), transparent)" }} />
      </div>
      <Suspense fallback={<div className="flex justify-center items-center h-full pt-32"><div className="w-8 h-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" /></div>}>
        <LoginContent />
      </Suspense>
    </div>
  );
}
