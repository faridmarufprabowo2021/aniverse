"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Home, Search, BookOpen, Bell, User, Heart, Settings,
  Zap, Sun, Moon, Sparkles, LucideIcon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  hasBadge?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { href: "/",             label: "Beranda",       icon: Home },
  { href: "/search",       label: "Cari Anime",    icon: Search },
  { href: "/manga",        label: "Manga",         icon: BookOpen },
  { href: "/mylist",       label: "Daftar Putar",  icon: Heart },
  { href: "/notifications",label: "Notifikasi",    icon: Bell, hasBadge: true },
  { href: "/profile",      label: "Profil Saya",   icon: User },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeTheme, setActiveTheme] = useState<"dark" | "light" | "amoled">("dark");
  
  // Resizing state
  const [sidebarWidth, setSidebarWidth] = useState(256);
  const [isResizing, setIsResizing] = useState(false);

  // Fetch unread notification count & active theme
  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    // Unread count
    async function fetchUnread() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);
      if (mounted) setUnreadCount(count || 0);
    }
    fetchUnread();

    const channel = supabase
      .channel("notifications-sidebar-badge")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => {
        fetchUnread();
      })
      .subscribe();

    // Theme detection
    const savedTheme = localStorage.getItem("aniverse-theme") as "dark" | "light" | "amoled" | null;
    if (savedTheme) {
      setActiveTheme(savedTheme);
    }

    // Sidebar width detection
    const savedWidth = localStorage.getItem("aniverse-sidebar-width");
    if (savedWidth) {
      const parsed = parseInt(savedWidth, 10);
      if (parsed >= 72 && parsed <= 320) {
        setSidebarWidth(parsed);
      }
    }

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  // Handle dragging events
  const startResizing = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    if (!isResizing) return;

    const handleMouseMove = (e: MouseEvent) => {
      let newWidth = e.clientX;
      if (newWidth < 140) {
        newWidth = 72; // Snap to icon only
      } else if (newWidth > 320) {
        newWidth = 320; // Maximum width
      } else if (newWidth >= 140 && newWidth < 180) {
        // Smooth snap zone
        newWidth = newWidth < 160 ? 72 : 180;
      }
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isResizing]);

  // Persist width changes
  useEffect(() => {
    if (sidebarWidth >= 72 && sidebarWidth <= 320) {
      localStorage.setItem("aniverse-sidebar-width", sidebarWidth.toString());
      document.documentElement.style.setProperty("--sidebar-width", `${sidebarWidth}px`);
    }
  }, [sidebarWidth]);

  // Theme toggle helper
  const toggleTheme = () => {
    const themes: ("dark" | "light" | "amoled")[] = ["dark", "light", "amoled"];
    const nextIdx = (themes.indexOf(activeTheme) + 1) % themes.length;
    const nextTheme = themes[nextIdx];
    
    setActiveTheme(nextTheme);
    localStorage.setItem("aniverse-theme", nextTheme);
    
    const root = document.documentElement;
    const vars = [
      "--color-bg", "--color-surface", "--color-surface-2", "--color-surface-3",
      "--color-border", "--color-border-hover",
      "--color-text-primary", "--color-text-secondary", "--color-text-muted", "--color-text-inverse",
    ];
    vars.forEach(v => root.style.removeProperty(v));

    if (nextTheme === "amoled") {
      root.style.setProperty("--color-bg", "#000000");
      root.style.setProperty("--color-surface", "#050505");
      root.style.setProperty("--color-surface-2", "#0d0d0d");
      root.style.setProperty("--color-surface-3", "#151515");
      root.style.setProperty("--color-border", "#1a1a1a");
    } else if (nextTheme === "light") {
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
  };

  const isCollapsed = sidebarWidth < 160;

  return (
    <>
      {/* Resizing Overlay to capture mouse events smoothly over iframes */}
      {isResizing && (
        <div className="fixed inset-0 z-50 cursor-col-resize pointer-events-auto" />
      )}

      <aside
        className={cn(
          "hidden md:flex flex-col shrink-0 h-dvh fixed left-0 top-0 bottom-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] z-40 select-none",
          isCollapsed ? "px-3 py-6" : "p-6"
        )}
        style={{ width: `${sidebarWidth}px` }}
      >
        {/* Drag Resize Handle */}
        <div
          className={cn(
            "absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-purple-500/50 active:bg-purple-500 transition-colors z-50",
            isResizing ? "bg-purple-500" : "bg-transparent"
          )}
          onMouseDown={startResizing}
        />

        {/* Brand Logo */}
        <Link 
          href="/" 
          className={cn("flex items-center mb-8 shrink-0 group", isCollapsed ? "justify-center" : "gap-3")}
          title={isCollapsed ? "AniVerse" : undefined}
        >
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 gradient-brand transition-transform duration-300 group-hover:scale-110"
            style={{ boxShadow: "0 0 16px var(--color-primary-glow)" }}
          >
            <Zap size={18} className="text-white" fill="white" />
          </div>
          {!isCollapsed && (
            <span
              className="text-xl font-black tracking-tight gradient-text"
              style={{ fontFamily: "var(--font-display)" }}
            >
              AniVerse
            </span>
          )}
        </Link>

        {/* Main Navigation Items */}
        <nav className={cn("flex-1 space-y-1 overflow-y-auto pr-1 scrollbar-thin", isCollapsed && "pr-0 overflow-x-hidden")}>
          {NAV_ITEMS.map(({ href, label, icon: Icon, hasBadge }) => {
            const isActive =
              href === "/"
                ? pathname === "/"
                : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center justify-between px-4 h-11 rounded-xl text-sm font-semibold transition-all group relative",
                  isCollapsed && "justify-center px-0 w-11 h-11 mx-auto",
                  isActive
                    ? "bg-[var(--color-primary-bg)] text-[var(--color-primary)]"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)]"
                )}
                title={isCollapsed ? label : undefined}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    size={18}
                    className={cn(
                      "transition-transform group-hover:scale-105 shrink-0",
                      isActive ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)]"
                    )}
                    strokeWidth={isActive ? 2.5 : 1.8}
                  />
                  {!isCollapsed && <span>{label}</span>}
                </div>

                {/* Badges (like Notification count) */}
                {hasBadge && unreadCount > 0 && (
                  <span className={cn(
                    "min-w-[18px] h-4.5 flex items-center justify-center px-1 rounded-full bg-purple-500 text-white text-[9px] font-black leading-none shrink-0",
                    isCollapsed ? "absolute -top-1.5 -right-1.5" : ""
                  )}>
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}

                {/* Left active line indicator */}
                {isActive && (
                  <motion.div
                    layoutId="sidebar-active-indicator"
                    className="absolute left-0 top-3 bottom-3 w-1 rounded-r-md bg-[var(--color-primary)]"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Settings & Theme Toggle */}
        <div className={cn("pt-4 border-t border-[var(--color-border)] space-y-1 shrink-0 select-none", isCollapsed && "flex flex-col items-center gap-1")}>
          {/* Settings Button */}
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 px-4 h-11 rounded-xl text-sm font-semibold transition-all group",
              isCollapsed && "justify-center px-0 w-11 h-11 mx-auto",
              pathname.startsWith("/settings")
                ? "bg-[var(--color-primary-bg)] text-[var(--color-primary)]"
                : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)]"
            )}
            title={isCollapsed ? "Pengaturan" : undefined}
          >
            <Settings
              size={18}
              className={cn(
                "transition-transform group-hover:rotate-45 duration-300 shrink-0",
                pathname.startsWith("/settings") ? "text-[var(--color-primary)]" : "text-[var(--color-text-muted)] group-hover:text-[var(--color-text-primary)]"
              )}
            />
            {!isCollapsed && <span>Pengaturan</span>}
          </Link>

          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className={cn(
              "w-full flex items-center justify-between px-4 h-11 rounded-xl text-sm font-semibold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition-all group",
              isCollapsed && "justify-center px-0 w-11 h-11 mx-auto"
            )}
            title={isCollapsed ? `Tema: ${activeTheme === "dark" ? "Gelap" : activeTheme === "light" ? "Terang" : "AMOLED"}` : undefined}
          >
            <div className="flex items-center gap-3">
              {activeTheme === "light" && <Sun size={18} className="text-amber-500 shrink-0" />}
              {activeTheme === "dark" && <Moon size={18} className="text-indigo-400 shrink-0" />}
              {activeTheme === "amoled" && <Sparkles size={18} className="text-purple-400 shrink-0" />}
              {!isCollapsed && <span>Tema: {activeTheme === "dark" ? "Gelap" : activeTheme === "light" ? "Terang" : "AMOLED"}</span>}
            </div>
          </button>
        </div>
      </aside>
    </>
  );
}
