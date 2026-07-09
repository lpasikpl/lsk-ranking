"use client";

import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import type { GarminDaily } from "@/lib/strava-types";

interface Props {
  data: GarminDaily[];
}

const RHR_COLOR = "#22d3ee";
const READY_COLOR = "#FC5200";

function fmtDay(d: string) {
  const [, m, day] = d.split("-");
  return `${day}.${m}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0]?.payload;
  if (!p) return null;
  return (
    <div style={{
      backgroundColor: "#0f1117", border: "1px solid rgba(255,255,255,0.15)", borderRadius: 10,
      padding: "10px 14px", fontSize: 12, color: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.8)", minWidth: 160,
    }}>
      <div style={{ color: "rgba(255,255,255,0.45)", marginBottom: 8, fontWeight: 500 }}>{p.full}</div>
      <div style={{ marginBottom: 3 }}>
        <span style={{ color: READY_COLOR, fontWeight: 700, fontSize: 15 }}>{p.readiness ?? "—"}</span>
        <span style={{ color: "rgba(255,255,255,0.35)", marginLeft: 5 }}>gotowość {p.level ?? ""}</span>
      </div>
      <div>
        <span style={{ color: RHR_COLOR, fontWeight: 600 }}>{p.rhr ?? "—"}</span>
        <span style={{ color: "rgba(255,255,255,0.35)", marginLeft: 5 }}>bpm — tętno spocz.</span>
      </div>
    </div>
  );
}

export function ReadinessRhrChart({ data }: Props) {
  const chartData = data.map((d) => ({
    label: fmtDay(d.calendar_date),
    full: d.calendar_date,
    readiness: d.readiness_score,
    level: d.readiness_level,
    rhr: d.resting_hr,
  }));

  const rhrValues = data.map((d) => d.resting_hr).filter((v): v is number => v != null);
  const avgRhr = rhrValues.length ? Math.round(rhrValues.reduce((s, v) => s + v, 0) / rhrValues.length) : null;
  const latestReady = [...data].reverse().find((d) => d.readiness_score != null)?.readiness_score ?? null;

  return (
    <div style={{
      borderRadius: 16, background: "linear-gradient(145deg, #0a0a0a 0%, #111111 100%)",
      border: "1px solid rgba(255,255,255,0.06)", padding: "24px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.5)", margin: 0 }}>
          Gotowość treningowa i tętno spoczynkowe
        </h2>
        <div style={{ display: "flex", gap: 16, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
          {latestReady != null && <span>Gotowość: <span style={{ color: READY_COLOR, fontWeight: 600 }}>{latestReady}</span></span>}
          {avgRhr != null && <span>Śr. RHR: <span style={{ color: RHR_COLOR, fontWeight: 600 }}>{avgRhr}</span></span>}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="readyArea" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={READY_COLOR} stopOpacity={0.4} />
              <stop offset="100%" stopColor={READY_COLOR} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          <XAxis
            dataKey="label" tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
            axisLine={false} tickLine={false} minTickGap={14} interval="preserveStartEnd"
          />
          <YAxis
            yAxisId="ready" domain={[0, 100]} tick={{ fill: "rgba(252,82,0,0.5)", fontSize: 11 }}
            axisLine={false} tickLine={false} width={32}
          />
          <YAxis
            yAxisId="rhr" orientation="right" domain={["dataMin - 3", "dataMax + 3"]}
            tick={{ fill: "rgba(34,211,238,0.6)", fontSize: 11 }} axisLine={false} tickLine={false} width={30}
            tickFormatter={(v) => String(Math.round(v))}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.15)" }} />
          <Area yAxisId="ready" type="monotone" dataKey="readiness" stroke={READY_COLOR} strokeWidth={2} fill="url(#readyArea)" connectNulls />
          <Line yAxisId="rhr" type="monotone" dataKey="rhr" stroke={RHR_COLOR} strokeWidth={2} dot={false} connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ display: "inline-block", width: 12, height: 10, backgroundColor: READY_COLOR, borderRadius: 2, opacity: 0.6 }} /> gotowość (0–100)
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ display: "inline-block", width: 12, height: 3, backgroundColor: RHR_COLOR, borderRadius: 2 }} /> tętno spoczynkowe (bpm)
        </span>
      </div>
    </div>
  );
}
