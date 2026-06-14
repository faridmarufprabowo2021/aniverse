"use client";

import { useEffect, useRef } from "react";
import { motion, useAnimation, useInView } from "framer-motion";
import { getScoreColor, formatScore } from "@/lib/utils";

interface ScoreRingProps {
  score: number | undefined; // 0–10
  size?: number;
  strokeWidth?: number;
  className?: string;
}

export function ScoreRing({
  score,
  size = 72,
  strokeWidth = 6,
  className,
}: ScoreRingProps) {
  const controls = useAnimation();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20px" });

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  const normalizedScore = score != null ? Math.min(10, Math.max(0, score)) : 0;
  const fraction = normalizedScore / 10;
  const offset = circumference * (1 - fraction);

  const color = getScoreColor(score);

  useEffect(() => {
    if (inView) {
      controls.start({
        strokeDashoffset: offset,
        transition: { duration: 1.2, ease: "easeOut", delay: 0.4 },
      });
    }
  }, [inView, offset, controls]);

  return (
    <div ref={ref} className={className} style={{ width: size, height: size }}>
      <div className="score-ring-wrapper" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="var(--color-surface-3)"
            strokeWidth={strokeWidth}
          />
          {/* Animated fill */}
          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={controls}
            style={{
              rotate: -90,
              transformOrigin: `${size / 2}px ${size / 2}px`,
              filter: `drop-shadow(0 0 6px ${color}80)`,
            }}
          />
        </svg>

        {/* Center text */}
        <div
          className="score-ring-text flex flex-col items-center leading-none"
          style={{ color }}
        >
          {score != null ? (
            <>
              <span style={{ fontSize: size * 0.22, fontWeight: 800 }}>
                {formatScore(score)}
              </span>
              <span style={{ fontSize: size * 0.12, color: "var(--color-text-muted)", fontWeight: 400 }}>
                /10
              </span>
            </>
          ) : (
            <span style={{ fontSize: size * 0.16, color: "var(--color-text-muted)" }}>N/A</span>
          )}
        </div>
      </div>
    </div>
  );
}
