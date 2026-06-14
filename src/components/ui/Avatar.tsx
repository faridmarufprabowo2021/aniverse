"use client";

import { HTMLAttributes } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface AvatarProps extends HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  fallback?: string;
}

const sizeMap = {
  xs: { px: 24, className: "w-6 h-6 text-xs" },
  sm: { px: 32, className: "w-8 h-8 text-xs" },
  md: { px: 40, className: "w-10 h-10 text-sm" },
  lg: { px: 56, className: "w-14 h-14 text-base" },
  xl: { px: 80, className: "w-20 h-20 text-xl" },
};

export function Avatar({ src, alt = "", size = "md", fallback, className, ...props }: AvatarProps) {
  const { px, className: sizeClass } = sizeMap[size];

  const initials = fallback
    ? fallback
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <div
      className={cn(
        "relative rounded-full overflow-hidden shrink-0 bg-[var(--color-surface-2)] border border-[var(--color-border)]",
        sizeClass,
        className
      )}
      {...props}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          className="object-cover"
          sizes={`${px}px`}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center font-semibold text-[var(--color-text-secondary)]">
          {initials}
        </div>
      )}
    </div>
  );
}
