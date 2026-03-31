"use client";

import { useState, useCallback, useEffect } from "react";
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import type { TrainingLoadDay } from "@/lib/strava-types";

interface TrainingLoadChartProps {
  data: TrainingLoadDay[];
}

function ChartContent({ data, gradientId, height }: { data: TrainingLoadDay[]; gradientId: string; height: number }) {
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

function CtlStats({ data }: { data: TrainingLoadDay[] }) {
  if (data.length === 0) return null;
  const current = data[data.length - 1];
  const ctlNow = Math.round(current.ctl * 10) / 10;
  const atlNow = Math.round(current.atl * 10) / 10;
  const tsbNow = Math.round(current.tsb * 10) / 10;

  const periods = [7, 14, 30, 60, 90];
  const deltas = periods.map((d) => {
    const past = getCtlDaysAgo(data, d);
    if (past === null) return null;
    return Math.round((current.ctl - past) * 10) / 10;
  });

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
    <div
      className="mt-4 pt-4 flex flex-wrap items-center gap-x-6 gap-y-2"
      style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
    >
      {/* Aktualne wartości */}
      <div className="flex items-center gap-4 mr-2">
        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Teraz</span>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#3b82f6" }}>CTL {ctlNow}</span>
        <span style={{ fontSize: 16, fontWeight: 700, color: "#ef4444" }}>ATL {atlNow}</span>
        <span style={{ fontSize: 16, fontWeight: 700, color: tsbNow >= 0 ? "#34d399" : "#f87171" }}>TSB {tsbNow > 0 ? `+${tsbNow}` : tsbNow}</span>
      </div>

      {/* Separator */}
      <div style={{ width: 1, height: 20, background: "rgba(255,255,255,0.1)" }} className="hidden sm:block" />

      {/* Deltas CTL */}
      <div className="flex items-center gap-1" style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        CTL Δ
      </div>
      {periods.map((d, i) => {
        const delta = deltas[i];
        const past = getCtlDaysAgo(data, d);
        const pct = past && past !== 0 ? Math.round((delta! / past) * 100) : null;
        return (
          <div key={d} className="flex flex-col items-start">
            <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{d}d</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: deltaColor(delta), lineHeight: 1.2 }}>{fmt(delta)}</span>
            {pct !== null && (
              <span style={{ fontSize: 11, color: deltaColor(delta), opacity: 0.7 }}>
                {pct > 0 ? `+${pct}%` : `${pct}%`}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

function LegendWithStats({ data }: { data: TrainingLoadDay[] }) {
  return (
    <>
      <div className="flex items-center gap-6 mt-3 text-xs" style={{ color: "rgba(255,255,255,0.45)" }}>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded" style={{ background: "#3b82f6" }} /> CTL (fitness)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded" style={{ background: "#ef4444" }} /> ATL (zmęczenie)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 rounded" style={{ background: "#22c55e" }} /> TSB (forma)
        </span>
      </div>
      <CtlStats data={data} />
    </>
  );
}

export function TrainingLoadChart({ data }: TrainingLoadChartProps) {
  const [expanded, setExpanded] = useState(false);

  const close = useCallback(() => setExpanded(false), []);

  useEffect(() => {
    if (!expanded) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [expanded, close]);

  return (
    <>
      <div
        className="rounded-xl p-6 cursor-pointer transition-opacity hover:opacity-90"
        style={{ background: "linear-gradient(145deg, #0a0a0a 0%, #111111 100%)", border: "1px solid rgba(255,255,255,0.07)" }}
        onClick={() => setExpanded(true)}
        title="Kliknij, aby powiększyć"
      >
        <h2 className="text-sm font-medium mb-4" style={{ color: "rgba(255,255,255,0.6)" }}>
          CTL / ATL / TSB — ostatnie 90 dni
        </h2>
        <ChartContent data={data} gradientId="gradTsb" height={420} />
        <LegendWithStats data={data} />
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
            <h2 className="text-base font-medium text-white/80 mb-6">
              CTL / ATL / TSB — ostatnie 90 dni
            </h2>
            <ChartContent data={data} gradientId="gradTsbExpanded" height={500} />
            <LegendWithStats data={data} />
          </div>
        </div>
      )}
    </>
  );
}
