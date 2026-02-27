"use client";

import { cn } from "@/lib/utils";

interface DeltaBadgeProps {
  current: number;
  previous: number;
  suffix?: string;
  invert?: boolean;
  valueSuffix?: string;
  valueDecimals?: number;
  formatter?: (value: number) => string;
}

export function DeltaBadge({ current, previous, suffix = "%", invert = false, valueSuffix = "", valueDecimals = 0, formatter }: DeltaBadgeProps) {
  if (previous === 0) return <span className="text-xs text-[var(--text-muted)]">—</span>;

  const pct = ((current - previous) / previous) * 100;
  const isPositive = invert ? pct <= 0 : pct >= 0;
  const isNeutral = Math.abs(pct) < 1;

  const prevFormatted = formatter
    ? formatter(previous)
    : `${previous.toFixed(valueDecimals)}${valueSuffix}`;

  return (
    <span className="relative group/delta">
      <span
        className={cn(
          "inline-flex items-center gap-0.5 text-xs font-medium rounded-full px-2 py-0.5 cursor-default",
          isNeutral && "bg-[var(--border)] text-[var(--text-secondary)]",
          !isNeutral && isPositive && "bg-emerald-500/15 text-emerald-400",
          !isNeutral && !isPositive && "bg-red-500/15 text-red-400"
        )}
      >
        {pct >= 0 ? "+" : ""}
        {pct.toFixed(0)}
        {suffix}
      </span>
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 text-xs bg-gray-900 text-gray-100 rounded-md whitespace-nowrap opacity-0 group-hover/delta:opacity-100 transition-opacity duration-150 z-20 border border-gray-700">
        2025: {prevFormatted}
      </span>
    </span>
  );
}
