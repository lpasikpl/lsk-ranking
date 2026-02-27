"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LabelList } from "recharts";
import type { WeeklySummary } from "@/lib/strava-types";

interface WeeklyVolumeChartProps {
  data: WeeklySummary[];
}

const MONTH_NAMES_SHORT = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];

function groupByMonth(weeks: WeeklySummary[]) {
  const map = new Map<string, { tss: number; year: number; month: number }>();
  for (const w of weeks) {
    const d = new Date(w.week_start);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const existing = map.get(key);
    if (existing) {
      existing.tss += w.total_tss;
    } else {
      map.set(key, { tss: w.total_tss, year: d.getFullYear(), month: d.getMonth() + 1 });
    }
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, v]) => ({
      key,
      tss: Math.round(v.tss),
      label: MONTH_NAMES_SHORT[v.month - 1] + (v.year !== new Date().getFullYear() ? ` ${String(v.year).slice(2)}` : ""),
    }));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      backgroundColor: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: 8,
      padding: "8px 12px",
      fontSize: 12,
      color: "var(--text-primary)",
    }}>
      <div style={{ color: "var(--text-muted)", marginBottom: 4 }}>{d.label}</div>
      <div><span style={{ color: "#f97316", fontWeight: 600 }}>{d.tss}</span> TSS</div>
    </div>
  );
}

export function WeeklyVolumeChart({ data }: WeeklyVolumeChartProps) {
  const chartData = groupByMonth(data);

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
