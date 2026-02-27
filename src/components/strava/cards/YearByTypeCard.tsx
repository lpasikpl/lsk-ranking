"use client";

import type { YearlyByType } from "@/lib/strava-types";
import { CURRENT_YEAR, RIDE_TYPE_COLORS } from "@/lib/strava-constants";
import { DeltaBadge } from "@/components/strava/ui/DeltaBadge";
import { formatKm, formatHours } from "@/lib/utils";

interface YearByTypeCardProps {
  data: YearlyByType[];
}

function TypeTable({ data, title, groupBy }: { data: YearlyByType[]; title: string; groupBy: "ride_type" | "environment" }) {
  const currentYear = data.filter((d) => d.year === CURRENT_YEAR);
  const prevYear = data.filter((d) => d.year === CURRENT_YEAR - 1);

  const groups = [...new Set(data.map((d) => d[groupBy]))];

  const totals = (items: YearlyByType[]) => ({
    rides: items.reduce((a, b) => a + b.rides, 0),
    hours: items.reduce((a, b) => a + b.hours, 0),
    distance_km: items.reduce((a, b) => a + b.distance_km, 0),
    elevation_m: items.reduce((a, b) => a + b.elevation_m, 0),
  });

  const currentTotals = totals(currentYear);
  const prevTotals = totals(prevYear);

  return (
    <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <h3 className="text-sm font-medium text-[var(--text-secondary)]">{title}</h3>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
              <th className="text-left px-4 py-2">Typ</th>
              <th className="text-right px-4 py-2">km</th>
              <th className="text-right px-4 py-2">Czas</th>
              <th className="text-right px-4 py-2">Jazdy</th>
              <th className="text-right px-4 py-2">Elev.</th>
              <th className="text-right px-4 py-2">vs {CURRENT_YEAR - 1}</th>
            </tr>
          </thead>
          <tbody>
            {groups.map((group) => {
              const curr = currentYear.find((d) => d[groupBy] === group);
              const prev = prevYear.find((d) => d[groupBy] === group);
              if (!curr) return null;
              const color = groupBy === "ride_type" ? RIDE_TYPE_COLORS[group] : undefined;
              return (
                <tr key={group} className="border-t border-[var(--border)] hover:bg-[var(--bg-card-hover)]">
                  <td className="px-4 py-2 font-medium">
                    <span className="flex items-center gap-2">
                      {color && <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />}
                      {group}
                    </span>
                  </td>
                  <td className="text-right px-4 py-2">{formatKm(curr.distance_km)}</td>
                  <td className="text-right px-4 py-2">{formatHours(curr.hours)}</td>
                  <td className="text-right px-4 py-2">{curr.rides}</td>
                  <td className="text-right px-4 py-2">{formatKm(curr.elevation_m)}m</td>
                  <td className="text-right px-4 py-2">
                    <DeltaBadge current={curr.distance_km} previous={prev?.distance_km ?? 0} />
                  </td>
                </tr>
              );
            })}
            <tr className="border-t-2 border-[var(--border)] font-semibold">
              <td className="px-4 py-2">Razem</td>
              <td className="text-right px-4 py-2">{formatKm(currentTotals.distance_km)}</td>
              <td className="text-right px-4 py-2">{formatHours(currentTotals.hours)}</td>
              <td className="text-right px-4 py-2">{currentTotals.rides}</td>
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
