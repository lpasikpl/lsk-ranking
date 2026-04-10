"use client";

import { useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { YearlyByType } from "@/lib/strava-types";
import { CURRENT_YEAR, RIDE_TYPE_COLORS } from "@/lib/strava-constants";
import { DeltaBadge } from "@/components/strava/ui/DeltaBadge";
import { formatKm, formatHours } from "@/lib/utils";

interface YearByTypeCardProps {
  data: YearlyByType[];
}

function sumGroup(items: YearlyByType[]) {
  return {
    rides: items.reduce((a, b) => a + b.rides, 0),
    active_days: items.reduce((a, b) => a + b.active_days, 0),
    hours: items.reduce((a, b) => a + b.hours, 0),
    distance_km: items.reduce((a, b) => a + b.distance_km, 0),
    elevation_m: items.reduce((a, b) => a + b.elevation_m, 0),
  };
}

function TypeTable({ data, title, groupBy }: { data: YearlyByType[]; title: string; groupBy: "ride_type" | "environment" }) {
  const currentYear = data.filter((d) => d.year === CURRENT_YEAR);
  const prevYear = data.filter((d) => d.year === CURRENT_YEAR - 1);

  const groups = [...new Set(data.map((d) => d[groupBy]))];

  const currentTotals = sumGroup(currentYear);
  const prevTotals = sumGroup(prevYear);

  return (
    <div style={{
      borderRadius: 16,
      background: "linear-gradient(145deg, #0a0a0a 0%, #111111 100%)",
      border: "1px solid rgba(255,255,255,0.07)",
      overflow: "hidden",
    }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <h3 style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.8)" }}>{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr style={{ fontSize: 11, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
              <th className="text-left px-4 py-2">Typ</th>
              <th className="text-right px-4 py-2">km</th>
              <th className="text-right px-4 py-2">Czas</th>
              <th className="text-right px-4 py-2">Dni</th>
              <th className="text-right px-4 py-2">Elev.</th>
              <th className="text-right px-4 py-2">vs {CURRENT_YEAR - 1}</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => {
              // Sumuj WSZYSTKIE rekordy pasujące do grupy (fix: Gravel + Szosa → Outdoor)
              const currItems = currentYear.filter((d) => d[groupBy] === group);
              const prevItems = prevYear.filter((d) => d[groupBy] === group);
              if (currItems.length === 0) return null;
              const curr = sumGroup(currItems);
              const prev = sumGroup(prevItems);
              const color = groupBy === "ride_type" ? RIDE_TYPE_COLORS[group] : undefined;
              return (
                <tr key={group} style={{ borderTop: "1px solid rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.85)" }}>
                  <td className="px-4 py-2 font-medium">
                    <span className="flex items-center gap-2">
                      {color && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />}
                      {group}
                    </span>
                  </td>
                  <td className="text-right px-4 py-2">{formatKm(curr.distance_km)}</td>
                  <td className="text-right px-4 py-2">{formatHours(curr.hours)}</td>
                  <td className="text-right px-4 py-2">{curr.active_days}</td>
                  <td className="text-right px-4 py-2">{formatKm(curr.elevation_m)}m</td>
                  <td className="text-right px-4 py-2">
                    <DeltaBadge current={curr.distance_km} previous={prev.distance_km} />
                  </td>
                </tr>
              );
            })}
            <tr style={{ borderTop: "2px solid rgba(255,255,255,0.1)", fontWeight: 700, color: "rgba(255,255,255,0.95)" }}>
              <td className="px-4 py-2">Razem</td>
              <td className="text-right px-4 py-2">{formatKm(currentTotals.distance_km)}</td>
              <td className="text-right px-4 py-2">{formatHours(currentTotals.hours)}</td>
              <td className="text-right px-4 py-2">{currentTotals.active_days}</td>
              <td className="text-right px-4 py-2">{formatKm(currentTotals.elevation_m)}m</td>
              <td className="text-right px-4 py-2">
                <DeltaBadge current={currentTotals.distance_km} previous={prevTotals.distance_km} />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

const METRIC_OPTIONS = [
  { key: "distance_km", label: "Dystans" },
  { key: "hours", label: "Czas" },
  { key: "elevation_m", label: "Przewyższenia" },
  { key: "active_days", label: "Dni" },
] as const;

type MetricKey = (typeof METRIC_OPTIONS)[number]["key"];

const ENV_COLORS: Record<string, string> = {
  Outdoor: "#FC5200",
  Indoor: "#3b82f6",
};

function formatMetricValue(key: MetricKey, value: number): string {
  switch (key) {
    case "distance_km": return `${formatKm(value)} km`;
    case "hours": return formatHours(value);
    case "elevation_m": return `${formatKm(value)}m`;
    case "active_days": return `${value} dni`;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function PieTooltipContent({ active, payload, metricKey }: any) {
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
    }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{d.name}</div>
      <div><span style={{ color: "#FC5200", fontWeight: 600 }}>{formatMetricValue(metricKey, d.value)}</span></div>
      <div style={{ color: "rgba(255,255,255,0.4)" }}>{d.pct.toFixed(1)}%</div>
    </div>
  );
}

const RADIAN = Math.PI / 180;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderCustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, name, pct, value, metricKey, fill }: any) {
  const radius = outerRadius + 24;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const anchor = x > cx ? "start" : "end";
  return (
    <text x={x} y={y} textAnchor={anchor} dominantBaseline="central" style={{ fontSize: 11 }}>
      <tspan fill="rgba(255,255,255,0.8)" fontWeight={600}>{name}</tspan>
      <tspan fill="rgba(255,255,255,0.5)" dx={6}>{formatMetricValue(metricKey, value)}</tspan>
      <tspan fill={fill} dx={6} fontWeight={600}>{pct.toFixed(1)}%</tspan>
    </text>
  );
}

function TypePieChart({ data, title, groupBy, colors }: {
  data: YearlyByType[];
  title: string;
  groupBy: "ride_type" | "environment";
  colors: Record<string, string>;
}) {
  const [metric, setMetric] = useState<MetricKey>("distance_km");

  const currentYear = data.filter((d) => d.year === CURRENT_YEAR);
  const groups = [...new Set(data.map((d) => d[groupBy]))];

  const rawSlices = groups.map((group) => {
    const items = currentYear.filter((d) => d[groupBy] === group);
    const sum = sumGroup(items);
    return { name: group, value: sum[metric], color: colors[group] || "rgba(255,255,255,0.3)" };
  }).filter((s) => s.value > 0);

  const total = rawSlices.reduce((a, b) => a + b.value, 0);
  const slices = rawSlices.map((s) => ({ ...s, pct: total > 0 ? (s.value / total) * 100 : 0, metricKey: metric }));

  return (
    <div style={{
      borderRadius: 16,
      background: "linear-gradient(145deg, #0a0a0a 0%, #111111 100%)",
      border: "1px solid rgba(255,255,255,0.07)",
      padding: "16px",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <h3 style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.8)", margin: 0 }}>{title}</h3>
        <div style={{ display: "flex", gap: 4 }}>
          {METRIC_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setMetric(opt.key)}
              style={{
                fontSize: 11,
                padding: "3px 8px",
                borderRadius: 6,
                border: "1px solid",
                borderColor: metric === opt.key ? "rgba(252,82,0,0.5)" : "rgba(255,255,255,0.1)",
                background: metric === opt.key ? "rgba(252,82,0,0.15)" : "transparent",
                color: metric === opt.key ? "#FC5200" : "rgba(255,255,255,0.4)",
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
      <ResponsiveContainer width="100%" height={220}>
        <PieChart>
          <Pie
            data={slices}
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={75}
            dataKey="value"
            stroke="none"
            label={(props) => renderCustomLabel({ ...props, metricKey: metric })}
            labelLine={false}
          >
            {slices.map((s, i) => (
              <Cell key={i} fill={s.color} />
            ))}
          </Pie>
          <Tooltip content={<PieTooltipContent metricKey={metric} />} />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export function YearByTypeCard({ data }: YearByTypeCardProps) {
  return (
    <div>
      <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
        Sumy {CURRENT_YEAR} — podział wg typu
      </h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TypeTable data={data} title="Wg dyscypliny" groupBy="ride_type" />
        <TypeTable data={data} title="Outdoor vs Indoor" groupBy="environment" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mt-4">
        <TypePieChart data={data} title="Wg dyscypliny" groupBy="ride_type" colors={RIDE_TYPE_COLORS} />
        <TypePieChart data={data} title="Outdoor vs Indoor" groupBy="environment" colors={ENV_COLORS} />
      </div>
    </div>
  );
}
