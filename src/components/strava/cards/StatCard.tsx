"use client";

import { AnimatedNumber } from "@/components/strava/ui/AnimatedNumber";
import { DeltaBadge } from "@/components/strava/ui/DeltaBadge";

interface StatCardProps {
  label: string;
  value: number;
  prevValue?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  formatter?: (value: number) => string;
}

export function StatCard({ label, value, prevValue, decimals = 0, suffix = "", prefix = "", formatter }: StatCardProps) {
  return (
    <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-4 hover:bg-[var(--bg-card-hover)] transition-colors">
      <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-1">{label}</div>
      <div className="flex items-end gap-2">
        <AnimatedNumber
          value={value}
          decimals={decimals}
          prefix={prefix}
          suffix={suffix}
          className="text-xl font-bold"
          formatter={formatter}
        />
        {prevValue !== undefined && (
          <DeltaBadge current={value} previous={prevValue} valueSuffix={suffix} valueDecimals={decimals} formatter={formatter} />
        )}
      </div>
    </div>
  );
}
