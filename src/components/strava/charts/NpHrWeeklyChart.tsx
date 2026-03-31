"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import type { WeeklyNpHr } from "@/lib/strava-types";

interface NpHrWeeklyChartProps {
  data: WeeklyNpHr[];
}

export function NpHrWeeklyChart({ data }: NpHrWeeklyChartProps) {
  const last4 = data.slice(-4);
  const avg4w = last4.length > 0
    ? last4.reduce((a, b) => a + b.np_hr_ratio, 0) / last4.length
    : 0;
  const maxRatio = data.length > 0 ? Math.max(...data.map((d) => d.np_hr_ratio)) : 0;
  const minRatio = data.length > 0 ? Math.min(...data.map((d) => d.np_hr_ratio)) : 0;

  return (
    <div style={{
      borderRadius: 16,
      background: "linear-gradient(145deg, #0a0a0a 0%, #111111 100%)",
      border: "1px solid rgba(255,255,255,0.06)",
      padding: "24px",
    }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.5)", margin: 0 }}>
          NP/HR — tygodniowy (treningi &gt;1h z mocą)
        </h2>
        <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
          <div>
            <span style={{ color: "rgba(255,255,255,0.3)" }}>Śr. 4tyg: </span>
            <span style={{ fontWeight: 600, color: "#FC5200" }}>{avg4w.toFixed(3)}</span>
          </div>
          <div>
            <span style={{ color: "rgba(255,255,255,0.3)" }}>Max: </span>
            <span style={{ fontWeight: 600, color: "#FC5200" }}>{maxRatio.toFixed(3)}</span>
          </div>
          <div>
            <span style={{ color: "rgba(255,255,255,0.3)" }}>Min: </span>
            <span style={{ fontWeight: 600, color: "rgba(255,255,255,0.4)" }}>{minRatio.toFixed(3)}</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="weeklyNphrGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FC5200" stopOpacity={0.3} />
              <stop offset="70%" stopColor="#FC5200" stopOpacity={0.05} />
              <stop offset="100%" stopColor="#FC5200" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="iso_week"
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(w) => `T${w}`}
          />
          <YAxis
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(10,10,10,0.95)",
              border: "1px solid rgba(16,185,129,0.2)",
              borderRadius: 8,
              color: "#fff",
              fontSize: 12,
            }}
            cursor={{ stroke: "rgba(16,185,129,0.3)", strokeWidth: 1 }}
          />
          <Area
            type="monotone"
            dataKey="np_hr_ratio"
            stroke="#FC5200"
            strokeWidth={2}
            fill="url(#weeklyNphrGrad)"
            dot={{ r: 1.5, fill: "#FC5200", stroke: "#FC5200", strokeWidth: 1 }}
            activeDot={{ r: 3, fill: "#FC5200", stroke: "#fff", strokeWidth: 1.5 }}
            name="NP/HR"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
