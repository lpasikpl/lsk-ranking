"use client";

import type { PeriodCompare } from "@/lib/strava-types";
import { StatCard } from "@/components/strava/cards/StatCard";
import { formatHours } from "@/lib/utils";

interface PeriodCompareRowProps {
  data: PeriodCompare;
}

export function PeriodCompareRow({ data }: PeriodCompareRowProps) {
  const { current, previous, label } = data;

  const stats = [
    { label: "Kilometry", value: current.distance_km, prev: previous.distance_km, suffix: " km" },
    { label: "Godziny", value: current.hours, prev: previous.hours, formatter: formatHours },
    { label: "Jazdy", value: current.rides, prev: previous.rides },
    { label: "Przewyższenia", value: current.elevation_m, prev: previous.elevation_m, suffix: " m" },
    { label: "Śr. NP", value: current.avg_np ?? 0, prev: previous.avg_np ?? undefined, suffix: " W" },
    { label: "TSS", value: current.total_tss, prev: previous.total_tss },
    { label: "Śr. dystans (>1h)", value: current.avg_distance_km ?? 0, prev: previous.avg_distance_km ?? undefined, suffix: " km", decimals: 1 },
    { label: "Aktywne dni", value: current.active_days, prev: previous.active_days },
  ];

  return (
    <div>
      <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-3 capitalize">
        {label}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
        {stats.map((s) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={s.value}
            prevValue={s.prev}
            suffix={s.suffix}
            formatter={s.formatter}
          />
        ))}
      </div>
    </div>
  );
}
