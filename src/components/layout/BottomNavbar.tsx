"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Home, Search, Bell, BookOpen, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

const NAV_ITEMS = [
  { href: "/",             label: "Beranda",   icon: Home },
  { href: "/search",       label: "Cari",      icon: Search },
  { href: "/manga",        label: "Manga",     icon: BookOpen },
  { href: "/notifications",label: "Notifikasi",icon: Bell },
  { href: "/profile",      label: "Profil",    icon: User },
] as const;

export function BottomNavbar() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch unread notification count
  useEffect(() => {
    const supabase = createClient();
    let mounted = true;
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
    // Realtime subscription for live badge updates
    const channel = supabase
      .channel("notifications-badge")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => {
        fetchUnread();
      })
      .subscribe();
    return () => { mounted = false; supabase.removeChannel(channel); };
  }, []);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 glass-heavy border-t border-[var(--color-border)] md:hidden"
      style={{
        height: "calc(var(--bottom-nav-height) + var(--safe-area-bottom))",
        paddingBottom: "var(--safe-area-bottom)",
      }}
    >
      <ul className="flex items-stretch justify-around h-[var(--bottom-nav-height)]">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/"
              ? pathname === "/"
              : pathname.startsWith(href);
          const isBell = href === "/notifications";

          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className="flex flex-col items-center justify-center h-full gap-1 relative"
                aria-label={label}
              >
                <div className="relative flex flex-col items-center">
                  <motion.div
                    animate={{
                      scale: isActive ? 1 : 1,
                      color: isActive ? "var(--color-primary)" : "var(--color-text-muted)",
                    }}
                    transition={{ type: "spring", stiffness: 400, damping: 25 }}
                    className="relative"
                  >
                    <Icon size={22} strokeWidth={isActive ? 2.5 : 1.8} />
                    {/* Unread badge on bell icon */}
                    {isBell && unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 flex items-center justify-center px-1 rounded-full bg-purple-500 text-white text-[9px] font-black leading-none">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </motion.div>

                  <span
                    className={cn(
                      "text-[10px] font-medium mt-0.5 transition-colors duration-150",
                      isActive
                        ? "text-[var(--color-primary)]"
                        : "text-[var(--color-text-muted)]"
                    )}
                  >
                    {label}
                  </span>
                </div>

                {/* Active indicator dot */}
                {isActive && (
                  <motion.div
                    layoutId="nav-indicator"
                    className="absolute -top-0.5 w-8 h-0.5 rounded-full bg-[var(--color-primary)]"
                    style={{ boxShadow: "0 0 8px var(--color-primary-glow)" }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
