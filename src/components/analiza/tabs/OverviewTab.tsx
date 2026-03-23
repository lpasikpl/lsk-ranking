// Zakładka Podsumowanie - metryki + strefy mocy + wykres okrążeń + AI
"use client";
import MetricCard from "@/components/analiza/cards/MetricCard";
import PowerZonesBar from "@/components/analiza/charts/PowerZonesBar";
import LapComparisonChart from "@/components/analiza/charts/LapComparisonChart";
import AiCommentCard from "@/components/analiza/cards/AiCommentCard";

function fmtTime(s: number): string {
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  return `${m}:${String(sec).padStart(2, "0")}`;
}

interface OverviewTabProps {
  activity: any;
  fitData: any | null;
  laps: any[];
  aiComment: string | null;
}

export default function OverviewTab({ activity, fitData, laps, aiComment }: OverviewTabProps) {
  const distKm = ((activity.distance_meters ?? 0) / 1000).toFixed(1);
  const timeStr = fmtTime(activity.moving_time_seconds ?? 0);
  const avgPower = activity.average_watts;
  const np = activity.weighted_average_watts ?? activity.normalized_power;
  const tss = activity.effective_tss ?? activity.tss;
  const te = fitData?.training_effect_aerobic;
  const ate = fitData?.training_effect_anaerobic;

  const zoneSecs = [
    activity.power_z1_seconds ?? 0,
    activity.power_z2_seconds ?? 0,
    activity.power_z3_seconds ?? 0,
    activity.power_z4_seconds ?? 0,
    activity.power_z5_seconds ?? 0,
    activity.power_z6_seconds ?? 0,
    activity.power_z7_seconds ?? 0,
  ];

  return (
    <div className="space-y-6">
      {/* Karty metryczne */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <MetricCard label="Dystans" value={distKm} unit="km" />
        <MetricCard
          label="Czas jazdy"
          value={timeStr}
          subtitle={`${Math.round((activity.moving_time_seconds ?? 0) / 60)} min`}
        />
        <MetricCard
          label="Avg / NP"
          value={avgPower ? `${Math.round(avgPower)}` : "-"}
          unit="W"
          subtitle={np ? `NP: ${Math.round(np)}W  IF: ${activity.intensity_factor?.toFixed(2) ?? "-"}` : undefined}
        />
        <MetricCard
          label="TSS"
          value={tss ? Math.round(tss) : "-"}
          subtitle={te != null ? `TE: ${te} / ATE: ${ate ?? "-"}` : undefined}
          highlight
        />
        <MetricCard
          label="Avg HR"
          value={activity.average_heartrate ? Math.round(activity.average_heartrate) : "-"}
          unit="bpm"
          subtitle={activity.max_heartrate ? `Max: ${activity.max_heartrate} bpm` : undefined}
        />
        <MetricCard
          label="Praca"
          value={fitData?.total_work_kj ? Math.round(fitData.total_work_kj) : "-"}
          unit="kJ"
          subtitle={activity.total_elevation_gain ? `+${Math.round(activity.total_elevation_gain)} m` : undefined}
        />
      </div>

      {/* Strefy mocy */}
      {zoneSecs.some(s => s > 0) && (
        <div
          className="rounded-xl p-4"
          style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <h3 className="text-sm font-semibold mb-3" style={{ color: "rgba(255,255,255,0.7)" }}>
            Strefy mocy
          </h3>
          <PowerZonesBar zoneSecs={zoneSecs} />
        </div>
      )}

      {/* Wykres okrążeń */}
      {laps.length > 0 && (
        <div
          className="rounded-xl p-4"
          style={{ background: "#111", border: "1px solid rgba(255,255,255,0.08)" }}
        >
          <h3 className="text-sm font-semibold mb-3" style={{ color: "rgba(255,255,255,0.7)" }}>
            Porownanie okrazen
          </h3>
          <LapComparisonChart laps={laps} />
        </div>
      )}

      {/* Komentarz AI */}
      <AiCommentCard comment={aiComment} section="overview" />
    </div>
  );
}
