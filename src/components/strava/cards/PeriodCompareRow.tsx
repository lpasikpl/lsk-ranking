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
    { label: "Aktywne dni", value: current.active_days, prev: previous.active_days },
    { label: "Przewyższenia", value: current.elevation_m, prev: previous.elevation_m, suffix: " m" },
    { label: "Śr. dystans (>1h)", value: current.avg_distance_km ?? 0, prev: previous.avg_distance_km ?? undefined, suffix: " km", decimals: 1 },
    { label: "Śr. NP", value: current.avg_np ?? 0, prev: previous.avg_np ?? undefined, suffix: " W" },
    { label: "Śr. HR (>1h)", value: current.avg_hr ?? 0, prev: previous.avg_hr ?? undefined, suffix: " bpm", invert: true },
    { label: "TSS", value: current.total_tss, prev: previous.total_tss },
    { label: "NP/HR", value: current.np_hr_ratio ?? 0, prev: previous.np_hr_ratio ?? undefined, decimals: 2 },
    { label: "Kalorie", value: current.total_calories, prev: previous.total_calories, suffix: " kcal" },
    { label: "Śr. km/h szosa (>1h)", value: current.avg_speed_road ?? 0, prev: previous.avg_speed_road ?? undefined, suffix: " km/h", decimals: 1 },
    { label: "Obroty korb", value: current.total_pedal_strokes, prev: previous.total_pedal_strokes },
  ];

  return (
    <div>
      <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-3 capitalize">
        {label}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-12 gap-3 items-stretch">
        {stats.map((s) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={s.value}
            prevValue={s.prev}
            suffix={s.suffix}
            decimals={s.decimals}
            formatter={s.formatter}
            invert={s.invert}
          />
        ))}
      </div>
    </div>
  );
}
