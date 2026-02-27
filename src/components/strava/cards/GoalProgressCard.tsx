"use client";

import type { YtdProgress } from "@/lib/strava-types";
import { ProgressRing } from "@/components/strava/ui/ProgressRing";
import { AnimatedNumber } from "@/components/strava/ui/AnimatedNumber";
import { formatKm, formatHours } from "@/lib/utils";

interface GoalProgressCardProps {
  data: YtdProgress;
}

export function GoalProgressCard({ data }: GoalProgressCardProps) {
  const aheadBehind = data.ahead_behind_km;
  const isAhead = aheadBehind >= 0;

  return (
    <div className="rounded-xl bg-[var(--bg-card)] border border-[var(--border)] p-6 h-full">
      <h2 className="text-sm font-medium text-[var(--text-secondary)] mb-4">
        Cel {data.year}: {formatKm(data.goal_km)} km
      </h2>

      <div className="flex items-center gap-6">
        <ProgressRing progress={data.pct_complete} size={140} strokeWidth={10}>
          <div className="text-center">
            <AnimatedNumber
              value={data.pct_complete}
              decimals={1}
              suffix="%"
              className="text-2xl font-bold"
            />
          </div>
        </ProgressRing>

        <div className="flex-1 space-y-3">
          <div>
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Przejechane</div>
            <div className="text-xl font-semibold">
              <AnimatedNumber value={data.actual_km} decimals={0} suffix=" km" />
            </div>
          </div>

          <div>
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Plan na dziś</div>
            <div className="text-base text-[var(--text-secondary)]">
              {formatKm(data.planned_km)} km
            </div>
          </div>

          <div>
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider">
              {isAhead ? "Zapas" : "Strata"}
            </div>
            <div className={`text-base font-medium ${isAhead ? "text-emerald-400" : "text-red-400"}`}>
              {isAhead ? "+" : ""}{formatKm(aheadBehind)} km
            </div>
          </div>

          <div>
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wider">Prognoza roczna</div>
            <div className="text-base text-[var(--text-secondary)]">
              {formatKm(data.projected_km)} km
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-4 pt-4 border-t border-[var(--border)]">
        <div>
          <div className="text-xs text-[var(--text-muted)]">Jazdy</div>
          <div className="text-sm font-medium">{data.actual_rides}</div>
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
