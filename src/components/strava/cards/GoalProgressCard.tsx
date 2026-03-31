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
    <div
      className="h-full flex flex-col"
      style={{
        borderRadius: 16,
        background: "linear-gradient(145deg, #0a0a0a 0%, #111111 100%)",
        border: "1px solid rgba(255,255,255,0.07)",
        padding: "24px",
      }}
    >
      <h2 style={{ fontSize: 13, fontWeight: 500, color: "rgba(255,255,255,0.55)", marginBottom: 24 }}>
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
            <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>realizacji</div>
          </div>
        </ProgressRing>
      </div>

      {/* Statystyki w siatce 2×2 */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-4 flex-1">
        <div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>Przejechane</div>
          <div style={{ fontSize: 18, fontWeight: 600, color: "rgba(255,255,255,0.95)" }}>
            <AnimatedNumber value={data.actual_km} decimals={0} suffix=" km" />
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>Plan na dziś</div>
          <div style={{ fontSize: 18, color: "rgba(255,255,255,0.75)" }}>
            {formatKm(data.planned_km)} km
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>
            {isAhead ? "Zapas" : "Strata"}
          </div>
          <div style={{ fontSize: 18, fontWeight: 500, color: isAhead ? "#34d399" : "#f87171" }}>
            {isAhead ? "+" : ""}{formatKm(aheadBehind)} km
          </div>
        </div>

        <div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.07em", marginBottom: 2 }}>Prognoza roczna</div>
          <div style={{ fontSize: 18, color: "rgba(255,255,255,0.75)" }}>
            {formatKm(data.projected_km)} km
          </div>
        </div>
      </div>

      {/* Dolny pasek */}
      <div
        className="mt-5 grid grid-cols-3 gap-4 pt-4"
        style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Aktywne dni</div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.9)" }}>{data.active_days}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Godziny</div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.9)" }}>{formatHours(data.actual_hours)}</div>
        </div>
        <div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>Przewyższenia</div>
          <div style={{ fontSize: 14, fontWeight: 500, color: "rgba(255,255,255,0.9)" }}>{formatKm(data.actual_elevation)}m</div>
        </div>
      </div>
    </div>
  );
}
