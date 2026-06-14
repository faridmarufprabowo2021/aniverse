"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings, Shield, Bell, Palette, Globe, Trash2, LogOut,
  ChevronRight, Eye, EyeOff, Check, AlertTriangle, Loader2,
  User, Lock, Mail, Smartphone, Monitor, Moon, Sun, Zap,
  KeyRound, ChevronLeft, X
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TopBar } from "@/components/layout/TopBar";
import { BottomNavbar } from "@/components/layout/BottomNavbar";
import { createClient } from "@/lib/supabase/client";
import { signOut } from "@/lib/auth";
import { cn } from "@/lib/utils";

// ── Toast ──────────────────────────────────────────────────
type ToastType = "success" | "error" | "info";
function useToast() {
  const [toast, setToast] = useState<{ msg: string; type: ToastType } | null>(null);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);
  return { toast, showToast: setToast };
}

type TabId = "akun" | "tampilan" | "notifikasi" | "keamanan";

const TABS: { id: TabId; label: string; icon: typeof Settings }[] = [
  { id: "akun",       label: "Akun",        icon: User },
  { id: "tampilan",   label: "Tampilan",     icon: Palette },
  { id: "notifikasi", label: "Notifikasi",   icon: Bell },
  { id: "keamanan",   label: "Keamanan",     icon: Shield },
];

export default function SettingsPage() {
  const router = useRouter();
  const { toast, showToast } = useToast();
  const supabase = createClient();

  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("akun");

  // Akun form
  const [displayName, setDisplayName] = useState("");
  const [savingName, setSavingName] = useState(false);

  // Password form  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [savingPass, setSavingPass] = useState(false);

  // Delete account
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");

  // Notif
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [notifEpisode, setNotifEpisode] = useState(true);
  const [notifNewAnime, setNotifNewAnime] = useState(true);

  // Theme
  const [theme, setTheme] = useState<"dark" | "light" | "amoled">("dark");

  useEffect(() => {
    async function load() {
      const { data: { user: u } } = await supabase.auth.getUser();
      if (!u) { router.replace("/login?redirect=/settings"); return; }
      setUser(u);

      // Try profiles table, fallback to user_metadata if table doesn't exist
      try {
        const { data: p, error: profileErr } = await supabase
          .from("profiles")
          .select("username, display_name, avatar_url")
          .eq("id", u.id)
          .maybeSingle();
        if (!profileErr && p) {
          setProfile(p);
          setDisplayName(p.display_name || p.username || u.user_metadata?.full_name || "");
        } else {
          // Fallback to user metadata
          setDisplayName(u.user_metadata?.full_name || u.user_metadata?.name || "");
        }
      } catch {
        // profiles table may not exist - use user metadata
        setDisplayName(u.user_metadata?.full_name || u.user_metadata?.name || "");
      }

      // Check notification status
      if ("Notification" in window) {
        setNotifEnabled(Notification.permission === "granted");
      }

      // Load theme from localStorage
      const saved = localStorage.getItem("aniverse-theme") as "dark" | "light" | "amoled" | null;
      if (saved) {
        setTheme(saved);
        // Re-apply saved theme on page load
        setTimeout(() => applyTheme(saved), 100);
      }

      setLoading(false);
    }
    load();
  }, []);

  // ── Save display name ──────────────────────────────────────
  const handleSaveName = async () => {
    if (!user || !displayName.trim()) return;
    setSavingName(true);
    
    // Try profiles table first, fallback to auth metadata
    if (profile) {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName.trim() })
        .eq("id", user.id);
      if (error) showToast({ msg: `❌ ${error.message}`, type: "error" });
      else showToast({ msg: "✓ Nama berhasil diperbarui", type: "success" });
    } else {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: displayName.trim() }
      });
      if (error) showToast({ msg: `❌ ${error.message}`, type: "error" });
      else showToast({ msg: "✓ Nama berhasil diperbarui", type: "success" });
    }
    
    setSavingName(false);
  };

  // ── Change password ────────────────────────────────────────
  const handleChangePassword = async () => {
    if (newPassword.length < 8) {
      showToast({ msg: "Password minimal 8 karakter", type: "error" });
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast({ msg: "Konfirmasi password tidak cocok", type: "error" });
      return;
    }
    setSavingPass(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) showToast({ msg: `❌ ${error.message}`, type: "error" });
    else {
      showToast({ msg: "✓ Password berhasil diperbarui", type: "success" });
      setNewPassword("");
      setConfirmPassword("");
    }
    setSavingPass(false);
  };

  // ── Apply theme ────────────────────────────────────────────
  const applyTheme = (t: "dark" | "light" | "amoled") => {
    setTheme(t);
    localStorage.setItem("aniverse-theme", t);
    const root = document.documentElement;

    // Reset all overrides first
    const vars = [
      "--color-bg", "--color-surface", "--color-surface-2", "--color-surface-3",
      "--color-border", "--color-border-hover",
      "--color-text-primary", "--color-text-secondary", "--color-text-muted", "--color-text-inverse",
    ];
    vars.forEach(v => root.style.removeProperty(v));

    if (t === "amoled") {
      root.style.setProperty("--color-bg", "#000000");
      root.style.setProperty("--color-surface", "#050505");
      root.style.setProperty("--color-surface-2", "#0d0d0d");
      root.style.setProperty("--color-surface-3", "#151515");
      root.style.setProperty("--color-border", "#1a1a1a");
    } else if (t === "light") {
      root.style.setProperty("--color-bg", "#f4f4f8");
      root.style.setProperty("--color-surface", "#ffffff");
      root.style.setProperty("--color-surface-2", "#f0f0f4");
      root.style.setProperty("--color-surface-3", "#e4e4ec");
      root.style.setProperty("--color-border", "#d0d0dc");
      root.style.setProperty("--color-border-hover", "#b0b0c0");
      root.style.setProperty("--color-text-primary", "#0f0f1a");
      root.style.setProperty("--color-text-secondary", "#3a3a50");
      root.style.setProperty("--color-text-muted", "#7a7a90");
      root.style.setProperty("--color-text-inverse", "#f0f0ff");
    }
    // dark: all overrides already removed above, so defaults from :root in CSS apply

    showToast({ msg: `✓ Tema diubah ke ${t === "dark" ? "Gelap" : t === "light" ? "Terang" : "AMOLED"}`, type: "success" });
  };

  // ── Enable push notifications ──────────────────────────────
  const handleEnableNotif = async () => {
    if (!("Notification" in window)) {
      showToast({ msg: "Browser tidak mendukung notifikasi", type: "error" });
      return;
    }
    const perm = await Notification.requestPermission();
    if (perm === "granted") {
      setNotifEnabled(true);
      showToast({ msg: "✓ Notifikasi diaktifkan", type: "success" });
    } else {
      showToast({ msg: "Izin notifikasi ditolak", type: "error" });
    }
  };

  // ── Logout ─────────────────────────────────────────────────
  const handleLogout = async () => {
    await signOut();
    router.replace("/");
  };

  if (loading) {
    return (
      <>
        <TopBar />
        <main className="pt-safe pb-safe min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        </main>
        <BottomNavbar />
      </>
    );
  }

  return (
    <>
      <TopBar />
      <main className="pt-safe pb-safe min-h-screen">
        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              initial={{ opacity: 0, y: -60 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -60 }}
              className={`fixed top-16 left-1/2 -translate-x-1/2 z-50 px-5 py-3 rounded-2xl text-sm font-bold shadow-2xl flex items-center gap-2 ${
                toast.type === "success" ? "bg-green-600 text-white" :
                toast.type === "error" ? "bg-red-600 text-white" :
                "bg-zinc-800 text-white"
              }`}
            >
              {toast.type === "success" ? <Check size={15} /> : <AlertTriangle size={15} />}
              {toast.msg}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-7xl mx-auto px-4 md:px-8 pt-4 pb-28 space-y-6">
          {/* Header */}
          <div className="flex items-center gap-3 border-b border-[var(--color-border)] pb-4 mb-4">
            <button onClick={() => router.back()} className="p-2 rounded-xl hover:bg-[var(--color-surface-2)] transition-colors">
              <ChevronLeft size={20} />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-black tracking-tight" style={{ fontFamily: "var(--font-display)" }}>
                Pengaturan
              </h1>
              <p className="text-xs text-[var(--color-text-muted)] font-medium mt-0.5">{user?.email}</p>
            </div>
          </div>

          {/* Desktop Grid Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column: Vertical Navigation Sidebar (Desktop-only) */}
            <aside className="hidden lg:block lg:col-span-4 xl:col-span-3 space-y-4 lg:sticky lg:top-[90px] bg-[var(--color-surface)] border border-[var(--color-border)] p-4 rounded-2xl shadow-md">
              <div className="flex items-center gap-3 pb-4 border-b border-[var(--color-border)]">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center font-black text-purple-400 text-sm">
                  {displayName ? displayName.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || "U"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-extrabold text-[var(--color-text-primary)] truncate">{displayName || "Pengguna"}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)] truncate">{user?.email}</p>
                </div>
              </div>
              
              <nav className="space-y-1">
                {TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={cn(
                      "w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-xs font-black transition-all",
                      activeTab === tab.id
                        ? "bg-purple-500 text-white shadow-md shadow-purple-500/10"
                        : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)]"
                    )}
                  >
                    <tab.icon size={14} className={activeTab === tab.id ? "text-white" : "text-[var(--color-text-muted)]"} />
                    <span>{tab.label}</span>
                    <ChevronRight size={12} className="ml-auto opacity-60" />
                  </button>
                ))}
              </nav>
            </aside>

            {/* Tab Pills (Mobile Only) */}
            <div className="lg:hidden flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-[11px] font-bold whitespace-nowrap transition-all border shadow-sm ${
                    activeTab === tab.id
                      ? "bg-purple-500 text-white border-purple-500 shadow-md shadow-purple-500/10"
                      : "bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-text-secondary)]"
                  }`}
                >
                  <tab.icon size={13} />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Right Column: Settings Cards Pane */}
            <div className="lg:col-span-8 xl:col-span-9">
              {/* ── TAB: AKUN ── */}
              {activeTab === "akun" && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  {/* Display Name */}
                  <SettingsCard title="Nama Tampilan" icon={<User size={16} className="text-purple-400" />}>
                    <div className="flex gap-2 mt-3">
                      <input
                        value={displayName}
                        onChange={e => setDisplayName(e.target.value)}
                        placeholder="Nama tampilan..."
                        className="flex-1 bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:border-purple-500 rounded-xl px-3 py-2 text-sm outline-none transition-colors"
                      />
                      <Button size="sm" onClick={handleSaveName} loading={savingName}>Simpan</Button>
                    </div>
                    <p className="text-[10px] text-[var(--color-text-muted)] mt-2 font-medium">
                      Username: @{profile?.username || "–"}
                    </p>
                  </SettingsCard>

                  {/* Email (read-only) */}
                  <SettingsCard title="Email" icon={<Mail size={16} className="text-blue-400" />}>
                    <div className="flex items-center gap-2 mt-3 p-3 bg-[var(--color-surface-2)] rounded-xl border border-[var(--color-border)] shadow-sm">
                      <span className="text-sm font-semibold flex-1">{user?.email}</span>
                      {user?.email_confirmed_at ? (
                        <span className="text-[10px] font-extrabold text-green-400 bg-green-500/10 px-2.5 py-0.5 rounded-full border border-green-500/20">✓ Terverifikasi</span>
                      ) : (
                        <span className="text-[10px] font-extrabold text-yellow-400 bg-yellow-500/10 px-2.5 py-0.5 rounded-full border border-yellow-500/20">⚠ Belum</span>
                      )}
                    </div>
                  </SettingsCard>

                  {/* Logout */}
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 p-4 rounded-2xl bg-red-500/5 border border-red-500/20 hover:bg-red-500/10 transition-colors text-red-400 shadow-sm"
                  >
                    <LogOut size={18} />
                    <span className="text-sm font-bold">Keluar dari Akun</span>
                    <ChevronRight size={16} className="ml-auto" />
                  </button>
                </motion.div>
              )}

              {/* ── TAB: TAMPILAN ── */}
              {activeTab === "tampilan" && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  <SettingsCard title="Mode Tema" icon={<Palette size={16} className="text-pink-400" />}>
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      {([
                        { id: "dark",   label: "Gelap",  icon: Moon,    desc: "Default" },
                        { id: "light",  label: "Terang", icon: Sun,     desc: "Cerah" },
                        { id: "amoled", label: "AMOLED", icon: Zap,     desc: "Hitam pekat" },
                      ] as const).map(t => (
                        <button
                          key={t.id}
                          onClick={() => applyTheme(t.id)}
                          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-center transition-all shadow-sm ${
                            theme === t.id
                              ? "border-purple-500 bg-purple-500/10 text-purple-400"
                              : "border-[var(--color-border)] bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] hover:border-purple-500/20"
                          }`}
                        >
                          <t.icon size={20} />
                          <span className="text-[11px] font-black">{t.label}</span>
                          <span className="text-[9px] text-[var(--color-text-muted)] font-medium">{t.desc}</span>
                        </button>
                      ))}
                    </div>
                  </SettingsCard>

                  <SettingsCard title="Preferensi Konten" icon={<Globe size={16} className="text-green-400" />}>
                    <div className="mt-3 space-y-2 border-t border-[var(--color-border)] pt-2">
                      <ToggleRow label="Tampilkan Subtitle Indo" sub="Filter konten berteks Indonesia" defaultChecked />
                      <ToggleRow label="Animasi UI" sub="Aktifkan transisi dan efek animasi" defaultChecked />
                      <ToggleRow label="Autoplay Episode" sub="Lanjut episode berikutnya otomatis" />
                    </div>
                  </SettingsCard>
                </motion.div>
              )}

              {/* ── TAB: NOTIFIKASI ── */}
              {activeTab === "notifikasi" && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  {/* Master toggle */}
                  <SettingsCard title="Push Notification" icon={<Bell size={16} className="text-purple-400" />}>
                    <div className="mt-3">
                      {notifEnabled ? (
                        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 shadow-sm">
                          <Check size={16} className="text-green-400" />
                          <div>
                            <p className="text-sm font-bold text-green-400">Notifikasi Aktif</p>
                            <p className="text-xs text-[var(--color-text-muted)] font-medium">Kamu akan menerima update episode baru secara berkala</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                            <AlertTriangle size={16} className="text-yellow-400" />
                            <p className="text-xs text-yellow-400 font-medium">Notifikasi belum diaktifkan di perangkat ini</p>
                          </div>
                          <Button icon={<Bell size={14} />} onClick={handleEnableNotif} className="w-full">
                            Aktifkan Notifikasi
                          </Button>
                        </div>
                      )}
                    </div>
                  </SettingsCard>

                  {notifEnabled && (
                    <SettingsCard title="Jenis Notifikasi" icon={<Bell size={16} className="text-blue-400" />}>
                      <div className="mt-3 space-y-2 border-t border-[var(--color-border)] pt-2">
                        <ToggleRow
                          label="Episode Baru"
                          sub="Notif saat episode anime favoritmu tayang"
                          defaultChecked={notifEpisode}
                          onChange={setNotifEpisode}
                        />
                        <ToggleRow
                          label="Anime Baru Tayang"
                          sub="Notif saat season anime baru dimulai"
                          defaultChecked={notifNewAnime}
                          onChange={setNotifNewAnime}
                        />
                        <ToggleRow
                          label="Pembaruan Manga"
                          sub="Notif saat chapter manga barumu tersedia"
                        />
                      </div>
                    </SettingsCard>
                  )}
                </motion.div>
              )}

              {/* ── TAB: KEAMANAN ── */}
              {activeTab === "keamanan" && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                  {/* Change Password */}
                  <SettingsCard title="Ubah Password" icon={<Lock size={16} className="text-purple-400" />}>
                    <div className="space-y-3 mt-3">
                      <div className="relative">
                        <input
                          type={showPass ? "text" : "password"}
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          placeholder="Password baru (min. 8 karakter)"
                          className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:border-purple-500 rounded-xl px-3 py-2.5 text-sm outline-none pr-10 transition-colors"
                        />
                        <button
                          onClick={() => setShowPass(p => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:text-white"
                        >
                          {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                      <input
                        type={showPass ? "text" : "password"}
                        value={confirmPassword}
                        onChange={e => setConfirmPassword(e.target.value)}
                        placeholder="Konfirmasi password baru"
                        className="w-full bg-[var(--color-surface-2)] border border-[var(--color-border)] focus:border-purple-500 rounded-xl px-3 py-2.5 text-sm outline-none transition-colors"
                      />
                      {/* Strength indicator */}
                      {newPassword && (
                        <div className="flex gap-1 items-center">
                          {[...Array(4)].map((_, i) => (
                            <div
                              key={i}
                              className={`h-1 flex-1 rounded-full transition-colors ${
                                i < (newPassword.length >= 12 ? 4 : newPassword.length >= 10 ? 3 : newPassword.length >= 8 ? 2 : 1)
                                  ? newPassword.length >= 12 ? "bg-green-500" : newPassword.length >= 10 ? "bg-yellow-500" : "bg-orange-500"
                                  : "bg-[var(--color-border)]"
                              }`}
                            />
                          ))}
                          <span className="text-[10px] text-[var(--color-text-muted)] ml-1 font-bold">
                            {newPassword.length >= 12 ? "Kuat" : newPassword.length >= 8 ? "Sedang" : "Lemah"}
                          </span>
                        </div>
                      )}
                      <Button
                        icon={<KeyRound size={14} />}
                        onClick={handleChangePassword}
                        loading={savingPass}
                        className="w-full mt-1"
                        disabled={!newPassword || !confirmPassword}
                      >
                        Perbarui Password
                      </Button>
                    </div>
                  </SettingsCard>

                  {/* Session info */}
                  <SettingsCard title="Sesi Aktif" icon={<Smartphone size={16} className="text-blue-400" />}>
                    <div className="mt-3 space-y-2">
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-surface-2)] border border-[var(--color-border)] shadow-sm">
                        <Monitor size={18} className="text-purple-400 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold">Perangkat ini</p>
                          <p className="text-[10px] text-[var(--color-text-muted)] truncate font-medium">{
                            typeof navigator !== "undefined"
                              ? (navigator.userAgent.includes("Mobile") ? "📱 Mobile Device" : "💻 Desktop Browser")
                              : "–"
                          }</p>
                        </div>
                        <span className="text-[10px] font-extrabold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-0.5 rounded-full shrink-0">● Aktif</span>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="mt-2 w-full text-xs font-bold text-red-400 hover:underline text-left pl-1"
                    >
                      Keluar dari semua perangkat
                    </button>
                  </SettingsCard>

                  {/* Danger zone */}
                  <SettingsCard title="Zona Berbahaya" icon={<AlertTriangle size={16} className="text-red-400" />}>
                    <p className="text-xs text-[var(--color-text-muted)] mt-1 mb-3 font-medium">
                      Aksi ini tidak dapat dibatalkan. Data riwayat nonton dan akun Anda akan dihapus secara permanen.
                    </p>
                    {!showDeleteConfirm ? (
                      <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500/15 transition-colors text-sm font-bold shadow-sm"
                      >
                        <Trash2 size={14} /> Hapus Akun
                      </button>
                    ) : (
                      <div className="space-y-2 mt-3">
                        <p className="text-xs font-bold text-red-400">
                          Ketik <span className="font-mono bg-red-500/20 px-1.5 py-0.5 rounded text-xs">HAPUS</span> untuk konfirmasi penghapusan:
                        </p>
                        <input
                          value={deleteInput}
                          onChange={e => setDeleteInput(e.target.value)}
                          placeholder='Ketik "HAPUS"'
                          className="w-full bg-[var(--color-surface-2)] border border-red-500/40 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-red-500 transition-colors"
                        />
                        <div className="flex gap-2">
                          <Button
                            variant="danger"
                            disabled={deleteInput !== "HAPUS"}
                            onClick={() => showToast({ msg: "Fitur hapus akun segera hadir", type: "info" })}
                            className="flex-1"
                          >
                            <Trash2 size={14} /> Hapus Permanen
                          </Button>
                          <button
                            onClick={() => { setShowDeleteConfirm(false); setDeleteInput(""); }}
                            className="px-4 py-2 rounded-xl border border-[var(--color-border)] hover:bg-[var(--color-surface-2)] transition-colors text-xs font-bold"
                          >
                            Batal
                          </button>
                        </div>
                      </div>
                    )}
                  </SettingsCard>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </main>
      <BottomNavbar />
    </>
  );
}

// ── Reusable UI Sub-components ─────────────────────────────

function SettingsCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="p-5 bg-[var(--color-surface)] border border-[var(--color-border)] rounded-2xl shadow-sm hover:border-purple-500/15 transition-all duration-300">
      <div className="flex items-center gap-2 pb-2 border-b border-[var(--color-border)]">
        {icon}
        <h3 className="text-sm font-black text-[var(--color-text-primary)]">{title}</h3>
      </div>
      <div className="mt-2">
        {children}
      </div>
    </div>
  );
}

function ToggleRow({
  label, sub, defaultChecked = false, onChange
}: {
  label: string;
  sub?: string;
  defaultChecked?: boolean;
  onChange?: (v: boolean) => void;
}) {
  const [checked, setChecked] = useState(defaultChecked);
  return (
    <div className="flex items-center gap-3 py-2.5">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-[var(--color-text-primary)]">{label}</p>
        {sub && <p className="text-[10px] text-[var(--color-text-muted)] font-medium mt-0.5">{sub}</p>}
      </div>
      <button
        onClick={() => { setChecked(p => { onChange?.(!p); return !p; }); }}
        className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${checked ? "bg-purple-500" : "bg-zinc-700"}`}
      >
        <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${checked ? "translate-x-5" : ""}`} />
      </button>
    </div>
  );
}
