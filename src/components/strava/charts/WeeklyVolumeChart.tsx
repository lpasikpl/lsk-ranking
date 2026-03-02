"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import type { MonthlyYoy } from "@/lib/strava-types";

interface WeeklyVolumeChartProps {
  data: MonthlyYoy[];
}

const MONTH_NAMES_SHORT = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];
const CURRENT_YEAR = new Date().getFullYear();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      backgroundColor: "#1a1a2e",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: 10,
      padding: "10px 14px",
      fontSize: 12,
      color: "var(--text-primary)",
      boxShadow: "0 8px 24px rgba(0,0,0,0.6)",
      minWidth: 120,
    }}>
      <div style={{ color: "rgba(255,255,255,0.5)", marginBottom: 6, fontWeight: 500 }}>{d.label}</div>
      <div>
        <span style={{ color: "#f97316", fontWeight: 700, fontSize: 15 }}>{d.tss}</span>
        <span style={{ color: "rgba(255,255,255,0.5)", marginLeft: 4 }}>TSS</span>
      </div>
    </div>
  );
}

export function WeeklyVolumeChart({ data }: WeeklyVolumeChartProps) {
  const chartData = data
    .slice()
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
    .map((d) => ({
      label: MONTH_NAMES_SHORT[d.month - 1] + (d.year !== CURRENT_YEAR ? ` ${String(d.year).slice(2)}` : ""),
      tss: Math.round(d.total_tss),
    }));

  return (
    <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-6">
      <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-4">
        TSS miesięczny — od stycznia 2025
      </h2>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 18, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "var(--border)", opacity: 0.4 }} />
          <Bar dataKey="tss" radius={[4, 4, 0, 0]} fill="#f97316" opacity={0.85} maxBarSize={48}>
            <LabelList
              dataKey="tss"
              position="top"
              style={{ fill: "var(--text-muted)", fontSize: 11 }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(v: any) => (v > 0 ? v : "") as any}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
