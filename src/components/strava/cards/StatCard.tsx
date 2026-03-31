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
  invert?: boolean;
}

export function StatCard({ label, value, prevValue, decimals = 0, suffix = "", prefix = "", formatter, invert }: StatCardProps) {
  return (
    <div
      className="h-full flex flex-col justify-between"
      style={{
        borderRadius: 14,
        background: "linear-gradient(145deg, #0a0a0a 0%, #111111 100%)",
        border: "1px solid rgba(255,255,255,0.07)",
        padding: "16px",
        transition: "border-color 0.2s ease",
      }}
    >
      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 8, lineHeight: 1.3 }}>{label}</div>
      <div className="flex flex-col items-start gap-1.5">
        <span style={{ color: "rgba(255,255,255,0.95)" }}>
          <AnimatedNumber
            value={value}
            decimals={decimals}
            prefix={prefix}
            suffix={suffix}
            className="text-xl font-bold leading-tight"
            formatter={formatter}
          />
        </span>
        {prevValue !== undefined && (
          <DeltaBadge current={value} previous={prevValue} valueSuffix={suffix} valueDecimals={decimals} formatter={formatter} invert={invert} />
        )}
      </div>
    </div>
  );
}
