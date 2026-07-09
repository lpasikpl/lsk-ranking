"use client";

import type { GarminDaily } from "@/lib/strava-types";
import { GarminStatCard } from "./GarminStatCard";
import { HrvTrendChart } from "./HrvTrendChart";
import { SleepStagesChart } from "./SleepStagesChart";
import { ReadinessRhrChart } from "./ReadinessRhrChart";

interface Props {
  data: GarminDaily[];
}

// zwraca [ostatnia niepusta wartość, poprzednia niepusta] dla danego pola
function lastTwo(data: GarminDaily[], sel: (d: GarminDaily) => number | null): [number | null, number | null] {
  const vals = data.map(sel).filter((v): v is number => v != null);
  return [vals.at(-1) ?? null, vals.at(-2) ?? null];
}
function lastStr(data: GarminDaily[], sel: (d: GarminDaily) => string | null): string | null {
  for (let i = data.length - 1; i >= 0; i--) {
    const v = sel(data[i]);
    if (v) return v;
  }
  return null;
}

const HRV_COLORS: Record<string, string> = {
  BALANCED: "#4ade80", LOW: "#fbbf24", UNBALANCED: "#f87171", POOR: "#f87171",
};
const LEVEL_COLORS: Record<string, string> = {
  HIGH: "#4ade80", MAXIMUM: "#4ade80", MODERATE: "#fbbf24", LOW: "#fb923c", POOR: "#f87171",
};
function scoreColor(s: number | null): string {
  if (s == null) return "rgba(255,255,255,0.4)";
  if (s >= 80) return "#4ade80";
  if (s >= 60) return "#fbbf24";
  return "#f87171";
}
function hm(s: number | null) {
  if (s == null) return undefined;
  const t = Math.round(s / 60);
  return `${Math.floor(t / 60)}h ${t % 60}min`;
}

export function GarminSection({ data }: Props) {
  if (!data || data.length === 0) {
    return (
      <div style={{
        borderRadius: 16, background: "linear-gradient(145deg, #0a0a0a 0%, #111111 100%)",
        border: "1px solid rgba(255,255,255,0.06)", padding: "24px",
        color: "rgba(255,255,255,0.4)", fontSize: 13,
      }}>
        Brak danych z Garmin. Uruchom backfill lub poczekaj na codzienną synchronizację (~8:30).
      </div>
    );
  }

  const [hrv, hrvPrev] = lastTwo(data, (d) => d.hrv_last_night);
  const [rhr, rhrPrev] = lastTwo(data, (d) => d.resting_hr);
  const [ready, readyPrev] = lastTwo(data, (d) => d.readiness_score);
  const [sleep, sleepPrev] = lastTwo(data, (d) => d.sleep_score);
  const [weekly] = lastTwo(data, (d) => d.hrv_weekly_avg);

  const hrvStatus = lastStr(data, (d) => d.hrv_status);
  const readyLevel = lastStr(data, (d) => d.readiness_level);
  const lastSleepSec = [...data].reverse().find((d) => d.sleep_seconds != null)?.sleep_seconds ?? null;
  const lastDate = data.at(-1)?.calendar_date ?? "";

  return (
    <div className="space-y-6">
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8, flexWrap: "wrap" }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: "rgba(255,255,255,0.85)", margin: 0 }}>
          Garmin — regeneracja i sen
        </h2>
        <span style={{ fontSize: 12, color: "rgba(255,255,255,0.3)" }}>ostatni dzień: {lastDate}</span>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <GarminStatCard
          label="HRV nocne" value={hrv} unit=" ms" prevValue={hrvPrev}
          status={hrvStatus} statusColor={hrvStatus ? (HRV_COLORS[hrvStatus] ?? "rgba(255,255,255,0.4)") : undefined}
          sub={weekly != null ? `śr. 7d ${weekly}` : undefined}
        />
        <GarminStatCard
          label="Tętno spoczynkowe" value={rhr} unit=" bpm" prevValue={rhrPrev} invert
        />
        <GarminStatCard
          label="Gotowość treningowa" value={ready} prevValue={readyPrev}
          status={readyLevel} statusColor={readyLevel ? (LEVEL_COLORS[readyLevel] ?? "rgba(255,255,255,0.4)") : undefined}
        />
        <GarminStatCard
          label="Sen — score" value={sleep} prevValue={sleepPrev}
          statusColor={scoreColor(sleep)} status={sleep != null ? (sleep >= 80 ? "dobry" : sleep >= 60 ? "ok" : "słaby") : undefined}
          sub={hm(lastSleepSec)}
        />
      </div>

      <HrvTrendChart data={data} />
      <ReadinessRhrChart data={data} />
      <SleepStagesChart data={data} />
    </div>
  );
}
