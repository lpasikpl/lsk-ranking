"use client";

import { useEffect, useState } from "react";

interface ProgressRingProps {
  progress: number;
  yearProgress?: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  progress,
  yearProgress,
  size = 120,
  strokeWidth = 14,
  color = "var(--accent-orange)",
  children,
}: ProgressRingProps) {
  const hasYearRing = yearProgress !== undefined;
  const outerStroke = 4;
  const gap = 6;

  const mainRadius = (size - strokeWidth) / 2 - (hasYearRing ? outerStroke + gap : 0);
  const mainCirc = mainRadius * 2 * Math.PI;
  const clamped = Math.min(Math.max(progress, 0), 100);
  const targetOffset = mainCirc - (clamped / 100) * mainCirc;

  const outerRadius = (size - outerStroke) / 2;
  const outerCirc = outerRadius * 2 * Math.PI;
  const yearClamped = Math.min(Math.max(yearProgress ?? 0, 0), 100);
  const yearOffset = outerCirc - (yearClamped / 100) * outerCirc;

  // Animacja przez transition — niezawodna w każdej przeglądarce
  const [offset, setOffset] = useState(mainCirc);
  useEffect(() => {
    const t = setTimeout(() => setOffset(targetOffset), 60);
    return () => clearTimeout(t);
  }, [targetOffset]);

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Ścieżka tła — główny ring */}
        <circle
          cx={size / 2} cy={size / 2} r={mainRadius}
          fill="none"
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
        />
        {/* Wypełnienie głównego ringa */}
        <circle
          cx={size / 2} cy={size / 2} r={mainRadius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          style={{
            strokeDasharray: mainCirc,
            strokeDashoffset: offset,
            transition: "stroke-dashoffset 1.4s cubic-bezier(0.4,0,0.2,1)",
          }}
        />
        {/* Zewnętrzny ring postępu roku */}
        {hasYearRing && (
          <>
            <circle
              cx={size / 2} cy={size / 2} r={outerRadius}
              fill="none"
              stroke="rgba(255,255,255,0.07)"
              strokeWidth={outerStroke}
            />
            <circle
              cx={size / 2} cy={size / 2} r={outerRadius}
              fill="none"
              stroke="rgba(255,255,255,0.30)"
              strokeWidth={outerStroke}
              strokeLinecap="round"
              style={{ strokeDasharray: outerCirc, strokeDashoffset: yearOffset }}
            />
          </>
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
}
