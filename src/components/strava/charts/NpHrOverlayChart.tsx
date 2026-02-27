"use client";

import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import type { NpHrByYear } from "@/lib/strava-types";
import { CURRENT_YEAR } from "@/lib/strava-constants";

interface NpHrOverlayChartProps {
  currentYear: NpHrByYear[];
  prevYear: NpHrByYear[];
}

export function NpHrOverlayChart({ currentYear, prevYear }: NpHrOverlayChartProps) {
  const allWeeks = new Set([
    ...currentYear.map((d) => d.iso_week),
    ...prevYear.map((d) => d.iso_week),
  ]);
  const currMap = new Map(currentYear.map((d) => [d.iso_week, d.np_hr_ratio]));
  const prevMap = new Map(prevYear.map((d) => [d.iso_week, d.np_hr_ratio]));

  const data = [...allWeeks].sort((a, b) => a - b).map((week) => ({
    week,
    current: currMap.get(week) ?? null,
    prev: prevMap.get(week) ?? null,
  }));

  return (
    <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-6">
      <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-4">
        NP/HR — {CURRENT_YEAR} vs {CURRENT_YEAR - 1}
      </h2>
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            axisLine={{ stroke: "var(--border)" }}
            tickLine={false}
            tickFormatter={(w) => `T${w}`}
          />
          <YAxis
            tick={{ fill: "var(--text-muted)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            domain={["auto", "auto"]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "var(--bg-card)",
              border: "1px solid var(--border)",
              borderRadius: "8px",
              color: "var(--text-primary)",
              fontSize: 12,
            }}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={((value: any, name: any) => [
              value?.toFixed(3) ?? "—",
              name === "current" ? String(CURRENT_YEAR) : String(CURRENT_YEAR - 1),
            ]) as any}
          />
          <Line
            type="monotone"
            dataKey="current"
            stroke="#f97316"
            strokeWidth={2.5}
            dot={{ r: 3, fill: "#f97316" }}
            connectNulls
            name="current"
          />
          <Line
            type="monotone"
            dataKey="prev"
            stroke="#3b82f6"
            strokeWidth={1.5}
            strokeOpacity={0.6}
            dot={false}
            connectNulls
            name="prev"
          />
        </LineChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-6 mt-3 text-xs text-[var(--text-muted)]">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-[#f97316] rounded" /> {CURRENT_YEAR}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-0.5 bg-[#3b82f6] rounded opacity-60" /> {CURRENT_YEAR - 1}
        </span>
      </div>
    </div>
  );
}
