"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import type { MonthlyNpHr } from "@/lib/strava-types";

interface MonthlyNpHrChartProps {
  data: MonthlyNpHr[];
}

const MONTH_NAMES_SHORT = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];
const CURRENT_YEAR = new Date().getFullYear();

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
      {d.ratio != null && (
        <div><span style={{ color: "#f97316", fontWeight: 600 }}>{d.ratio.toFixed(2)}</span> NP/HR</div>
      )}
      {d.np != null && <div style={{ color: "var(--text-muted)" }}>Śr. NP: {d.np} W</div>}
      {d.hr != null && <div style={{ color: "var(--text-muted)" }}>Śr. HR: {d.hr} bpm</div>}
    </div>
  );
}

export function MonthlyNpHrChart({ data }: MonthlyNpHrChartProps) {
  const chartData = data.map((d) => ({
    label: MONTH_NAMES_SHORT[d.month - 1] + (d.year !== CURRENT_YEAR ? ` ${String(d.year).slice(2)}` : ""),
    ratio: d.np_hr_ratio,
    np: d.avg_np,
    hr: d.avg_hr,
  }));

  const ratios = chartData.map((d) => d.ratio).filter((v): v is number => v != null);
  const avg = ratios.length > 0 ? ratios.reduce((s, v) => s + v, 0) / ratios.length : null;

  return (
    <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-medium text-[var(--text-secondary)]">
          NP/HR miesięczny — treningi &gt;1h
        </h2>
        {avg != null && (
          <span className="text-xs text-[var(--text-muted)]">
            Śr.: <span className="text-[var(--text-secondary)] font-medium">{avg.toFixed(2)}</span>
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
            domain={["auto", "auto"]}
            tickFormatter={(v) => v.toFixed(2)}
          />
          <Tooltip content={<CustomTooltip />} />
          {avg != null && (
            <ReferenceLine
              y={avg}
              stroke="rgba(255,255,255,0.2)"
              strokeDasharray="4 3"
            />
          )}
          <Line
            type="monotone"
            dataKey="ratio"
            stroke="#f97316"
            strokeWidth={2}
            dot={{ fill: "#f97316", r: 3 }}
            activeDot={{ r: 5 }}
            connectNulls={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
