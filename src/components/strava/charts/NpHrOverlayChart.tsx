"use client";

import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
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
    <div style={{
      borderRadius: 16,
      background: "linear-gradient(145deg, #0a0a0a 0%, #111111 100%)",
      border: "1px solid rgba(255,255,255,0.06)",
      padding: "24px",
    }}>
      <h2 style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.5)", marginBottom: 20, margin: "0 0 20px 0" }}>
        NP/HR — {CURRENT_YEAR} vs {CURRENT_YEAR - 1}
      </h2>
      <ResponsiveContainer width="100%" height={250}>
        <AreaChart data={data} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="currYearGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FC5200" stopOpacity={0.3} />
              <stop offset="100%" stopColor="#FC5200" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="prevYearGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6b7280" stopOpacity={0.15} />
              <stop offset="100%" stopColor="#6b7280" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="week"
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            tickFormatter={(w) => `T${w}`}
            minTickGap={28}
            interval="preserveStartEnd"
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
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            formatter={((value: any, name: any) => [
              value?.toFixed(3) ?? "—",
              name === "current" ? String(CURRENT_YEAR) : String(CURRENT_YEAR - 1),
            ]) as any}
          />
          {/* Poprzedni rok — szara linia za bieżącym */}
          <Area
            type="monotone"
            dataKey="prev"
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={1.5}
            fill="url(#prevYearGrad)"
            dot={false}
            connectNulls
            name="prev"
          />
          {/* Bieżący rok — zielona linia na wierzchu */}
          <Area
            type="monotone"
            dataKey="current"
            stroke="#FC5200"
            strokeWidth={2}
            fill="url(#currYearGrad)"
            dot={{ r: 1.5, fill: "#FC5200", stroke: "#FC5200", strokeWidth: 1 }}
            activeDot={{ r: 3, fill: "#FC5200", stroke: "#fff", strokeWidth: 1.5 }}
            connectNulls
            name="current"
          />
        </AreaChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ display: "inline-block", width: 12, height: 2, background: "#FC5200", borderRadius: 1 }} />
          {CURRENT_YEAR}
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ display: "inline-block", width: 12, height: 2, background: "rgba(255,255,255,0.2)", borderRadius: 1 }} />
          {CURRENT_YEAR - 1}
        </span>
      </div>
    </div>
  );
}
