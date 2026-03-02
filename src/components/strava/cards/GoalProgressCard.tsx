"use client";

import type { YtdProgress } from "@/lib/strava-types";
import { ProgressRing } from "@/components/strava/ui/ProgressRing";
import { AnimatedNumber } from "@/components/strava/ui/AnimatedNumber";
import { formatKm, formatHours } from "@/lib/utils";

interface GoalProgressCardProps {
  data: YtdProgress;
}

function getYearProgress(): number {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const end = new Date(now.getFullYear() + 1, 0, 1);
  return ((now.getTime() - start.getTime()) / (end.getTime() - start.getTime())) * 100;
}

export function GoalProgressCard({ data }: GoalProgressCardProps) {
  const aheadBehind = data.ahead_behind_km;
  const isAhead = aheadBehind >= 0;
  const yearProgress = getYearProgress();

  return (
    <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-6 h-full flex flex-col">
      <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-6">
        Cel {data.year}: {formatKm(data.goal_km)} km
      </h2>

      {/* Ring — wycentrowany, duży */}
      <div className="flex justify-center mb-6">
        <ProgressRing progress={data.pct_complete} yearProgress={yearProgress} size={240} strokeWidth={36}>
          <div className="text-center">
            <AnimatedNumber
              value={data.pct_complete}
              decimals={1}
              suffix="%"
              className="text-3xl font-bold"
            />
            <div className="text-xs text-[var(--text-muted)] mt-1">realizacji</div>
          </div>
        </ProgressRing>
      </div>

      {/* Statystyki w siatce 2×2 */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 flex-1">
        <div>
          <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Przejechane</div>
          <div className="text-lg font-semibold">
            <AnimatedNumber value={data.actual_km} decimals={0} suffix=" km" />
          </div>
        </div>

        <div>
          <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Plan na dziś</div>
          <div className="text-lg text-[var(--text-secondary)]">
            {formatKm(data.planned_km)} km
          </div>
        </div>

        <div>
          <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-0.5">
            {isAhead ? "Zapas" : "Strata"}
          </div>
          <div className={`text-lg font-medium ${isAhead ? "text-emerald-400" : "text-red-400"}`}>
            {isAhead ? "+" : ""}{formatKm(aheadBehind)} km
          </div>
        </div>

        <div>
          <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider mb-0.5">Prognoza roczna</div>
          <div className="text-lg text-[var(--text-secondary)]">
            {formatKm(data.projected_km)} km
          </div>
        </div>
      </div>

      {/* Dolny pasek */}
      <div className="mt-5 grid grid-cols-3 gap-4 pt-4 border-t border-[var(--border)]">
        <div>
          <div className="text-xs text-[var(--text-muted)]">Aktywne dni</div>
          <div className="text-sm font-medium">{data.active_days}</div>
        </div>
        <div>
          <div className="text-xs text-[var(--text-muted)]">Godziny</div>
          <div className="text-sm font-medium">{formatHours(data.actual_hours)}</div>
        </div>
        <div>
          <div className="text-xs text-[var(--text-muted)]">Przewyższenia</div>
          <div className="text-sm font-medium">{formatKm(data.actual_elevation)}m</div>
        </div>
      </div>
    </div>
  );
}
