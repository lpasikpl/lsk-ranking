"use client";

import {
  ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import type { GarminDaily } from "@/lib/strava-types";

interface Props {
  data: GarminDaily[];
}

const COLORS = {
  deep: "#1e40af",
  light: "#60a5fa",
  rem: "#a78bfa",
  awake: "rgba(255,255,255,0.22)",
  score: "#FC5200",
};

function fmtDay(d: string) {
  const [, m, day] = d.split("-");
  return `${day}.${m}`;
}
const h = (s: number | null) => (s == null ? null : s / 3600);
const hm = (s: number | null | undefined) => {
  if (s == null) return "—";
  const t = Math.round(s / 60);
  return `${Math.floor(t / 60)}h ${t % 60}min`;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  if (!p) return null;
  return (
    <div style={{
      backgroundColor: "#0f1117", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10,
      padding: "10px 14px", fontSize: 12, color: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.8)", minWidth: 170,
    }}>
      <div style={{ color: "rgba(255,255,255,0.45)", marginBottom: 8, fontWeight: 500 }}>
        {p.full}
        {p.score != null && <span style={{ color: COLORS.score, fontWeight: 700, marginLeft: 8 }}>score {p.score}</span>}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "auto auto", gap: "3px 12px" }}>
        <span style={{ color: COLORS.rem }}>REM</span><span>{hm(p.remSec)}</span>
        <span style={{ color: COLORS.light }}>Lekki</span><span>{hm(p.lightSec)}</span>
        <span style={{ color: "#93b4fb" }}>Głęboki</span><span>{hm(p.deepSec)}</span>
        <span style={{ color: "rgba(255,255,255,0.5)" }}>Wybudzenia</span><span>{hm(p.awakeSec)}</span>
        <span style={{ color: "rgba(255,255,255,0.7)", fontWeight: 600 }}>Razem</span>
        <span style={{ fontWeight: 600 }}>{hm(p.totalSec)}</span>
      </div>
    </div>
  );
}

export function SleepStagesChart({ data }: Props) {
  const chartData = data.map((d) => ({
    label: fmtDay(d.calendar_date),
    full: d.calendar_date,
    deep: h(d.deep_seconds),
    light: h(d.light_seconds),
    rem: h(d.rem_seconds),
    awake: h(d.awake_seconds),
    score: d.sleep_score,
    deepSec: d.deep_seconds, lightSec: d.light_seconds, remSec: d.rem_seconds,
    awakeSec: d.awake_seconds, totalSec: d.sleep_seconds,
  }));

  const scores = data.map((d) => d.sleep_score).filter((v): v is number => v != null);
  const avgScore = scores.length ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length) : null;
  const durations = data.map((d) => d.sleep_seconds).filter((v): v is number => v != null);
  const avgDur = durations.length ? durations.reduce((s, v) => s + v, 0) / durations.length : null;

  return (
    <div style={{
      borderRadius: 16, background: "linear-gradient(145deg, #0a0a0a 0%, #111111 100%)",
      border: "1px solid rgba(255,255,255,0.06)", padding: "24px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.5)", margin: 0 }}>
          Sen — fazy i jakość
        </h2>
        <div style={{ display: "flex", gap: 16, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
          {avgDur != null && <span>Śr. długość: <span style={{ color: "rgba(255,255,255,0.6)" }}>{hm(avgDur)}</span></span>}
          {avgScore != null && <span>Śr. score: <span style={{ color: COLORS.score, fontWeight: 600 }}>{avgScore}</span></span>}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }} barCategoryGap="18%">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="label" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
            axisLine={false} tickLine={false} minTickGap={14} interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="h" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
            axisLine={false} tickLine={false} width={32} tickFormatter={(v) => `${v}h`}
          />
          <YAxis
            yAxisId="score" orientation="right" domain={[0, 100]} tick={{ fill: "rgba(252,82,0,0.5)", fontSize: 11 }}
            axisLine={false} tickLine={false} width={30}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.04)" }} />
          <Bar yAxisId="h" dataKey="deep" stackId="s" fill={COLORS.deep} />
          <Bar yAxisId="h" dataKey="light" stackId="s" fill={COLORS.light} />
          <Bar yAxisId="h" dataKey="rem" stackId="s" fill={COLORS.rem} />
          <Bar yAxisId="h" dataKey="awake" stackId="s" fill={COLORS.awake} radius={[2, 2, 0, 0]} />
          <Line yAxisId="score" type="monotone" dataKey="score" stroke={COLORS.score} strokeWidth={2} dot={false} connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", alignItems: "center", gap: 18, marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.35)", flexWrap: "wrap" }}>
        {[["Głęboki", COLORS.deep], ["Lekki", COLORS.light], ["REM", COLORS.rem], ["Wybudzenia", "rgba(255,255,255,0.4)"]].map(([name, c]) => (
          <span key={name} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ display: "inline-block", width: 12, height: 10, backgroundColor: c, borderRadius: 2 }} /> {name}
          </span>
        ))}
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ display: "inline-block", width: 12, height: 3, backgroundColor: COLORS.score, borderRadius: 2 }} /> sleep score
        </span>
      </div>
    </div>
  );
}
