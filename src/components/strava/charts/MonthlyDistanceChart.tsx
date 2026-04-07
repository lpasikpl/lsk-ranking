"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import type { MonthlyYoy, WeeklySummary } from "@/lib/strava-types";

interface MonthlyDistanceChartProps {
  data: MonthlyYoy[];
  weeklyData: WeeklySummary[];
}

const MONTH_NAMES_SHORT = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];
const CURRENT_YEAR = new Date().getFullYear();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function KmTooltip({ active, payload, label, keyName }: any) {
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
      minWidth: 130,
    }}>
      <div style={{ color: "rgba(255,255,255,0.45)", marginBottom: 8, fontWeight: 500 }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ marginBottom: 3 }}>
          <span style={{ color: p.dataKey === keyName ? "#FC5200" : "rgba(255,255,255,0.4)", fontWeight: 600, fontSize: 14 }}>
            {p.value != null ? p.value.toLocaleString("pl-PL", { maximumFractionDigits: 0 }) : "—"}
          </span>
          <span style={{ color: "rgba(255,255,255,0.35)", marginLeft: 5 }}>km {p.name}</span>
        </div>
      ))}
    </div>
  );
}

const legend = (
  <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ display: "inline-block", width: 12, height: 10, backgroundColor: "#FC5200", borderRadius: 2 }} />
      {CURRENT_YEAR}
    </span>
    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ display: "inline-block", width: 12, height: 10, backgroundColor: "#555555", borderRadius: 2 }} />
      {CURRENT_YEAR - 1}
    </span>
  </div>
);

const cardStyle = {
  borderRadius: 16,
  background: "linear-gradient(145deg, #0a0a0a 0%, #111111 100%)",
  border: "1px solid rgba(255,255,255,0.06)",
  padding: "24px",
};

export function MonthlyDistanceChart({ data, weeklyData }: MonthlyDistanceChartProps) {
  const map2025 = new Map(
    data.filter((d) => d.year === CURRENT_YEAR - 1).map((d) => [d.month, Math.round(d.distance_km)])
  );
  const map2026 = new Map(
    data.filter((d) => d.year === CURRENT_YEAR).map((d) => [d.month, Math.round(d.distance_km)])
  );
  const monthlyChartData = Array.from({ length: 12 }, (_, i) => i + 1).map((m) => ({
    label: MONTH_NAMES_SHORT[m - 1],
    km2025: map2025.get(m) ?? null,
    km2026: map2026.get(m) ?? null,
  }));

  const wMap2025 = new Map(
    weeklyData.filter((d) => d.iso_year === CURRENT_YEAR - 1).map((d) => [d.iso_week, Math.round(d.distance_km)])
  );
  const wMap2026 = new Map(
    weeklyData.filter((d) => d.iso_year === CURRENT_YEAR).map((d) => [d.iso_week, Math.round(d.distance_km)])
  );
  const allWeeks = new Set([...wMap2025.keys(), ...wMap2026.keys()]);
  const weeklyChartData = [...allWeeks].sort((a, b) => a - b).map((w) => ({
    label: `${w}`,
    km2025: wMap2025.get(w) ?? null,
    km2026: wMap2026.get(w) ?? null,
  }));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Miesięczne km */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.5)", margin: "0 0 20px 0" }}>
          Kilometry miesięcznie — {CURRENT_YEAR} vs {CURRENT_YEAR - 1}
        </h2>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={monthlyChartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }} barCategoryGap="25%" barGap={2}>
            <defs>
              <linearGradient id="distBar2026" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FC5200" stopOpacity={1} />
                <stop offset="100%" stopColor="#7a2800" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="distBar2025" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#555555" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#222222" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
            <Tooltip content={<KmTooltip keyName="km2026" />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar dataKey="km2025" name={String(CURRENT_YEAR - 1)} fill="url(#distBar2025)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="km2026" name={String(CURRENT_YEAR)} fill="url(#distBar2026)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        {legend}
      </div>

      {/* Tygodniowe km */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.5)", margin: "0 0 20px 0" }}>
          Kilometry tygodniowo — {CURRENT_YEAR} vs {CURRENT_YEAR - 1}
        </h2>
        <ResponsiveContainer width="100%" height={320}>
          <BarChart data={weeklyChartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }} barCategoryGap="15%" barGap={1}>
            <defs>
              <linearGradient id="distWeekBar2026" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FC5200" stopOpacity={1} />
                <stop offset="100%" stopColor="#7a2800" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="distWeekBar2025" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#555555" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#222222" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              minTickGap={14}
              interval="preserveStartEnd"
            />
            <YAxis tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
            <Tooltip content={<KmTooltip keyName="km2026" />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar dataKey="km2025" name={String(CURRENT_YEAR - 1)} fill="url(#distWeekBar2025)" radius={[2, 2, 0, 0]} />
            <Bar dataKey="km2026" name={String(CURRENT_YEAR)} fill="url(#distWeekBar2026)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        {legend}
      </div>
    </div>
  );
}
