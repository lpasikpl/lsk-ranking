"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { MonthlyYoy, WeeklySummary } from "@/lib/strava-types";

interface WeeklyVolumeChartProps {
  data: MonthlyYoy[];
  weeklyData: WeeklySummary[];
}

const MONTH_NAMES_SHORT = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];
const CURRENT_YEAR = new Date().getFullYear();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MonthlyTooltip({ active, payload }: any) {
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
      minWidth: 120,
    }}>
      <div style={{ color: "rgba(255,255,255,0.45)", marginBottom: 6, fontWeight: 500 }}>{d.label}</div>
      <div>
        <span style={{ color: "#FC5200", fontWeight: 700, fontSize: 15 }}>{d.tss}</span>
        <span style={{ color: "rgba(255,255,255,0.4)", marginLeft: 4 }}>TSS</span>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function WeeklyTooltip({ active, payload }: any) {
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
      minWidth: 130,
    }}>
      <div style={{ color: "rgba(255,255,255,0.45)", marginBottom: 6, fontWeight: 500 }}>{d.label}</div>
      <div>
        <span style={{ color: "#FC5200", fontWeight: 700, fontSize: 15 }}>{d.tss}</span>
        <span style={{ color: "rgba(255,255,255,0.4)", marginLeft: 4 }}>TSS</span>
      </div>
    </div>
  );
}

function formatMondayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getDate();
  const month = MONTH_NAMES_SHORT[d.getMonth()];
  return `${day} ${month}`;
}

export function WeeklyVolumeChart({ data, weeklyData }: WeeklyVolumeChartProps) {
  const chartData = data
    .slice()
    .sort((a, b) => a.year !== b.year ? a.year - b.year : a.month - b.month)
    .map((d) => ({
      label: MONTH_NAMES_SHORT[d.month - 1] + (d.year !== CURRENT_YEAR ? ` ${String(d.year).slice(2)}` : ""),
      tss: Math.round(d.total_tss),
    }));

  const weeklyChartData = weeklyData
    .slice()
    .sort((a, b) => a.week_start.localeCompare(b.week_start))
    .map((d) => ({
      label: formatMondayLabel(d.week_start),
      tss: Math.round(d.total_tss),
    }));

  const cardStyle = {
    borderRadius: 16,
    background: "linear-gradient(145deg, #0a0a0a 0%, #111111 100%)",
    border: "1px solid rgba(255,255,255,0.06)",
    padding: "24px",
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Miesięczny TSS */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.5)", margin: "0 0 20px 0" }}>
          TSS miesięczny — od stycznia 2025
        </h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }} barCategoryGap="30%">
            <defs>
              <linearGradient id="tssBarGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FC5200" stopOpacity={1} />
                <stop offset="100%" stopColor="#7a2800" stopOpacity={0.7} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              minTickGap={36}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip content={<MonthlyTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar dataKey="tss" fill="url(#tssBarGrad)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tygodniowy TSS */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.5)", margin: "0 0 20px 0" }}>
          TSS tygodniowy — od stycznia 2025
        </h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={weeklyChartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }} barCategoryGap="20%">
            <defs>
              <linearGradient id="tssBarGradWeekly" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FC5200" stopOpacity={1} />
                <stop offset="100%" stopColor="#7a2800" stopOpacity={0.7} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis
              dataKey="label"
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              minTickGap={14}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              width={36}
            />
            <Tooltip content={<WeeklyTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar dataKey="tss" fill="url(#tssBarGradWeekly)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
