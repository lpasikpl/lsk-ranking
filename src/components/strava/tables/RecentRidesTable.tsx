"use client";

import { useState } from "react";
import type { Activity } from "@/lib/strava-types";
import { formatDuration, getRideType, getRideColor, formatKm } from "@/lib/utils";
import Link from "next/link";

interface RecentRidesTableProps {
  data: Activity[];
  title?: string;
}

const MONTH_NAMES = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
];

function groupByMonth(activities: Activity[]): { key: string; label: string; rides: Activity[] }[] {
  const map = new Map<string, Activity[]>();
  for (const ride of activities) {
    const d = new Date(ride.start_date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(ride);
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([key, rides]) => {
      const [year, month] = key.split("-");
      return { key, label: `${MONTH_NAMES[parseInt(month) - 1]} ${year}`, rides };
    });
}

function MonthSection({ group, defaultOpen }: { group: ReturnType<typeof groupByMonth>[0]; defaultOpen: boolean }) {
  const [open, setOpen] = useState(defaultOpen);

  const totalKm = group.rides.reduce((s, r) => s + r.distance_meters / 1000, 0);
  const totalTss = group.rides.reduce((s, r) => s + (r.effective_tss ?? 0), 0);

  return (
    <div className="border-t border-[var(--border)] first:border-t-0">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-6 py-3 hover:bg-[var(--bg-card-hover)] transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span
            className="text-xs transition-transform duration-200"
            style={{ display: "inline-block", transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
          >
            ▶
          </span>
          <span className="text-sm font-medium">{group.label}</span>
          <span className="text-xs text-[var(--text-muted)]">{group.rides.length} jazd</span>
        </div>
        <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
          <span>{totalKm.toFixed(0)} km</span>
          <span>{totalTss} TSS</span>
        </div>
      </button>

      {open && (
        <table className="w-full text-sm">
          <tbody>
            {group.rides.filter((r) => r.distance_meters >= 5000).map((ride) => {
              const type = getRideType(ride.sport_type);
              const color = getRideColor(ride.sport_type);
              return (
                <tr
                  key={ride.id}
                  className="border-t border-[var(--border)] hover:bg-[var(--bg-card-hover)] transition-colors"
                >
                  <td className="px-6 py-3 whitespace-nowrap w-[90px]">
                    <Link
                      href={`https://www.strava.com/activities/${ride.strava_activity_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--text-secondary)] hover:text-orange-400 transition-colors"
                    >
                      {new Date(ride.start_date).toLocaleDateString("pl-PL", {
                        day: "numeric",
                        month: "short",
                      })}
                    </Link>
                  </td>
                  <td className="px-4 py-3 w-[100px]">
                    <span
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: `${color}20`, color }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
                      {type}
                    </span>
                  </td>
                  <td className="text-right px-4 py-3">
                    {(ride.distance_meters / 1000).toFixed(1)}
                  </td>
                  <td className="text-right px-4 py-3 text-[var(--text-secondary)]">
                    {formatDuration(ride.moving_time_seconds)}
                  </td>
                  <td className="text-right px-4 py-3">
                    {formatKm(ride.total_elevation_gain)}m
                  </td>
                  <td className="text-right px-4 py-3 font-medium">
                    {ride.normalized_power ? `${ride.normalized_power}W` : "—"}
                  </td>
                  <td className="text-right px-4 py-3">
                    {ride.intensity_factor?.toFixed(2) ?? "—"}
                  </td>
                  <td className="text-right px-4 py-3">
                    {ride.effective_tss ?? "—"}
                  </td>
                  <td className="text-right px-4 py-3 text-[var(--text-secondary)]">
                    {ride.average_heartrate ? `${Math.round(ride.average_heartrate)}` : "—"}
                  </td>
                  <td className="text-right px-6 py-3 font-medium">
                    {ride.normalized_power && ride.average_heartrate
                      ? (ride.normalized_power / ride.average_heartrate).toFixed(2)
                      : "—"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export function RecentRidesTable({ data, title = "Wszystkie jazdy 2026" }: RecentRidesTableProps) {
  const groups = groupByMonth(data);
  const currentKey = (() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  })();

  return (
    <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] overflow-hidden">
      <div className="px-6 py-4 border-b border-[var(--border)]">
        <h2 className="text-sm font-medium text-[var(--text-secondary)]">
          {title}
        </h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-[var(--text-muted)] uppercase tracking-wider border-b border-[var(--border)]">
              <th className="text-left px-6 py-3 w-[90px]">Data</th>
              <th className="text-left px-4 py-3 w-[100px]">Typ</th>
              <th className="text-right px-4 py-3">km</th>
              <th className="text-right px-4 py-3">Czas</th>
              <th className="text-right px-4 py-3">Elev.</th>
              <th className="text-right px-4 py-3">NP</th>
              <th className="text-right px-4 py-3">IF</th>
              <th className="text-right px-4 py-3">TSS</th>
              <th className="text-right px-4 py-3">HR</th>
              <th className="text-right px-6 py-3">NP/HR</th>
            </tr>
          </thead>
        </table>
        {groups.map((group) => (
          <MonthSection
            key={group.key}
            group={group}
            defaultOpen={group.key === currentKey}
          />
        ))}
      </div>
    </div>
  );
}
