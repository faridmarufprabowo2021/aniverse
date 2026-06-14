import { HTMLAttributes } from "react";
import { cn, getGenreColor } from "@/lib/utils";

// ═══════════════════════════════════════
// BADGE — genre, status, format variants
// ═══════════════════════════════════════

type BadgeVariant = "genre" | "status" | "score" | "format" | "default";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  genre?: string;
  statusClass?: string; // e.g. "badge-watching"
}

export function Badge({
  variant = "default",
  genre,
  statusClass,
  children,
  className,
  ...props
}: BadgeProps) {
  const base =
    "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold rounded-[var(--radius-pill)] shrink-0";

  if (variant === "genre" && genre) {
    const color = getGenreColor(genre);
    return (
      <span
        className={cn(base, className)}
        style={{
          background: `${color}18`,
          color,
          border: `1px solid ${color}40`,
        }}
        {...props}
      >
        {children ?? genre}
      </span>
    );
  }

  if (variant === "status" && statusClass) {
    return (
      <span className={cn(base, statusClass, className)} {...props}>
        {children}
      </span>
    );
  }

  return (
    <span
      className={cn(
        base,
        "bg-[var(--color-surface-2)] text-[var(--color-text-secondary)] border border-[var(--color-border)]",
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
