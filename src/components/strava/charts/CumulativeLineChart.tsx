"use client";

import { useState, useEffect } from "react";
import { Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from "recharts";
import type { CumulativeDay, CumulativeByYear } from "@/lib/strava-types";
import { CURRENT_YEAR } from "@/lib/strava-constants";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;

  const actual = payload.find((p: any) => p.dataKey === "actual")?.value as number | undefined;
  const plan = payload.find((p: any) => p.dataKey === "plan")?.value as number | undefined;
  const prev = payload.find((p: any) => p.dataKey === "prevYear")?.value as number | undefined;

  const diff = actual != null && plan != null ? actual - plan : null;
  const dateStr = new Date(CURRENT_YEAR, 0, Number(label)).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
  });
  const fmt = (v: number) => v.toLocaleString("pl-PL", { maximumFractionDigits: 1 });

  return (
    <div style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "var(--text-primary)" }}>
      <div style={{ marginBottom: 6, fontWeight: 500 }}>{dateStr}</div>
      {actual != null && <div style={{ color: "#f97316" }}>{CURRENT_YEAR} : {fmt(actual)} km</div>}
      {plan != null && <div style={{ color: "rgba(255,255,255,0.4)" }}>Plan : {fmt(plan)} km</div>}
      {diff != null && (
        <div style={{ color: diff >= 0 ? "#34d399" : "#f87171", fontWeight: 600, marginTop: 4, borderTop: "1px solid var(--border)", paddingTop: 4 }}>
          {diff >= 0 ? "+" : ""}{fmt(diff)} km
        </div>
      )}
      {prev != null && <div style={{ color: "#3b82f6", marginTop: 4 }}>{CURRENT_YEAR - 1} : {fmt(prev)} km</div>}
    </div>
  );
}

interface CumulativeLineChartProps {
  currentYear: CumulativeDay[];
  prevYear: CumulativeByYear[];
  goalKm?: number;
}

const DOY_TICKS = [1, 32, 60, 91, 121, 152, 182, 213, 244, 274, 305, 335];
const DAYS_IN_YEAR = 365;

function ChartContent({ data, showFullYear }: { data: ReturnType<typeof buildData>; showFullYear: boolean }) {
  const tickFormatter = (v: number) =>
    new Date(CURRENT_YEAR, 0, v).toLocaleDateString("pl-PL", { month: "short" });

  return (
    <ComposedChart data={data}>
      <defs>
        <linearGradient id="gradActual2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#f97316" stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
      <XAxis
        dataKey="doy"
        tick={{ fill: "var(--text-muted)", fontSize: 11 }}
        axisLine={{ stroke: "var(--border)" }}
        tickLine={false}
        tickFormatter={tickFormatter}
        ticks={showFullYear ? DOY_TICKS : undefined}
        type="number"
        domain={showFullYear ? [1, DAYS_IN_YEAR] : ["dataMin", "dataMax"]}
      />
      <YAxis
        tick={{ fill: "var(--text-muted)", fontSize: 11 }}
        axisLine={false}
        tickLine={false}
        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
      />
      <Tooltip content={<CustomTooltip />} />
      <Area type="monotone" dataKey="actual" stroke="#f97316" strokeWidth={2.5} fill="url(#gradActual2)" connectNulls={false} />
      <Line type="monotone" dataKey="plan" stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} strokeDasharray="6 4" dot={false} connectNulls={true} />
      <Line type="monotone" dataKey="prevYear" stroke="#3b82f6" strokeWidth={1.5} strokeOpacity={0.6} dot={false} connectNulls={false} />
    </ComposedChart>
  );
}

type DataPoint = { doy: number; actual: number | null; plan: number | null; prevYear: number | null };

function buildData(currentYear: CumulativeDay[], prevYear: CumulativeByYear[], showFullYear: boolean, goalKm?: number): DataPoint[] {
  const prevMap = new Map(prevYear.map((d) => [d.doy, d.cumulative_km]));
  const today = new Date();
  const todayDoy = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 86400000);
  const dailyPlanRate = goalKm ? goalKm / DAYS_IN_YEAR : null;
  const actualMap = new Map(currentYear.map((d) => [d.doy, d.actual_cumulative_km]));

  if (showFullYear) {
    return Array.from({ length: DAYS_IN_YEAR }, (_, i) => {
      const doy = i + 1;
      return {
        doy,
        actual: doy <= todayDoy ? (actualMap.get(doy) ?? null) : null,
        plan: dailyPlanRate ? dailyPlanRate * doy : null,
        prevYear: prevMap.get(doy) ?? null,
      };
    });
  }
  return currentYear.map((d) => ({
    doy: d.doy,
    actual: d.actual_cumulative_km,
    plan: d.plan_cumulative_km,
    prevYear: prevMap.get(d.doy) ?? null,
  }));
}

function Legend() {
  return (
    <div className="flex items-center gap-6 mt-3 text-xs text-[var(--text-muted)]">
      <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#f97316] rounded" /> {CURRENT_YEAR}</span>
      <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#3b82f6] rounded opacity-60" /> {CURRENT_YEAR - 1}</span>
      <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 border-t border-dashed border-[var(--text-muted)]" /> Plan</span>
    </div>
  );
}

export function CumulativeLineChart({ currentYear, prevYear, goalKm }: CumulativeLineChartProps) {
  const [showFullYear, setShowFullYear] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Zamknij na Escape
  useEffect(() => {
    if (!isFullscreen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setIsFullscreen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isFullscreen]);

  const data = buildData(currentYear, prevYear, showFullYear, goalKm);

  const header = (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-sm font-medium text-[var(--text-secondary)]">
        Kumulatywne kilometry — {CURRENT_YEAR}
      </h2>
      <button
        onClick={() => setShowFullYear((v) => !v)}
        className={`text-xs px-3 py-1 rounded-lg border transition-colors ${
          showFullYear
            ? "bg-orange-500/20 text-orange-400 border-orange-500/30"
            : "text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-secondary)]"
        }`}
      >
        Cały rok
      </button>
    </div>
  );

  // Ikonka expand (SVG)
  const expandIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );

  // Ikonka collapse (SVG)
  const collapseIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3v3a2 2 0 0 1-2 2H3" />
      <path d="M21 8h-3a2 2 0 0 1-2-2V3" />
      <path d="M3 16h3a2 2 0 0 1 2 2v3" />
      <path d="M16 21v-3a2 2 0 0 1 2-2h3" />
    </svg>
  );

  return (
    <>
      {/* Karta normalna */}
      <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-6 h-full relative">
        {header}
        <ResponsiveContainer width="100%" height={280}>
          <ChartContent data={data} showFullYear={showFullYear} />
        </ResponsiveContainer>
        <Legend />
        {/* Przycisk fullscreen — prawy dolny róg */}
        <button
          onClick={() => setIsFullscreen(true)}
          className="absolute bottom-4 right-4 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/5 transition-colors"
          title="Pełny ekran"
        >
          {expandIcon}
        </button>
      </div>

      {/* Overlay fullscreen */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsFullscreen(false); }}
        >
          <div
            className="rounded-2xl border border-[var(--border)] p-8 w-full max-w-6xl relative"
            style={{ backgroundColor: "var(--bg-card)" }}
          >
            {header}
            <ResponsiveContainer width="100%" height={520}>
              <ChartContent data={data} showFullYear={showFullYear} />
            </ResponsiveContainer>
            <Legend />
            {/* Przycisk zamknij */}
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute bottom-6 right-6 p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-secondary)] hover:bg-white/5 transition-colors"
              title="Zamknij"
            >
              {collapseIcon}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
