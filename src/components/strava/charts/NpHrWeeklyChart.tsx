"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import type { WeeklyNpHr } from "@/lib/strava-types";

interface NpHrWeeklyChartProps {
  data: WeeklyNpHr[];
}

const MONTH_NAMES_SHORT = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];

function formatWeekLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getDate()} ${MONTH_NAMES_SHORT[d.getMonth()]}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
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
      <div style={{ color: "rgba(255,255,255,0.45)", marginBottom: 6, fontWeight: 500 }}>{d.weekLabel}</div>
      <div style={{ marginBottom: 4 }}>
        <span style={{ color: "#FC5200", fontWeight: 700, fontSize: 15 }}>{d.np_hr_ratio?.toFixed(3)}</span>
        <span style={{ color: "rgba(255,255,255,0.4)", marginLeft: 4 }}>NP/HR</span>
      </div>
      {d.avg_np != null && (
        <div style={{ color: "rgba(255,255,255,0.5)", marginBottom: 2 }}>
          Śr. NP: <span style={{ color: "rgba(255,255,255,0.85)" }}>{Math.round(d.avg_np)} W</span>
        </div>
      )}
      {d.avg_hr != null && (
        <div style={{ color: "rgba(255,255,255,0.5)" }}>
          Śr. HR: <span style={{ color: "rgba(255,255,255,0.85)" }}>{Math.round(d.avg_hr)} bpm</span>
        </div>
      )}
    </div>
  );
}

export function NpHrWeeklyChart({ data }: NpHrWeeklyChartProps) {
  const chartData = data
    .slice()
    .sort((a, b) => a.week_start.localeCompare(b.week_start))
    .map((d) => ({ ...d, weekLabel: formatWeekLabel(d.week_start) }));

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

      <ResponsiveContainer width="100%" height={320}>
        <BarChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }} barCategoryGap="20%">
          <defs>
            <linearGradient id="weeklyNphrBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FC5200" stopOpacity={1} />
              <stop offset="100%" stopColor="#7a2800" stopOpacity={0.7} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="weekLabel"
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
            axisLine={false}
            tickLine={false}
            minTickGap={14}
            interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
            axisLine={false}
            tickLine={false}
            domain={["auto", "auto"]}
            tickFormatter={(v) => v.toFixed(2)}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Bar dataKey="np_hr_ratio" fill="url(#weeklyNphrBarGrad)" radius={[3, 3, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
