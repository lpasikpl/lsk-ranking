"use client";

import { AnimatedNumber } from "@/components/strava/ui/AnimatedNumber";

interface GarminStatCardProps {
  label: string;
  value: number | null;
  unit?: string;
  decimals?: number;
  status?: string | null;
  statusColor?: string; // kolor pigułki statusu
  prevValue?: number | null;
  invert?: boolean; // true => spadek jest "dobry" (np. tętno spoczynkowe)
  sub?: string; // dodatkowy opis pod wartością (np. "śr. 7 dni 42")
}

export function GarminStatCard({
  label, value, unit = "", decimals = 0, status, statusColor = "rgba(255,255,255,0.4)",
  prevValue, invert, sub,
}: GarminStatCardProps) {
  const hasDelta = value != null && prevValue != null && prevValue !== 0;
  const delta = hasDelta ? value! - prevValue! : 0;
  const good = invert ? delta < 0 : delta > 0;
  const deltaColor = delta === 0 ? "rgba(255,255,255,0.3)" : good ? "#4ade80" : "#f87171";

  return (
    <div
      className="h-full flex flex-col justify-between"
      style={{
        borderRadius: 14,
        background: "linear-gradient(145deg, #0a0a0a 0%, #111111 100%)",
        border: "1px solid rgba(255,255,255,0.07)",
        padding: "16px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", textTransform: "uppercase", letterSpacing: "0.07em", lineHeight: 1.3 }}>{label}</span>
        {status && (
          <span style={{
            fontSize: 9.5, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em",
            color: statusColor, background: `${statusColor}1f`, border: `1px solid ${statusColor}55`,
            borderRadius: 999, padding: "2px 7px", whiteSpace: "nowrap",
          }}>{status}</span>
        )}
      </div>
      <div className="flex flex-col items-start gap-1">
        <span style={{ color: "rgba(255,255,255,0.95)" }}>
          {value == null ? (
            <span className="text-xl font-bold" style={{ color: "rgba(255,255,255,0.3)" }}>—</span>
          ) : (
            <AnimatedNumber value={value} decimals={decimals} suffix={unit} className="text-2xl font-bold leading-tight" />
          )}
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11 }}>
          {hasDelta && delta !== 0 && (
            <span style={{ color: deltaColor, fontWeight: 600 }}>
              {delta > 0 ? "▲" : "▼"} {Math.abs(delta).toFixed(decimals)}{unit}
            </span>
          )}
          {sub && <span style={{ color: "rgba(255,255,255,0.35)" }}>{sub}</span>}
        </div>
      </div>
    </div>
  );
}
