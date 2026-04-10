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
  { key: "distance_km", label: "Dystans", unit: "km" },
  { key: "hours", label: "Czas", unit: "" },
  { key: "elevation_m", label: "Przewyższenia", unit: "m" },
  { key: "active_days", label: "Dni", unit: "dni" },
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
    case "active_days": return `${value}`;
  }
}

function formatMetricTotal(key: MetricKey, value: number): string {
  switch (key) {
    case "distance_km": return formatKm(value);
    case "hours": return formatHours(value);
    case "elevation_m": return formatKm(value);
    case "active_days": return `${value}`;
  }
}

function metricUnit(key: MetricKey): string {
  switch (key) {
    case "distance_km": return "km";
    case "hours": return "";
    case "elevation_m": return "m elev.";
    case "active_days": return "dni";
  }
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
  const slices = rawSlices.map((s) => ({ ...s, pct: total > 0 ? (s.value / total) * 100 : 0 }));
  const maxPct = Math.max(...slices.map((s) => s.pct), 1);

  return (
    <div style={{
      borderRadius: 16,
      background: "linear-gradient(145deg, #0a0a0a 0%, #111111 100%)",
      border: "1px solid rgba(255,255,255,0.07)",
      padding: "20px",
    }}>
      {/* Header + toggle */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <h3 style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.8)", margin: 0 }}>{title}</h3>
        <div style={{ display: "flex", gap: 2, background: "rgba(255,255,255,0.04)", borderRadius: 8, padding: 2 }}>
          {METRIC_OPTIONS.map((opt) => (
            <button
              key={opt.key}
              onClick={() => setMetric(opt.key)}
              style={{
                fontSize: 11,
                padding: "4px 10px",
                borderRadius: 6,
                border: "none",
                background: metric === opt.key ? "rgba(252,82,0,0.2)" : "transparent",
                color: metric === opt.key ? "#FC5200" : "rgba(255,255,255,0.35)",
                cursor: "pointer",
                transition: "all 0.2s",
                fontWeight: metric === opt.key ? 600 : 400,
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Donut + center total */}
      <div style={{ position: "relative" }}>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie
              data={slices}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              dataKey="value"
              stroke="rgba(0,0,0,0.4)"
              strokeWidth={2}
              paddingAngle={2}
              cornerRadius={4}
            >
              {slices.map((s, i) => (
                <Cell key={i} fill={s.color} style={{ filter: `drop-shadow(0 0 6px ${s.color}40)` }} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        {/* Center label */}
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          textAlign: "center",
          pointerEvents: "none",
        }}>
          <div style={{ fontSize: 20, fontWeight: 700, color: "rgba(255,255,255,0.9)", lineHeight: 1.1 }}>
            {formatMetricTotal(metric, total)}
          </div>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginTop: 2 }}>
            {metricUnit(metric)}
          </div>
        </div>
      </div>

      {/* Legend rows */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 12 }}>
        {slices.map((s) => (
          <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.7)", width: 64, flexShrink: 0 }}>{s.name}</span>
            <div style={{ flex: 1, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
              <div style={{
                height: "100%",
                width: `${(s.pct / maxPct) * 100}%`,
                borderRadius: 3,
                background: `linear-gradient(90deg, ${s.color}, ${s.color}aa)`,
                transition: "width 0.4s ease",
              }} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(255,255,255,0.8)", width: 68, textAlign: "right", flexShrink: 0 }}>
              {formatMetricValue(metric, s.value)}
            </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: s.color, width: 42, textAlign: "right", flexShrink: 0 }}>
              {s.pct.toFixed(1)}%
            </span>
          </div>
        ))}
      </div>
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
