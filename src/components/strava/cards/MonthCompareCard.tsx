"use client";

import type { MonthlyYoy } from "@/lib/strava-types";
import { StatCard } from "@/components/strava/cards/StatCard";
import { CURRENT_YEAR } from "@/lib/strava-constants";
import { formatHours } from "@/lib/utils";

interface MonthCompareCardProps {
  data: MonthlyYoy[];
}

export function MonthCompareCard({ data }: MonthCompareCardProps) {
  const currentMonth = new Date().getMonth() + 1;
  const thisMonth = data.find((d) => d.year === CURRENT_YEAR && d.month === currentMonth);
  const lastYearMonth = data.find((d) => d.year === CURRENT_YEAR - 1 && d.month === currentMonth);

  if (!thisMonth) {
    return (
      <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-6">
        <h2 className="text-sm font-medium text-[var(--text-secondary)]">Bieżący miesiąc</h2>
        <p className="text-[var(--text-muted)] mt-2 text-sm">Brak danych za ten miesiąc.</p>
      </div>
    );
  }

  const monthName = new Date(CURRENT_YEAR, currentMonth - 1).toLocaleDateString("pl-PL", { month: "long" });

  const stats = [
    { label: "Kilometry", value: thisMonth.distance_km, prev: lastYearMonth?.distance_km, suffix: " km" },
    { label: "Godziny", value: thisMonth.hours, prev: lastYearMonth?.hours, formatter: formatHours },
    { label: "Jazdy", value: thisMonth.rides, prev: lastYearMonth?.rides },
    { label: "Przewyższenia", value: thisMonth.elevation_m, prev: lastYearMonth?.elevation_m, suffix: " m" },
    { label: "Śr. NP", value: thisMonth.avg_np ?? 0, prev: lastYearMonth?.avg_np ?? undefined, suffix: " W" },
    { label: "Aktywne dni", value: thisMonth.active_days, prev: lastYearMonth?.active_days },
  ];

  return (
    <div>
      <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-3 capitalize">
        {monthName} {CURRENT_YEAR} vs {CURRENT_YEAR - 1}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
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
