"use client";

import { forwardRef, ButtonHTMLAttributes } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "ghost" | "outline" | "danger" | "accent";
type ButtonSize = "sm" | "md" | "lg" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-dim)] shadow-[0_4px_16px_var(--color-primary-glow)]",
  ghost:
    "bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-surface-2)]",
  outline:
    "bg-transparent border border-[var(--color-border)] text-[var(--color-text-primary)] hover:border-[var(--color-border-hover)] hover:bg-[var(--color-surface)]",
  danger:
    "bg-[var(--color-error)] text-white hover:opacity-90",
  accent:
    "bg-[var(--color-accent)] text-white hover:opacity-90",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-xs gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2",
  icon: "h-10 w-10 p-0",
};

const MotionButton = motion.create("button");

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      icon,
      iconRight,
      fullWidth,
      disabled,
      children,
      className,
      ...props
    },
    ref
  ) => {
    return (
      <MotionButton
        ref={ref}
        whileTap={{ scale: 0.97 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-medium rounded-[var(--radius-button)]",
          "transition-all duration-150 cursor-pointer select-none",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          variantStyles[variant],
          sizeStyles[size],
          fullWidth && "w-full",
          className
        )}
        {...(props as Record<string, unknown>)}
      >
        {loading ? (
          <span
            className="block w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin"
            aria-label="Loading"
          />
        ) : (
          <>
            {icon && <span className="shrink-0">{icon}</span>}
            {children}
            {iconRight && <span className="shrink-0">{iconRight}</span>}
          </>
        )}
      </MotionButton>
    );
  }
);

Button.displayName = "Button";
