"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Search, Bell, Zap, User } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopBarProps {
  transparent?: boolean;
  className?: string;
}

export function TopBar({ transparent, className }: TopBarProps) {
  const router = useRouter();

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-40 flex items-center justify-between px-4 md:hidden",
        "transition-all duration-300",
        transparent
          ? "bg-transparent"
          : "glass-heavy border-b border-[var(--color-border)]",
        className
      )}
      style={{ height: "var(--top-bar-height)", paddingTop: "var(--safe-area-top)" }}
    >
      {/* Logo */}
      <Link href="/" className="flex items-center gap-2 shrink-0">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center gradient-brand"
          style={{ boxShadow: "0 0 12px var(--color-primary-glow)" }}
        >
          <Zap size={18} className="text-white" fill="white" />
        </div>
        <span
          className="text-lg font-black tracking-tight gradient-text"
          style={{ fontFamily: "var(--font-display)" }}
        >
          AniVerse
        </span>
      </Link>

      {/* Actions */}
      <div className="flex items-center gap-1">
        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => router.push("/search")}
          className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition-colors"
          aria-label="Search"
        >
          <Search size={20} />
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.9 }}
          onClick={() => router.push("/profile")}
          className="w-10 h-10 rounded-full flex items-center justify-center text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)] transition-colors relative"
          aria-label="Profile"
        >
          <User size={20} />
        </motion.button>
      </div>
    </header>
  );
}
