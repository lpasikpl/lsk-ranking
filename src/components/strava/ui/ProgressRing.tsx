"use client";

import { useEffect, useState } from "react";

interface ProgressRingProps {
  progress: number;       // % realizacji celu (0-100)
  yearProgress?: number;  // % upływu roku (0-100) — cienki zewnętrzny ring
  size?: number;
  strokeWidth?: number;
  color?: string;
  children?: React.ReactNode;
}

export function ProgressRing({
  progress,
  yearProgress,
  size = 120,
  strokeWidth = 8,
  color = "var(--accent-orange)",
  children,
}: ProgressRingProps) {
  const hasYearRing = yearProgress !== undefined;
  const outerStroke = 3;
  const gap = 5;

  // Główny ring — wewnątrz, insetowany o (outerStroke + gap) jeśli jest zewnętrzny
  const mainRadius = (size - strokeWidth) / 2 - (hasYearRing ? outerStroke + gap : 0);
  const mainCirc = mainRadius * 2 * Math.PI;
  const clamped = Math.min(Math.max(progress, 0), 100);

  const targetOffset = mainCirc - (clamped / 100) * mainCirc;

  // double-RAF: przeglądarka najpierw maluje stan pusty (offset=mainCirc),
  // dopiero potem zmienia, żeby CSS transition mógł złapać różnicę
  const [displayOffset, setDisplayOffset] = useState(mainCirc);
  useEffect(() => {
    let raf1: number;
    let raf2: number;
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setDisplayOffset(targetOffset));
    });
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [targetOffset]);

  // Zewnętrzny cienki ring roku
  const outerRadius = (size - outerStroke) / 2;
  const outerCirc = outerRadius * 2 * Math.PI;
  const yearClamped = Math.min(Math.max(yearProgress ?? 0, 0), 100);
  const yearOffset = outerCirc - (yearClamped / 100) * outerCirc;

  return (
    <div
      className="relative inline-flex items-center justify-center"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90" style={{ overflow: "visible" }}>
        {/* Track głównego ringu */}
        <circle
          cx={size / 2} cy={size / 2} r={mainRadius}
          fill="none"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth={strokeWidth}
        />
        {/* Główny ring — realizacja celu */}
        <circle
          cx={size / 2} cy={size / 2} r={mainRadius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={mainCirc}
          strokeDashoffset={displayOffset}
          style={{ transition: "stroke-dashoffset 1.4s cubic-bezier(0.4, 0, 0.2, 1)" }}
        />
        {/* Zewnętrzny cienki ring — upływ roku */}
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
              strokeDasharray={outerCirc}
              strokeDashoffset={yearOffset}
            />
          </>
        )}
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
