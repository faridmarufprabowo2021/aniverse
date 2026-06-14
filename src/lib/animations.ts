import { Variants } from "framer-motion";

// ═══════════════════════════════════════
// PAGE TRANSITIONS
// ═══════════════════════════════════════

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 24 },
  animate: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: {
    opacity: 0,
    y: -12,
    transition: { duration: 0.2 },
  },
};

// ═══════════════════════════════════════
// STAGGERED LIST
// ═══════════════════════════════════════

export const containerVariants: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

export const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] },
  },
};

// ═══════════════════════════════════════
// CARD HOVER
// ═══════════════════════════════════════

export const cardHover = {
  whileHover: { scale: 1.03, boxShadow: "0 8px 32px rgba(108,99,255,0.3)" },
  whileTap: { scale: 0.97 },
  transition: { type: "spring", stiffness: 400, damping: 25 },
};

// ═══════════════════════════════════════
// BOTTOM SHEET
// ═══════════════════════════════════════

export const bottomSheetVariants: Variants = {
  hidden: { y: "100%" },
  visible: {
    y: 0,
    transition: { type: "spring", damping: 30, stiffness: 300 },
  },
  exit: { y: "100%", transition: { duration: 0.25, ease: "easeIn" } },
};

// ═══════════════════════════════════════
// FADE IN SCALE (modals, tooltips)
// ═══════════════════════════════════════

export const fadeScaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.92 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.22, ease: [0.25, 0.46, 0.45, 0.94] },
  },
  exit: { opacity: 0, scale: 0.92, transition: { duration: 0.15 } },
};

// ═══════════════════════════════════════
// OVERLAY (backdrop)
// ═══════════════════════════════════════

export const overlayVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.2 } },
};

// ═══════════════════════════════════════
// FILTER PILL SPRING
// ═══════════════════════════════════════

export const pillSelectVariants = (selected: boolean) => ({
  animate: { scale: selected ? [1, 1.15, 1] : 1 },
  transition: { duration: 0.3, type: "spring", stiffness: 500 },
});

// ═══════════════════════════════════════
// HERO FADE
// ═══════════════════════════════════════

export const heroVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.6 } },
  exit: { opacity: 0, transition: { duration: 0.4 } },
};

// ═══════════════════════════════════════
// SLIDE (notifications, toasts)
// ═══════════════════════════════════════

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 64 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { type: "spring", damping: 24, stiffness: 260 },
  },
  exit: { opacity: 0, x: 64, transition: { duration: 0.2 } },
};
