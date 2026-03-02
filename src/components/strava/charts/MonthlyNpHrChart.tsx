"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, LabelList, Cell,
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
  if (d.ratio == null) return null;
  return (
    <div style={{
      backgroundColor: "var(--bg-card)",
      border: "1px solid var(--border)",
      borderRadius: 10,
      padding: "10px 14px",
      fontSize: 12,
      color: "var(--text-primary)",
      boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
      minWidth: 140,
    }}>
      <div style={{ color: "var(--text-muted)", marginBottom: 6, fontWeight: 500 }}>{d.label}</div>
      <div style={{ marginBottom: 4 }}>
        <span style={{ color: "#f97316", fontWeight: 700, fontSize: 15 }}>{d.ratio.toFixed(2)}</span>
        <span style={{ color: "var(--text-muted)", marginLeft: 4 }}>NP/HR</span>
      </div>
      {d.np != null && (
        <div style={{ color: "var(--text-muted)" }}>Śr. NP: <span style={{ color: "var(--text-secondary)" }}>{d.np} W</span></div>
      )}
      {d.hr != null && (
        <div style={{ color: "var(--text-muted)" }}>Śr. HR: <span style={{ color: "var(--text-secondary)" }}>{d.hr} bpm</span></div>
      )}
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
        <BarChart data={chartData} margin={{ top: 24, right: 8, left: 0, bottom: 0 }}>
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
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          {avg != null && (
            <ReferenceLine
              y={avg}
              stroke="rgba(255,255,255,0.2)"
              strokeDasharray="4 3"
            />
          )}
          <Bar dataKey="ratio" radius={[4, 4, 0, 0]} maxBarSize={48}>
            {chartData.map((d, i) => (
              <Cell
                key={i}
                fill={avg != null && d.ratio != null && d.ratio >= avg ? "#f97316" : "#f9731699"}
              />
            ))}
            <LabelList
              dataKey="ratio"
              position="top"
              style={{ fill: "var(--text-muted)", fontSize: 11 }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={(v: any) => (v != null ? (v as number).toFixed(2) : "") as any}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
