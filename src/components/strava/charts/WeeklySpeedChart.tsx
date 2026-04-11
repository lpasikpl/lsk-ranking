"use client";

import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import type { WeeklyAvgSpeed, MonthlyAvgSpeed } from "@/lib/strava-types";

interface SpeedChartProps {
  weeklyData: WeeklyAvgSpeed[];
  monthlyData: MonthlyAvgSpeed[];
}

const CURRENT_YEAR = new Date().getFullYear();
const MONTH_NAMES_SHORT = ["sty", "lut", "mar", "kwi", "maj", "cze", "lip", "sie", "wrz", "paź", "lis", "gru"];

function isoWeekDateRange(isoWeek: number, isoYear: number): string {
  const jan4 = new Date(Date.UTC(isoYear, 0, 4));
  const dayOfWeek = jan4.getUTCDay() || 7;
  const monday = new Date(jan4);
  monday.setUTCDate(jan4.getUTCDate() - dayOfWeek + 1 + (isoWeek - 1) * 7);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  const dMon = monday.getUTCDate();
  const mMon = monday.getUTCMonth() + 1;
  const dSun = sunday.getUTCDate();
  const mSun = sunday.getUTCMonth() + 1;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (mMon === mSun) return `${dMon}-${dSun}.${pad(mSun)}.${isoYear}`;
  return `${dMon}.${pad(mMon)}-${dSun}.${pad(mSun)}.${isoYear}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MonthlyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
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
      <div style={{ color: "rgba(255,255,255,0.45)", marginBottom: 8, fontWeight: 500 }}>{label}</div>
      {payload.map((p: any) => p.value != null && (
        <div key={p.dataKey} style={{ marginBottom: 3 }}>
          <span style={{ color: p.dataKey === "speed2026" ? "#FC5200" : "rgba(255,255,255,0.4)", fontWeight: 600, fontSize: 14 }}>
            {p.value.toFixed(1)} km/h
          </span>
          <span style={{ color: "rgba(255,255,255,0.35)", marginLeft: 5 }}>{p.name}</span>
        </div>
      ))}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function WeeklyTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const dateRange = payload[0]?.payload?.dateRange;
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
      <div style={{ color: "rgba(255,255,255,0.45)", marginBottom: 8, fontWeight: 500 }}>{dateRange || label}</div>
      {payload.map((p: any) => p.value != null && (
        <div key={p.dataKey} style={{ marginBottom: 3 }}>
          <span style={{ color: p.dataKey === "speed2026" ? "#FC5200" : "rgba(255,255,255,0.4)", fontWeight: 600, fontSize: 14 }}>
            {p.value.toFixed(1)} km/h
          </span>
          <span style={{ color: "rgba(255,255,255,0.35)", marginLeft: 5 }}>{p.name}</span>
        </div>
      ))}
    </div>
  );
}

const legend = (
  <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ display: "inline-block", width: 12, height: 10, backgroundColor: "#FC5200", borderRadius: 2 }} />
      {CURRENT_YEAR}
    </span>
    <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
      <span style={{ display: "inline-block", width: 12, height: 10, backgroundColor: "#555555", borderRadius: 2 }} />
      {CURRENT_YEAR - 1}
    </span>
  </div>
);

const cardStyle = {
  borderRadius: 16,
  background: "linear-gradient(145deg, #0a0a0a 0%, #111111 100%)",
  border: "1px solid rgba(255,255,255,0.06)",
  padding: "24px",
};

export function WeeklySpeedChart({ weeklyData, monthlyData }: SpeedChartProps) {
  // --- Miesięczne ---
  const monthMap2025 = new Map(
    monthlyData.filter((d) => d.year === CURRENT_YEAR - 1).map((d) => [d.month, d.avg_speed_kmh])
  );
  const monthMap2026 = new Map(
    monthlyData.filter((d) => d.year === CURRENT_YEAR).map((d) => [d.month, d.avg_speed_kmh])
  );
  const monthlyChartData = Array.from({ length: 12 }, (_, i) => i + 1).map((m) => ({
    label: MONTH_NAMES_SHORT[m - 1],
    speed2025: monthMap2025.get(m) ?? null,
    speed2026: monthMap2026.get(m) ?? null,
  }));

  // --- Tygodniowe ---
  const weekMap2025 = new Map(
    weeklyData.filter((d) => d.iso_year === CURRENT_YEAR - 1).map((d) => [d.iso_week, d.avg_speed_kmh])
  );
  const weekMap2026 = new Map(
    weeklyData.filter((d) => d.iso_year === CURRENT_YEAR).map((d) => [d.iso_week, d.avg_speed_kmh])
  );
  const allWeeks = new Set([...weekMap2025.keys(), ...weekMap2026.keys()]);
  const weeklyChartData = [...allWeeks].sort((a, b) => a - b).map((w) => ({
    label: `${w}`,
    speed2025: weekMap2025.get(w) ?? null,
    speed2026: weekMap2026.get(w) ?? null,
    dateRange: isoWeekDateRange(w, CURRENT_YEAR),
  }));

  const current2026 = weeklyData.filter((d) => d.iso_year === CURRENT_YEAR);
  const last4 = current2026.slice(-4);
  const avg4w = last4.length > 0
    ? last4.reduce((a, b) => a + b.avg_speed_kmh, 0) / last4.length
    : 0;
  const maxSpeed = current2026.length > 0 ? Math.max(...current2026.map((d) => d.avg_speed_kmh)) : 0;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      {/* Miesięczna śr. prędkość */}
      <div style={cardStyle}>
        <h2 style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.5)", margin: "0 0 20px 0" }}>
          Śr. prędkość szosa (&gt;1h) miesięcznie — {CURRENT_YEAR} vs {CURRENT_YEAR - 1}
        </h2>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={monthlyChartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }} barCategoryGap="25%" barGap={2}>
            <defs>
              <linearGradient id="speedMonthly2026" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FC5200" stopOpacity={1} />
                <stop offset="100%" stopColor="#7a2800" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="speedMonthly2025" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#555555" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#222222" stopOpacity={0.6} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
            <XAxis dataKey="label" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={[20, "auto"]}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip content={<MonthlyTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar dataKey="speed2025" name={String(CURRENT_YEAR - 1)} fill="url(#speedMonthly2025)" radius={[3, 3, 0, 0]} />
            <Bar dataKey="speed2026" name={String(CURRENT_YEAR)} fill="url(#speedMonthly2026)" radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        {legend}
      </div>

      {/* Tygodniowa śr. prędkość */}
      <div style={cardStyle}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.5)", margin: 0 }}>
            Śr. prędkość szosa (&gt;1h) tygodniowo — {CURRENT_YEAR} vs {CURRENT_YEAR - 1}
          </h2>
          <div style={{ display: "flex", gap: 16, fontSize: 12 }}>
            <div>
              <span style={{ color: "rgba(255,255,255,0.3)" }}>Śr. 4tyg: </span>
              <span style={{ fontWeight: 600, color: "#FC5200" }}>{avg4w.toFixed(1)} km/h</span>
            </div>
            <div>
              <span style={{ color: "rgba(255,255,255,0.3)" }}>Max: </span>
              <span style={{ fontWeight: 600, color: "#FC5200" }}>{maxSpeed.toFixed(1)} km/h</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={weeklyChartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }} barCategoryGap="15%" barGap={1}>
            <defs>
              <linearGradient id="speedWeekly2026" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FC5200" stopOpacity={1} />
                <stop offset="100%" stopColor="#7a2800" stopOpacity={0.7} />
              </linearGradient>
              <linearGradient id="speedWeekly2025" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#555555" stopOpacity={0.8} />
                <stop offset="100%" stopColor="#222222" stopOpacity={0.6} />
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
              tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={[20, "auto"]}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip content={<WeeklyTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
            <Bar dataKey="speed2025" name={String(CURRENT_YEAR - 1)} fill="url(#speedWeekly2025)" radius={[2, 2, 0, 0]} />
            <Bar dataKey="speed2026" name={String(CURRENT_YEAR)} fill="url(#speedWeekly2026)" radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
        {legend}
      </div>
    </div>
  );
}
