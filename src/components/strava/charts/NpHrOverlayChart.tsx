"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { NpHrByYear } from "@/lib/strava-types";
import { CURRENT_YEAR } from "@/lib/strava-constants";

interface NpHrOverlayChartProps {
  currentYear: NpHrByYear[];
  prevYear: NpHrByYear[];
}

const MONTH_NAMES_SHORT = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];

function formatWeekLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()} ${MONTH_NAMES_SHORT[d.getMonth()]}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      backgroundColor: "#0f1117",
      border: "1px solid rgba(255,255,255,0.15)",
      borderRadius: 10,
      padding: "10px 14px",
      fontSize: 12,
      color: "#fff",
      boxShadow: "0 8px 32px rgba(0,0,0,0.8)",
      minWidth: 140,
    }}>
      <div style={{ color: "rgba(255,255,255,0.45)", marginBottom: 8, fontWeight: 500 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ marginBottom: 3 }}>
          <span style={{ color: p.fill === "url(#overlayPrevGrad)" ? "rgba(255,255,255,0.4)" : "#FC5200", fontWeight: 600 }}>
            {p.value != null ? p.value.toFixed(3) : "—"}
          </span>
          <span style={{ color: "rgba(255,255,255,0.35)", marginLeft: 5 }}>
            {p.name}
          </span>
        </div>
      ))}
    </div>
  );
}

export function NpHrOverlayChart({ currentYear, prevYear }: NpHrOverlayChartProps) {
  const allWeeks = new Set([
    ...currentYear.map((d) => d.iso_week),
    ...prevYear.map((d) => d.iso_week),
  ]);
  const currMap = new Map(currentYear.map((d) => [d.iso_week, { ratio: d.np_hr_ratio, week_start: d.week_start }]));
  const prevMap = new Map(prevYear.map((d) => [d.iso_week, { ratio: d.np_hr_ratio, week_start: d.week_start }]));

  const data = [...allWeeks].sort((a, b) => a - b).map((week) => {
    const ws = currMap.get(week)?.week_start ?? prevMap.get(week)?.week_start;
    return {
      week,
      weekLabel: ws ? formatWeekLabel(ws) : `T${week}`,
      current: currMap.get(week)?.ratio ?? null,
      prev: prevMap.get(week)?.ratio ?? null,
    };
  });

  return (
    <div style={{
      borderRadius: 16,
      background: "linear-gradient(145deg, #0a0a0a 0%, #111111 100%)",
      border: "1px solid rgba(255,255,255,0.06)",
      padding: "24px",
    }}>
      <h2 style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.5)", margin: "0 0 20px 0" }}>
        NP/HR — {CURRENT_YEAR} vs {CURRENT_YEAR - 1}
      </h2>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }} barCategoryGap="15%" barGap={1}>
          <defs>
            <linearGradient id="overlayCurrentGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FC5200" stopOpacity={1} />
              <stop offset="100%" stopColor="#7a2800" stopOpacity={0.7} />
            </linearGradient>
            <linearGradient id="overlayPrevGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#555555" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#222222" stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="weekLabel"
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            minTickGap={14}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            domain={["auto", "auto"]}
            tickFormatter={(v) => v.toFixed(2)}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Bar dataKey="prev" name={String(CURRENT_YEAR - 1)} fill="url(#overlayPrevGrad)" radius={[2, 2, 0, 0]} />
          <Bar dataKey="current" name={String(CURRENT_YEAR)} fill="url(#overlayCurrentGrad)" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ display: "inline-block", width: 12, height: 10, background: "url(#overlayCurrentGrad)", backgroundColor: "#FC5200", borderRadius: 2 }} />
          {CURRENT_YEAR}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ display: "inline-block", width: 12, height: 10, backgroundColor: "#555555", borderRadius: 2 }} />
          {CURRENT_YEAR - 1}
        </span>
      </div>
    </div>
  );
}
