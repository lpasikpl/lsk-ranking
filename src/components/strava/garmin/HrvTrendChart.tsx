"use client";

import {
  ComposedChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceArea,
} from "recharts";
import type { GarminDaily } from "@/lib/strava-types";

interface Props {
  data: GarminDaily[];
}

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
      padding: "10px 14px", fontSize: 12, color: "#fff", boxShadow: "0 8px 32px rgba(0,0,0,0.8)", minWidth: 150,
    }}>
      <div style={{ color: "rgba(255,255,255,0.45)", marginBottom: 8, fontWeight: 500 }}>{p.full}</div>
      <div style={{ marginBottom: 3 }}>
        <span style={{ color: "#FC5200", fontWeight: 700, fontSize: 16 }}>{p.hrv ?? "—"}</span>
        <span style={{ color: "rgba(255,255,255,0.35)", marginLeft: 5 }}>ms — HRV nocne</span>
      </div>
      {p.weekly != null && (
        <div style={{ color: "rgba(255,255,255,0.5)" }}>śr. 7 dni: {p.weekly} ms</div>
      )}
      {p.status && <div style={{ color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{p.status}</div>}
    </div>
  );
}

export function HrvTrendChart({ data }: Props) {
  const chartData = data.map((d) => ({
    label: fmtDay(d.calendar_date),
    full: d.calendar_date,
    hrv: d.hrv_last_night,
    weekly: d.hrv_weekly_avg,
    status: d.hrv_status,
  }));

  // pasmo baseline — z najświeższego dostępnego dnia
  const lastWithBaseline = [...data].reverse().find((d) => d.hrv_baseline_low != null && d.hrv_baseline_upper != null);
  const baseLow = lastWithBaseline?.hrv_baseline_low ?? null;
  const baseUpper = lastWithBaseline?.hrv_baseline_upper ?? null;

  const values = data.map((d) => d.hrv_last_night).filter((v): v is number => v != null);
  const latest = values.length ? values[values.length - 1] : null;

  return (
    <div style={{
      borderRadius: 16, background: "linear-gradient(145deg, #0a0a0a 0%, #111111 100%)",
      border: "1px solid rgba(255,255,255,0.06)", padding: "24px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexWrap: "wrap", gap: 8 }}>
        <h2 style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.5)", margin: 0 }}>
          HRV — zmienność rytmu serca (nocne)
        </h2>
        <div style={{ display: "flex", gap: 16, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
          {latest != null && <span>Teraz: <span style={{ color: "#FC5200", fontWeight: 600 }}>{latest} ms</span></span>}
          {baseLow != null && baseUpper != null && (
            <span>Baseline: <span style={{ color: "rgba(255,255,255,0.6)" }}>{baseLow}–{baseUpper}</span></span>
          )}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={chartData} margin={{ top: 10, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="hrvLine" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#FC5200" stopOpacity={0.35} />
              <stop offset="100%" stopColor="#FC5200" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
          {baseLow != null && baseUpper != null && (
            <ReferenceArea y1={baseLow} y2={baseUpper} fill="#4ade80" fillOpacity={0.08} stroke="#4ade80" strokeOpacity={0.15} strokeDasharray="3 3" />
          )}
          <XAxis
            dataKey="label"
            tick={{ fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
            axisLine={false} tickLine={false}
            minTickGap={14} interval="preserveStartEnd"
          />
          <YAxis
            tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 11 }}
            axisLine={false} tickLine={false} width={36}
            domain={["dataMin - 5", "dataMax + 5"]}
            tickFormatter={(v) => String(Math.round(v))}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "rgba(255,255,255,0.15)" }} />
          <Area type="monotone" dataKey="hrv" stroke="none" fill="url(#hrvLine)" connectNulls />
          <Line type="monotone" dataKey="hrv" stroke="#FC5200" strokeWidth={2} dot={false} connectNulls />
          <Line type="monotone" dataKey="weekly" stroke="rgba(255,255,255,0.35)" strokeWidth={1.5} strokeDasharray="4 3" dot={false} connectNulls />
        </ComposedChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", alignItems: "center", gap: 24, marginTop: 12, fontSize: 12, color: "rgba(255,255,255,0.35)" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ display: "inline-block", width: 12, height: 3, backgroundColor: "#FC5200", borderRadius: 2 }} /> HRV nocne
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ display: "inline-block", width: 12, height: 3, backgroundColor: "rgba(255,255,255,0.35)", borderRadius: 2 }} /> śr. 7 dni
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span style={{ display: "inline-block", width: 12, height: 10, backgroundColor: "rgba(74,222,128,0.25)", border: "1px solid rgba(74,222,128,0.4)", borderRadius: 2 }} /> strefa zbalansowana
        </span>
      </div>
    </div>
  );
}
