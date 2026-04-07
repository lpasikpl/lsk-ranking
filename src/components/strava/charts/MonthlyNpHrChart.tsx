"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import type { MonthlyNpHr } from "@/lib/strava-types";

interface MonthlyNpHrChartProps {
  data: MonthlyNpHr[];
}

const MONTH_NAMES_SHORT = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];
const CURRENT_YEAR = new Date().getFullYear();

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
      {payload.map((p: any) => p.value != null && (
        <div key={p.dataKey} style={{ marginBottom: 3 }}>
          <span style={{ color: p.dataKey === "ratio2026" ? "#FC5200" : "rgba(255,255,255,0.4)", fontWeight: 600, fontSize: 14 }}>
            {p.value.toFixed(2)}
          </span>
          <span style={{ color: "rgba(255,255,255,0.35)", marginLeft: 5 }}>NP/HR {p.name}</span>
        </div>
      ))}
    </div>
  );
}

export function MonthlyNpHrChart({ data }: MonthlyNpHrChartProps) {
  const map2025 = new Map(
    data.filter((d) => d.year === CURRENT_YEAR - 1).map((d) => [d.month, d.np_hr_ratio])
  );
  const map2026 = new Map(
    data.filter((d) => d.year === CURRENT_YEAR).map((d) => [d.month, d.np_hr_ratio])
  );
  const allMonths = Array.from({ length: 12 }, (_, i) => i + 1);
  const chartData = allMonths.map((m) => ({
    label: MONTH_NAMES_SHORT[m - 1],
    ratio2025: map2025.get(m) ?? null,
    ratio2026: map2026.get(m) ?? null,
  }));

  const allRatios = data.map((d) => d.np_hr_ratio).filter((v): v is number => v != null);
  const avg = allRatios.length > 0 ? allRatios.reduce((s, v) => s + v, 0) / allRatios.length : null;

  return (
    <div style={{
      borderRadius: 16,
      background: "linear-gradient(145deg, #0a0a0a 0%, #111111 100%)",
      border: "1px solid rgba(255,255,255,0.06)",
      padding: "24px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.5)", margin: 0 }}>
          NP/HR miesięczny — {CURRENT_YEAR} vs {CURRENT_YEAR - 1}
        </h2>
        {avg != null && (
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
            Śr.: <span style={{ color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>{avg.toFixed(2)}</span>
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }} barCategoryGap="25%" barGap={2}>
          <defs>
            <linearGradient id="nphrBar2026" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FC5200" stopOpacity={1} />
              <stop offset="100%" stopColor="#7a2800" stopOpacity={0.7} />
            </linearGradient>
            <linearGradient id="nphrBar2025" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#555555" stopOpacity={0.8} />
              <stop offset="100%" stopColor="#222222" stopOpacity={0.6} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={36}
            domain={[1, "auto"]}
            tickFormatter={(v) => v.toFixed(2)}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          {avg != null && (
            <ReferenceLine y={avg} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 3" />
          )}
          <Bar dataKey="ratio2025" name={String(CURRENT_YEAR - 1)} fill="url(#nphrBar2025)" radius={[3, 3, 0, 0]} />
          <Bar dataKey="ratio2026" name={String(CURRENT_YEAR)} fill="url(#nphrBar2026)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
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
    </div>
  );
}
