"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine,
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
      backgroundColor: "rgba(10,10,10,0.95)",
      border: "1px solid rgba(16,185,129,0.2)",
      borderRadius: 10,
      padding: "10px 14px",
      fontSize: 12,
      color: "#fff",
      boxShadow: "0 8px 32px rgba(0,0,0,0.8)",
      minWidth: 150,
    }}>
      <div style={{ color: "rgba(255,255,255,0.45)", marginBottom: 6, fontWeight: 500 }}>{d.label}</div>
      <div style={{ marginBottom: 5 }}>
        <span style={{ color: "#10b981", fontWeight: 700, fontSize: 16 }}>{d.ratio.toFixed(2)}</span>
        <span style={{ color: "rgba(255,255,255,0.4)", marginLeft: 5 }}>NP/HR</span>
      </div>
      {d.np != null && (
        <div style={{ color: "rgba(255,255,255,0.5)", marginBottom: 2 }}>
          Śr. NP: <span style={{ color: "rgba(255,255,255,0.85)" }}>{d.np} W</span>
        </div>
      )}
      {d.hr != null && (
        <div style={{ color: "rgba(255,255,255,0.5)" }}>
          Śr. HR: <span style={{ color: "rgba(255,255,255,0.85)" }}>{d.hr} bpm</span>
        </div>
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
    <div style={{
      borderRadius: 16,
      background: "linear-gradient(145deg, #0a0a0a 0%, #111111 100%)",
      border: "1px solid rgba(255,255,255,0.06)",
      padding: "24px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.5)", margin: 0 }}>
          NP/HR miesięczny — treningi &gt;1h
        </h2>
        {avg != null && (
          <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>
            Śr.: <span style={{ color: "rgba(255,255,255,0.6)", fontWeight: 500 }}>{avg.toFixed(2)}</span>
          </span>
        )}
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <AreaChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="nphrGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity={0.35} />
              <stop offset="60%" stopColor="#10b981" stopOpacity={0.08} />
              <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="label"
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            width={36}
            domain={["auto", "auto"]}
            tickFormatter={(v) => v.toFixed(2)}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(16,185,129,0.3)", strokeWidth: 1 }} />
          {avg != null && (
            <ReferenceLine
              y={avg}
              stroke="rgba(16,185,129,0.25)"
              strokeDasharray="4 3"
            />
          )}
          <Area
            type="monotone"
            dataKey="ratio"
            stroke="#10b981"
            strokeWidth={2}
            fill="url(#nphrGrad)"
            dot={{ r: 3, fill: "#10b981", stroke: "#10b981", strokeWidth: 1 }}
            activeDot={{ r: 5, fill: "#10b981", stroke: "#fff", strokeWidth: 1.5 }}
            connectNulls
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
