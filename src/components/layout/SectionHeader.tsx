import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  seeAllHref?: string;
  className?: string;
}

export function SectionHeader({ title, subtitle, seeAllHref, className }: SectionHeaderProps) {
  return (
    <div className={cn("flex items-center justify-between mb-4", className)}>
      <div>
        <h2 className="text-lg font-bold text-[var(--color-text-primary)]" style={{ fontFamily: "var(--font-display)" }}>
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-[var(--color-text-muted)] mt-0.5">{subtitle}</p>
        )}
      </div>

      {seeAllHref && (
        <Link
          href={seeAllHref}
          className="flex items-center gap-0.5 text-xs font-semibold text-[var(--color-primary)] hover:text-[var(--color-primary-dim)] transition-colors"
        >
          See All
          <ChevronRight size={14} />
        </Link>
      )}
    </div>
  );
}
