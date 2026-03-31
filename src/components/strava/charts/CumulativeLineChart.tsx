"use client";

import { useState, useEffect, useCallback } from "react";
import { Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Line, ComposedChart } from "recharts";
import type { CumulativeDay, CumulativeByYear } from "@/lib/strava-types";
import { CURRENT_YEAR } from "@/lib/strava-constants";

const fmt = (v: number) => v.toLocaleString("pl-PL", { maximumFractionDigits: 1 });

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label, currentActualKm }: any) {
  if (!active || !payload?.length) return null;

  const actual = payload.find((p: any) => p.dataKey === "actual")?.value as number | undefined;
  const plan = payload.find((p: any) => p.dataKey === "plan")?.value as number | undefined;
  const prev = payload.find((p: any) => p.dataKey === "prevYear")?.value as number | undefined;

  const isFuture = actual == null || actual === undefined;
  // Na przyszłych datach używamy aktualnych km (dziś) do porównania z 2025
  const km2026 = isFuture ? (currentActualKm ?? null) : actual;

  const diffVsPlan = km2026 != null && plan != null ? km2026 - plan : null;
  const diffVs2025 = km2026 != null && prev != null ? km2026 - prev : null;

  const dateStr = new Date(CURRENT_YEAR, 0, Number(label)).toLocaleDateString("pl-PL", {
    day: "numeric",
    month: "long",
  });

  const DiffBadge = ({ val }: { val: number }) => (
    <div style={{
      display: "inline-block",
      color: val >= 0 ? "#34d399" : "#f87171",
      fontWeight: 700,
      fontSize: 13,
      marginTop: 4,
    }}>
      {val >= 0 ? "+" : ""}{fmt(val)} km
    </div>
  );

  return (
    <div style={{
      backgroundColor: "#0f1117",
      border: "1px solid rgba(255,255,255,0.15)",
      borderRadius: 12,
      padding: "12px 16px",
      fontSize: 12,
      boxShadow: "0 8px 32px rgba(0,0,0,0.85)",
      minWidth: 190,
      pointerEvents: "none",
    }}>
      {/* Nagłówek — data */}
      <div style={{ marginBottom: 10, fontWeight: 700, fontSize: 13, color: "rgba(255,255,255,0.95)" }}>
        {dateStr}
      </div>

      {/* Sekcja 1: vs Plan */}
      <div style={{ marginBottom: 10 }}>
        <div style={{
          color: "rgba(255,255,255,0.35)",
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 5,
          fontWeight: 600,
        }}>
          vs Plan
        </div>
        {!isFuture && km2026 != null && (
          <div style={{ color: "#f97316", marginBottom: 2 }}>
            {CURRENT_YEAR} : {fmt(km2026)} km
          </div>
        )}
        {plan != null && (
          <div style={{ color: "rgba(255,255,255,0.5)", marginBottom: 2 }}>
            Plan : {fmt(plan)} km
          </div>
        )}
        {diffVsPlan != null ? (
          <DiffBadge val={diffVsPlan} />
        ) : (
          plan != null && isFuture && (
            <div style={{ color: "rgba(255,255,255,0.25)", fontSize: 11, marginTop: 2 }}>brak danych 2026</div>
          )
        )}
      </div>

      {/* Separator */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", marginBottom: 10 }} />

      {/* Sekcja 2: vs 2025 */}
      <div>
        <div style={{
          color: "rgba(255,255,255,0.35)",
          fontSize: 10,
          textTransform: "uppercase",
          letterSpacing: "0.08em",
          marginBottom: 5,
          fontWeight: 600,
        }}>
          vs {CURRENT_YEAR - 1}
        </div>
        {km2026 != null && (
          <div style={{ color: "#f97316", marginBottom: 2 }}>
            {isFuture ? `${CURRENT_YEAR} teraz` : CURRENT_YEAR} : {fmt(km2026)} km
          </div>
        )}
        {prev != null && (
          <div style={{ color: "#3b82f6", marginBottom: 2 }}>
            {CURRENT_YEAR - 1} : {fmt(prev)} km
          </div>
        )}
        {diffVs2025 != null && <DiffBadge val={diffVs2025} />}
      </div>
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

function ChartContent({ data, showFullYear, currentActualKm }: { data: DataPoint[]; showFullYear: boolean; currentActualKm: number | null }) {
  const tickFormatter = (v: number) =>
    new Date(CURRENT_YEAR, 0, v).toLocaleDateString("pl-PL", { month: "short" });

  const tooltipContent = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (props: any) => <CustomTooltip {...props} currentActualKm={currentActualKm} />,
    [currentActualKm]
  );

  return (
    <ComposedChart data={data}>
      <defs>
        <linearGradient id="gradActual2" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#f97316" stopOpacity={0.3} />
          <stop offset="100%" stopColor="#f97316" stopOpacity={0.02} />
        </linearGradient>
      </defs>
      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.07)" vertical={false} />
      <XAxis
        dataKey="doy"
        tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }}
        axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
        tickLine={false}
        tickFormatter={tickFormatter}
        ticks={showFullYear ? DOY_TICKS : undefined}
        type="number"
        domain={showFullYear ? [1, DAYS_IN_YEAR] : ["dataMin", "dataMax"]}
      />
      <YAxis
        tick={{ fill: "rgba(255,255,255,0.35)", fontSize: 11 }}
        axisLine={false}
        tickLine={false}
        tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
      />
      <Tooltip content={tooltipContent} />
      <Area type="monotone" dataKey="actual" stroke="#f97316" strokeWidth={2.5} fill="url(#gradActual2)" connectNulls={false} />
      <Line type="monotone" dataKey="plan" stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} strokeDasharray="6 4" dot={false} connectNulls={true} />
      <Line type="monotone" dataKey="prevYear" stroke="#3b82f6" strokeWidth={1.5} strokeOpacity={0.6} dot={false} connectNulls={false} />
    </ComposedChart>
  );
}

function Legend() {
  return (
    <div className="flex items-center gap-6 mt-3 text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
      <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#f97316] rounded" /> {CURRENT_YEAR}</span>
      <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-[#3b82f6] rounded opacity-60" /> {CURRENT_YEAR - 1}</span>
      <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 border-t border-dashed" style={{ borderColor: "rgba(255,255,255,0.35)" }} /> Plan</span>
    </div>
  );
}

export function CumulativeLineChart({ currentYear, prevYear, goalKm }: CumulativeLineChartProps) {
  const [showFullYear, setShowFullYear] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Ostatnia znana wartość km 2026 (do porównania na przyszłych datach)
  const currentActualKm = currentYear.length > 0
    ? currentYear[currentYear.length - 1].actual_cumulative_km
    : null;

  useEffect(() => {
    if (!isFullscreen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setIsFullscreen(false); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isFullscreen]);

  const data = buildData(currentYear, prevYear, showFullYear, goalKm);

  const header = (
    <div className="flex items-center justify-between mb-4">
      <h2 style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.8)" }}>
        Realizacja {CURRENT_YEAR} vs. {CURRENT_YEAR - 1}
      </h2>
      <button
        onClick={() => setShowFullYear((v) => !v)}
        style={showFullYear
          ? { fontSize: 12, padding: "3px 12px", borderRadius: 8, border: "1px solid rgba(249,115,22,0.35)", background: "rgba(249,115,22,0.15)", color: "#fb923c", transition: "all 0.2s" }
          : { fontSize: 12, padding: "3px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.12)", background: "transparent", color: "rgba(255,255,255,0.45)", transition: "all 0.2s" }
        }
      >
        Cały rok
      </button>
    </div>
  );

  const expandIcon = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8 3H5a2 2 0 0 0-2 2v3" />
      <path d="M21 8V5a2 2 0 0 0-2-2h-3" />
      <path d="M3 16v3a2 2 0 0 0 2 2h3" />
      <path d="M16 21h3a2 2 0 0 0 2-2v-3" />
    </svg>
  );

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
      <div
        className="h-full relative"
        style={{
          borderRadius: 16,
          background: "linear-gradient(145deg, #0a0a0a 0%, #111111 100%)",
          border: "1px solid rgba(255,255,255,0.07)",
          padding: "24px",
        }}
      >
        {header}
        <ResponsiveContainer width="100%" height={380}>
          <ChartContent data={data} showFullYear={showFullYear} currentActualKm={currentActualKm} />
        </ResponsiveContainer>
        <Legend />
        <button
          onClick={() => setIsFullscreen(true)}
          className="absolute bottom-4 right-4 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
          style={{ color: "rgba(255,255,255,0.35)" }}
          title="Pełny ekran"
        >
          {expandIcon}
        </button>
      </div>

      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-6"
          style={{ backgroundColor: "rgba(0,0,0,0.85)", backdropFilter: "blur(4px)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setIsFullscreen(false); }}
        >
          <div
            className="rounded-2xl p-8 w-full max-w-6xl relative"
            style={{
              background: "linear-gradient(145deg, #0a0a0a 0%, #111111 100%)",
              border: "1px solid rgba(255,255,255,0.07)",
            }}
          >
            {header}
            <ResponsiveContainer width="100%" height={520}>
              <ChartContent data={data} showFullYear={showFullYear} currentActualKm={currentActualKm} />
            </ResponsiveContainer>
            <Legend />
            <button
              onClick={() => setIsFullscreen(false)}
              className="absolute bottom-6 right-6 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              style={{ color: "rgba(255,255,255,0.35)" }}
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
