"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, User, Zap, Chrome, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { signUp, signInWithGoogle } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({
  username: z
    .string()
    .min(3, "Username minimal 3 karakter")
    .max(20, "Username maksimal 20 karakter")
    .regex(/^[a-z0-9_]+$/, "Hanya huruf kecil, angka, dan underscore"),
  email: z.string().email("Format email tidak valid"),
  password: z.string().min(8, "Password minimal 8 karakter"),
});

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/";

  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState(false);

  const validate = () => {
    const result = schema.safeParse({ username, email, password });
    if (result.success) { setErrors({}); return true; }
    const errs: Record<string, string> = {};
    result.error.issues.forEach((e) => {
      if (e.path[0]) errs[e.path[0] as string] = e.message;
    });
    setErrors(errs);
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setErrors({});

    const { data, error } = await signUp(email, password, username);

    setLoading(false);
    if (error) {
      setErrors({ form: error.message ?? "Pendaftaran gagal, coba lagi." });
      return;
    }

    // Auto-login succeeded, redirect to home
    if (data?.session) {
      router.push(redirectTo);
      router.refresh();
    } else if (data?.user) {
      // Session not auto-created, try signing in
      const { signIn } = await import("@/lib/auth");
      const { error: loginErr } = await signIn(email, password);
      if (!loginErr) {
        router.push(redirectTo);
        router.refresh();
      } else {
        setSuccess(true); // fallback to email verification message
      }
    }
  };

  const handleGoogle = async () => {
    setLoading(true);
    await signInWithGoogle();
  };

  if (success) {
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center px-6 bg-[var(--color-bg)]">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center space-y-4 max-w-sm"
        >
          <div className="w-20 h-20 rounded-full bg-green-500/20 flex items-center justify-center mx-auto border border-green-500/30">
            <CheckCircle2 size={40} className="text-green-400" />
          </div>
          <h1 className="text-2xl font-black" style={{ fontFamily: "var(--font-display)" }}>
            Cek Email Kamu!
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            Kami telah mengirim link konfirmasi ke <strong className="text-[var(--color-text-primary)]">{email}</strong>.
            Klik link tersebut untuk mengaktifkan akunmu.
          </p>
          <Link href="/login">
            <Button fullWidth variant="outline">Kembali ke Halaman Masuk</Button>
          </Link>
        </motion.div>
      </div>
    );
  }

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
            Bergabung dengan AniVerse
          </h1>
          <p className="text-sm text-[var(--color-text-muted)] mt-1">
            Buat akun gratis sekarang
          </p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="w-full max-w-sm space-y-4"
      >
        {/* Google */}
        <button
          type="button"
          onClick={handleGoogle}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 h-11 rounded-[var(--radius-button)] border border-[var(--color-border)] bg-[var(--color-surface-2)] text-sm font-semibold text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] transition-colors disabled:opacity-50"
        >
          <Chrome size={18} />
          Daftar dengan Google
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-[var(--color-border)]" />
          <span className="text-xs text-[var(--color-text-muted)]">atau</span>
          <div className="flex-1 h-px bg-[var(--color-border)]" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div className="space-y-1.5">
            <label htmlFor="username" className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
              Username
            </label>
            <div className="flex items-center gap-2 bg-[var(--color-surface-2)] border rounded-[var(--radius-button)] px-3 py-2.5 transition-colors"
              style={{ borderColor: errors.username ? "var(--color-error)" : "var(--color-border)" }}>
              <User size={16} className="text-[var(--color-text-muted)] shrink-0" />
              <input id="username" type="text" value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""))}
                placeholder="nama_pengguna"
                autoComplete="username"
                className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none" />
            </div>
            {errors.username && <p className="text-xs text-[var(--color-error)]">{errors.username}</p>}
          </div>

          {/* Email */}
          <div className="space-y-1.5">
            <label htmlFor="reg-email" className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">Email</label>
            <div className="flex items-center gap-2 bg-[var(--color-surface-2)] border rounded-[var(--radius-button)] px-3 py-2.5 transition-colors"
              style={{ borderColor: errors.email ? "var(--color-error)" : "var(--color-border)" }}>
              <Mail size={16} className="text-[var(--color-text-muted)] shrink-0" />
              <input id="reg-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="kamu@contoh.com"
                autoComplete="email"
                className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none" />
            </div>
            {errors.email && <p className="text-xs text-[var(--color-error)]">{errors.email}</p>}
          </div>

          {/* Password */}
          <div className="space-y-1.5">
            <label htmlFor="reg-password" className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">Password</label>
            <div className="flex items-center gap-2 bg-[var(--color-surface-2)] border rounded-[var(--radius-button)] px-3 py-2.5 transition-colors"
              style={{ borderColor: errors.password ? "var(--color-error)" : "var(--color-border)" }}>
              <Lock size={16} className="text-[var(--color-text-muted)] shrink-0" />
              <input id="reg-password" type={showPw ? "text" : "password"} value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min. 8 karakter"
                autoComplete="new-password"
                className="flex-1 bg-transparent text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] outline-none" />
              <button type="button" onClick={() => setShowPw((s) => !s)} className="text-[var(--color-text-muted)]">
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-[var(--color-error)]">{errors.password}</p>}
          </div>

          {errors.form && (
            <div className="p-3 rounded-[var(--radius-button)] bg-[var(--color-error)]/10 border border-[var(--color-error)]/30">
              <p className="text-xs text-[var(--color-error)]">{errors.form}</p>
            </div>
          )}

          <Button type="submit" fullWidth loading={loading} size="lg">
            Buat Akun
          </Button>
        </form>

        <p className="text-xs text-[var(--color-text-muted)] text-center">
          Sudah punya akun?{" "}
          <Link href="/login" className="text-[var(--color-primary)] font-semibold hover:underline">
            Masuk sekarang
          </Link>
        </p>
      </motion.div>
    </div>
  );
}

import { Suspense } from "react";

export default function RegisterPage() {
  return (
    <div className="min-h-dvh flex flex-col bg-[var(--color-bg)]">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -right-32 w-72 h-72 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, var(--color-accent), transparent)" }} />
        <div className="absolute -bottom-32 -left-32 w-72 h-72 rounded-full opacity-20"
          style={{ background: "radial-gradient(circle, var(--color-primary), transparent)" }} />
      </div>
      <Suspense fallback={<div className="flex justify-center items-center h-full pt-32"><div className="w-8 h-8 rounded-full border-2 border-[var(--color-primary)] border-t-transparent animate-spin" /></div>}>
        <RegisterContent />
      </Suspense>
    </div>
  );
}
