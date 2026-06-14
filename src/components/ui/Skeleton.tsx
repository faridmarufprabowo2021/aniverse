import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  rounded?: "sm" | "md" | "lg" | "full";
}

const roundedMap = {
  sm: "rounded-[var(--radius-sm)]",
  md: "rounded-[var(--radius-card)]",
  lg: "rounded-[var(--radius-modal)]",
  full: "rounded-full",
};

export function Skeleton({
  width,
  height,
  rounded = "sm",
  className,
  style,
  ...props
}: SkeletonProps) {
  return (
    <div
      className={cn("skeleton", roundedMap[rounded], className)}
      style={{ width, height, ...style }}
      aria-hidden="true"
      {...props}
    />
  );
}
