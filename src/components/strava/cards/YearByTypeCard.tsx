"use client";

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
    </div>
  );
}
