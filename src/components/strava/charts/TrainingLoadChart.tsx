"use client";

import { useState, useCallback, useEffect } from "react";
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, ReferenceArea,
} from "recharts";
import type { TrainingLoadDay } from "@/lib/strava-types";

interface TrainingLoadChartProps {
  data: TrainingLoadDay[];
}

// ─── TSB zones ───────────────────────────────────────────────────────────────
const TSB_ZONES = [
  { y1: 15,  y2: 25,  fill: "#22c55e", opacity: 0.09, label: "Forma wyścigowa" },
  { y1: 5,   y2: 15,  fill: "#22c55e", opacity: 0.05, label: "Świeży / gotowy" },
  { y1: -10, y2: 5,   fill: "#3b82f6", opacity: 0.05, label: "Produktywny trening" },
  { y1: -30, y2: -10, fill: "#f97316", opacity: 0.06, label: "Przeciążenie" },
  { y1: -50, y2: -30, fill: "#ef4444", opacity: 0.09, label: "Strefa niebezpieczna" },
] as const;

// ─── ATL/CTL ratio classification ────────────────────────────────────────────
function atlRatioBadge(ratio: number): { label: string; color: string } {
  if (ratio < 1.3) return { label: "Zrównoważony", color: "#34d399" };
  if (ratio <= 1.5) return { label: "Budowanie", color: "#fb923c" };
  return { label: "Agresywne przeciążenie", color: "#f87171" };
}

// ─── CTL weekly rate classification ──────────────────────────────────────────
function ctlRateBadge(delta7: number): { label: string; color: string } {
  if (delta7 < 3)  return { label: "Wolna progresja", color: "#9ca3af" };
  if (delta7 <= 5) return { label: "Optymalny build", color: "#34d399" };
  if (delta7 <= 7) return { label: "Szybki build",    color: "#fb923c" };
  return { label: "Za szybko", color: "#f87171" };
}

// ─── ChartContent ─────────────────────────────────────────────────────────────
function ChartContent({ data, gradientId, height, showZones }: {
  data: TrainingLoadDay[];
  gradientId: string;
  height: number;
  showZones: boolean;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#22c55e" stopOpacity={0.15} />
            <stop offset="50%" stopColor="#22c55e" stopOpacity={0} />
            <stop offset="50%" stopColor="#ef4444" stopOpacity={0} />
            <stop offset="100%" stopColor="#ef4444" stopOpacity={0.15} />
          </linearGradient>
        </defs>

        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
        <XAxis
          dataKey="day"
          tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
          axisLine={{ stroke: "rgba(255,255,255,0.08)" }}
          tickLine={false}
          tickFormatter={(d) => new Date(d).toLocaleDateString("pl-PL", { day: "numeric", month: "short" })}
          minTickGap={40}
        />
        <YAxis
          tick={{ fill: "rgba(255,255,255,0.45)", fontSize: 11 }}
          axisLine={false}
          tickLine={false}
          domain={[-30, 90]}
          ticks={[-30, -20, -10, 0, 10, 20, 30, 40, 50, 60, 70, 80, 90]}
        />
        <ReferenceLine y={0} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />

        {/* TSB zones — behind everything */}
        {showZones && TSB_ZONES.map((z) => (
          <ReferenceArea
            key={z.label}
            y1={z.y1}
            y2={z.y2}
            fill={z.fill}
            fillOpacity={z.opacity}
            stroke="none"
            label={{
              value: z.label,
              position: "insideTopRight",
              fill: "rgba(255,255,255,0.35)",
              fontSize: 10,
            }}
          />
        ))}

        <Tooltip
          contentStyle={{
            backgroundColor: "#0f1117",
            border: "1px solid rgba(255,255,255,0.15)",
            borderRadius: "8px",
            color: "#fff",
            fontSize: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,0.8)",
          }}
          labelFormatter={(d) => new Date(d).toLocaleDateString("pl-PL", { day: "numeric", month: "long" })}
        />
        <Area
          type="monotone"
          dataKey="tsb"
          stroke="transparent"
          fill={`url(#${gradientId})`}
          name="TSB (forma)"
        />
        <Line type="monotone" dataKey="ctl" stroke="#3b82f6" strokeWidth={2} dot={false} name="CTL (fitness)" />
        <Line type="monotone" dataKey="atl" stroke="#ef4444" strokeWidth={2} dot={false} name="ATL (zmęczenie)" />
        <Line type="monotone" dataKey="tsb" stroke="#22c55e" strokeWidth={2} dot={false} name="TSB (forma)" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────
function getCtlDaysAgo(data: TrainingLoadDay[], days: number): number | null {
  if (data.length === 0) return null;
  const latest = new Date(data[data.length - 1].day);
  const target = new Date(latest);
  target.setDate(target.getDate() - days);
  const targetStr = target.toISOString().split("T")[0];
  const filtered = data.filter((d) => d.day <= targetStr);
  if (filtered.length === 0) return null;
  return filtered[filtered.length - 1].ctl;
}

// ─── CtlStats ─────────────────────────────────────────────────────────────────
function CtlStats({ data }: { data: TrainingLoadDay[] }) {
  if (data.length === 0) return null;
  const current = data[data.length - 1];
  const ctlNow = Math.round(current.ctl * 10) / 10;
  const atlNow = Math.round(current.atl * 10) / 10;
  const tsbNow = Math.round(current.tsb * 10) / 10;

  const ratio = ctlNow > 0 ? atlNow / ctlNow : 0;
  const ratioBadge = atlRatioBadge(ratio);

  const periods = [7, 14, 30, 60, 90];
  const deltas = periods.map((d) => {
    const past = getCtlDaysAgo(data, d);
    if (past === null) return null;
    return Math.round((current.ctl - past) * 10) / 10;
  });

  const delta7 = deltas[0];
  const rateBadge = delta7 !== null ? ctlRateBadge(delta7) : null;

  const deltaColor = (v: number | null) => {
    if (v === null) return "rgba(255,255,255,0.3)";
    if (v > 0) return "#34d399";
    if (v < 0) return "#f87171";
    return "rgba(255,255,255,0.5)";
  };

  const fmt = (v: number | null) => {
    if (v === null) return "—";
    return v > 0 ? `+${v}` : `${v}`;
  };

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 pb-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
      {/* Aktualne wartości */}
      <div className="flex items-center gap-1.5 mr-1">
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Teraz</span>
      </div>
      <span style={{ fontSize: 16, fontWeight: 700, color: "#3b82f6" }}>CTL {ctlNow}</span>
      <div className="flex flex-col gap-0.5">
        <span style={{ fontSize: 16, fontWeight: 700, color: "#ef4444" }}>ATL {atlNow}</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: ratioBadge.color }}>
          {ratio.toFixed(2)}× — {ratioBadge.label}
        </span>
      </div>
      <span style={{ fontSize: 16, fontWeight: 700, color: tsbNow >= 0 ? "#34d399" : "#f87171" }}>
        TSB {tsbNow > 0 ? `+${tsbNow}` : tsbNow}
      </span>

      {/* Separator */}
      <div style={{ width: 1, height: 28, background: "rgba(255,255,255,0.1)" }} className="hidden sm:block" />

      {/* Deltas CTL */}
      <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em" }}>CTL Δ</span>

      {periods.map((d, i) => {
        const delta = deltas[i];
        const past = getCtlDaysAgo(data, d);
        const pct = past && past !== 0 ? Math.round((delta! / past) * 100) : null;
        const isFirst = i === 0;
        return (
          <div key={d} className="flex flex-col items-start">
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{d}d</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: deltaColor(delta), lineHeight: 1.2 }}>{fmt(delta)}</span>
            {pct !== null && (
              <span style={{ fontSize: 10, color: deltaColor(delta), opacity: 0.75 }}>
                {pct > 0 ? `+${pct}%` : `${pct}%`}
                {isFirst && rateBadge && (
                  <span style={{ color: rateBadge.color, marginLeft: 4 }}>— {rateBadge.label}</span>
                )}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Legend ───────────────────────────────────────────────────────────────────
function Legend({ showZones, onToggle }: { showZones: boolean; onToggle: () => void }) {
  return (
    <div className="flex items-center justify-between mt-3">
      <div className="flex items-center gap-6 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded" style={{ background: "#3b82f6" }} /> CTL (fitness)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded" style={{ background: "#ef4444" }} /> ATL (zmęczenie)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded" style={{ background: "#22c55e" }} /> TSB (forma)
        </span>
        {/* Zone legend items */}
        {showZones && (
          <>
            <span className="flex items-center gap-1.5 ml-2">
              <span className="w-3 h-2.5 rounded-sm" style={{ background: "#22c55e", opacity: 0.4 }} /> Strefy TSB
            </span>
          </>
        )}
      </div>
      {/* Toggle zones button */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        title={showZones ? "Ukryj strefy" : "Pokaż strefy"}
        style={{
          fontSize: 11,
          padding: "3px 10px",
          borderRadius: 6,
          border: showZones
            ? "1px solid rgba(34,197,94,0.35)"
            : "1px solid rgba(255,255,255,0.1)",
          background: showZones ? "rgba(34,197,94,0.1)" : "transparent",
          color: showZones ? "#34d399" : "rgba(255,255,255,0.35)",
          transition: "all 0.2s",
          cursor: "pointer",
        }}
      >
        {showZones ? "▦ Strefy ON" : "▦ Strefy OFF"}
      </button>
    </div>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export function TrainingLoadChart({ data }: TrainingLoadChartProps) {
  const [expanded, setExpanded] = useState(false);
  const [showZones, setShowZones] = useState(true);

  const close = useCallback(() => setExpanded(false), []);

  useEffect(() => {
    if (!expanded) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [expanded, close]);

  const toggleZones = useCallback(() => setShowZones((v) => !v), []);

  return (
    <>
      <div
        className="rounded-xl p-6 cursor-pointer transition-opacity hover:opacity-90"
        style={{ background: "linear-gradient(145deg, #0a0a0a 0%, #111111 100%)", border: "1px solid rgba(255,255,255,0.07)" }}
        onClick={() => setExpanded(true)}
        title="Kliknij, aby powiększyć"
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-medium" style={{ color: "rgba(255,255,255,0.6)" }}>
            CTL / ATL / TSB — ostatnie 90 dni
          </h2>
        </div>
        <CtlStats data={data} />
        <div className="mt-4">
          <ChartContent data={data} gradientId="gradTsb" height={560} showZones={showZones} />
        </div>
        <Legend showZones={showZones} onToggle={toggleZones} />
      </div>

      {expanded && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm"
          onClick={close}
        >
          <div
            className="relative w-[95vw] max-w-[1400px] rounded-2xl bg-[#0f1117] border border-[rgba(255,255,255,0.15)] p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={close}
              className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors text-2xl leading-none"
            >
              &times;
            </button>
            <h2 className="text-base font-medium text-white/80 mb-4">
              CTL / ATL / TSB — ostatnie 90 dni
            </h2>
            <CtlStats data={data} />
            <div className="mt-4">
              <ChartContent data={data} gradientId="gradTsbExpanded" height={500} showZones={showZones} />
            </div>
            <Legend showZones={showZones} onToggle={toggleZones} />
          </div>
        </div>
      )}
    </>
  );
}
