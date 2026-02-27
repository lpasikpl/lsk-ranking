"use client";

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid,
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
    <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-6">
      <div className="flex items-start justify-between mb-4">
        <h2 className="text-sm font-medium text-[var(--text-secondary)]">
          NP/HR — tygodniowy (treningi &gt;1h z mocą)
        </h2>
        <div className="flex gap-4 text-xs">
          <div>
            <span className="text-[var(--text-muted)]">Śr. 4tyg: </span>
            <span className="font-medium text-[var(--accent-orange)]">{avg4w.toFixed(3)}</span>
          </div>
          <div>
            <span className="text-[var(--text-muted)]">Max: </span>
            <span className="font-medium text-emerald-400">{maxRatio.toFixed(3)}</span>
          </div>
          <div>
            <span className="text-[var(--text-muted)]">Min: </span>
            <span className="font-medium text-red-400">{minRatio.toFixed(3)}</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={250}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="iso_week"
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
            tickFormatter={(w) => `T${w}`}
          />
          <YAxis
            yAxisId="ratio"
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            domain={["auto", "auto"]}
          />
          <YAxis
            yAxisId="rides"
            orientation="right"
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--text-primary)",
              fontSize: 12,
            }}
          />
          <Bar yAxisId="rides" dataKey="qualifying_rides" fill="var(--border)" opacity={0.5} name="Jazdy" />
          <Line
            yAxisId="ratio"
            type="monotone"
            dataKey="np_hr_ratio"
            stroke="#f97316"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#f97316" }}
            name="NP/HR"
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
