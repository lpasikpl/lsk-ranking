"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import type { WeeklySummary } from "@/lib/strava-types";
import { POWER_ZONE_COLORS, POWER_ZONE_NAMES } from "@/lib/strava-constants";
import { formatDuration } from "@/lib/utils";

interface PowerZonesChartProps {
  data: WeeklySummary[];
}

export function PowerZonesChart({ data }: PowerZonesChartProps) {
  const recent = data.slice(-4);

  const totals = [
    recent.reduce((a, w) => a + w.pz1, 0),
    recent.reduce((a, w) => a + w.pz2, 0),
    recent.reduce((a, w) => a + w.pz3, 0),
    recent.reduce((a, w) => a + w.pz4, 0),
    recent.reduce((a, w) => a + w.pz5, 0),
    recent.reduce((a, w) => a + w.pz6, 0),
    recent.reduce((a, w) => a + w.pz7, 0),
  ];

  const totalSeconds = totals.reduce((a, b) => a + b, 0);

  const chartData = totals.map((seconds, i) => ({
    name: POWER_ZONE_NAMES[i],
    value: seconds,
    pct: totalSeconds > 0 ? ((seconds / totalSeconds) * 100).toFixed(1) : "0",
  }));

  if (totalSeconds === 0) {
    return (
      <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-6">
        <h2 className="text-sm font-medium text-[var(--text-secondary)]">Strefy mocy (30 dni)</h2>
        <p className="text-[var(--text-muted)] mt-4 text-sm">Brak danych mocy.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-6">
      <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-4">
        Strefy mocy — ostatnie 4 tyg.
      </h2>
      <div className="flex items-center gap-6">
        <ResponsiveContainer width={160} height={160}>
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((_, i) => (
                <Cell key={i} fill={POWER_ZONE_COLORS[i]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border)",
                borderRadius: "8px",
                color: "var(--text-primary)",
                fontSize: 12,
              }}
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              formatter={((value: any) => [formatDuration(value ?? 0), "Czas"]) as any}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex-1 space-y-1.5">
          {chartData.map((zone, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: POWER_ZONE_COLORS[i] }} />
                <span className="text-[var(--text-secondary)]">{zone.name}</span>
              </span>
              <span className="font-medium">{zone.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
