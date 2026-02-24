"use client";

import Image from "next/image";
import { useState } from "react";
import {
  SeasonData,
  MonthBreakdown,
  SEASON_MONTHS,
  MONTH_NAMES,
  MONTH_SHORT,
  EFFORT_DISTANCES,
  EFFORT_WEIGHTS,
  POINTS_SCALE,
  Athlete,
} from "@/lib/competition-types";

interface Props {
  data: SeasonData;
  currentYear: number;
  selectedYear: number;
}

function formatDist(meters: number): string {
  return (meters / 1000).toFixed(1) + " km";
}

function Tooltip({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <span className="relative group/tip inline-block">
      {children}
      <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 z-50 hidden group-hover/tip:block">
        <span className="whitespace-nowrap rounded-lg bg-gray-900 border border-white/10 px-2.5 py-1.5 text-xs text-gray-200 shadow-xl">
          {text}
        </span>
      </span>
    </span>
  );
}

function formatEffortTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatPoints(pts: number): string {
  if (pts === 0) return "—";
  return Number.isInteger(pts) ? String(pts) : pts.toFixed(1);
}

function AthleteAvatar({ athlete }: { athlete: Athlete }) {
  return athlete.profileMedium ? (
    <Image src={athlete.profileMedium} alt="" width={24} height={24} className="rounded-full flex-shrink-0" />
  ) : (
    <div className="w-6 h-6 rounded-full bg-white/10 flex-shrink-0" />
  );
}

function RankBadgeSmall({ position }: { position: number }) {
  if (position === 1) return <span className="text-yellow-400 font-black text-sm">1</span>;
  if (position === 2) return <span className="text-gray-300 font-black text-sm">2</span>;
  if (position === 3) return <span className="text-orange-600 font-black text-sm">3</span>;
  return <span className="text-gray-500 text-sm">{position}</span>;
}

// ===================== TOTAL VIEW =====================

function TotalView({
  data,
  onSelectAthlete,
  expandedAthlete,
}: {
  data: SeasonData;
  onSelectAthlete: (uid: string) => void;
  expandedAthlete: string | null;
}) {
  const { athletes, totalScores, monthScores } = data;

  const sorted = [...athletes]
    .filter((a) => totalScores[a.userId] > 0)
    .sort((a, b) => (totalScores[b.userId] ?? 0) - (totalScores[a.userId] ?? 0));

  // Also include athletes with 0 but show them at bottom if they exist
  const zeroes = athletes.filter((a) => !totalScores[a.userId]);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs min-w-[600px]">
        <thead>
          <tr className="text-gray-400 uppercase tracking-widest border-b border-white/[0.06]">
            <th className="text-left pb-3 pr-3 w-8">#</th>
            <th className="text-left pb-3 pr-4">Zawodnik</th>
            {SEASON_MONTHS.map((m) => (
              <th key={m} className="text-right pb-3 px-2 w-10">{MONTH_SHORT[m]}</th>
            ))}
            <th className="text-right pb-3 pl-3 w-14 text-orange-400">Suma</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((athlete, idx) => {
            const isExpanded = expandedAthlete === athlete.userId;
            const total = totalScores[athlete.userId] ?? 0;

            return [
              <tr
                key={athlete.userId}
                onClick={() => onSelectAthlete(athlete.userId)}
                className={`border-b border-white/[0.04] cursor-pointer transition-colors ${
                  isExpanded ? "bg-orange-500/5" : "hover:bg-white/[0.03]"
                }`}
              >
                <td className="py-3 pr-3">
                  <RankBadgeSmall position={idx + 1} />
                </td>
                <td className="py-3 pr-4">
                  <div className="flex items-center gap-2">
                    <AthleteAvatar athlete={athlete} />
                    <span className="text-white/80 font-medium">
                      {athlete.firstname} {athlete.lastname?.charAt(0)}.
                    </span>
                  </div>
                </td>
                {SEASON_MONTHS.map((m) => {
                  const score = monthScores[athlete.userId]?.[m] ?? 0;
                  return (
                    <td key={m} className="py-3 px-2 text-right tabular-nums">
                      <span className={score > 0 ? "text-white/70" : "text-gray-600"}>
                        {score > 0 ? formatPoints(score) : "—"}
                      </span>
                    </td>
                  );
                })}
                <td className="py-3 pl-3 text-right tabular-nums font-bold text-orange-400">
                  {formatPoints(total)}
                </td>
              </tr>,
              isExpanded && (
                <tr key={`${athlete.userId}-expand`} className="bg-orange-500/[0.03]">
                  <td colSpan={9 + 2} className="pb-4 pt-2 px-4">
                    <TotalBreakdown data={data} athlete={athlete} />
                  </td>
                </tr>
              ),
            ];
          })}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <div className="text-center text-gray-500 py-12 text-sm">Brak danych dla tego sezonu</div>
      )}
    </div>
  );
}

function TotalBreakdown({ data, athlete }: { data: SeasonData; athlete: Athlete }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
      {SEASON_MONTHS.map((m) => {
        const monthData = data.months.find((md) => md.month === m);
        const bd = monthData?.breakdown[athlete.userId];
        const score = data.monthScores[athlete.userId]?.[m] ?? 0;

        return (
          <div key={m} className="glass rounded-xl p-3 border border-white/[0.06]">
            <div className="text-xs text-gray-400 font-semibold mb-2">{MONTH_SHORT[m]}</div>
            {bd && score > 0 ? (
              <div className="space-y-1">
                {bd.distance && (
                  <BreakdownRow label="Dyst." value={bd.distance.points} pos={bd.distance.position} />
                )}
                {bd.activeDays.bonus > 0 && (
                  <BreakdownRow label="Dni" value={bd.activeDays.bonus} pos={null} />
                )}
                {bd.elevation && (
                  <BreakdownRow label="Przewyż." value={bd.elevation.points} pos={bd.elevation.position} />
                )}
                {EFFORT_DISTANCES.map((d) => {
                  const e = bd.efforts[d];
                  if (!e) return null;
                  return <BreakdownRow key={d} label={d} value={e.points} pos={e.position} />;
                })}
                {bd.longestRide && (
                  <BreakdownRow label="Bonus" value={bd.longestRide.bonus} pos={null} />
                )}
                <div className="border-t border-white/10 pt-1 mt-1 flex justify-between">
                  <span className="text-gray-400">Suma</span>
                  <span className="text-orange-400 font-bold">{formatPoints(score)}</span>
                </div>
              </div>
            ) : (
              <div className="text-gray-600 text-xs">brak</div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  pos,
}: {
  label: string;
  value: number;
  pos: number | null;
}) {
  return (
    <div className="flex justify-between items-center gap-1">
      <span className="text-gray-500 truncate">{label}</span>
      <div className="flex items-center gap-1 flex-shrink-0">
        {pos !== null && <span className="text-gray-600 text-[10px]">#{pos}</span>}
        <span className="text-white/70 tabular-nums">{formatPoints(value)}</span>
      </div>
    </div>
  );
}

// ===================== MONTHLY VIEW =====================

function MonthView({
  data,
  month,
  onSelectAthlete,
  expandedAthlete,
}: {
  data: SeasonData;
  month: number;
  onSelectAthlete: (uid: string) => void;
  expandedAthlete: string | null;
}) {
  const monthData = data.months.find((m) => m.month === month);

  if (!monthData || Object.keys(monthData.scores).length === 0) {
    return (
      <div className="text-center text-gray-500 py-16">
        <div className="text-2xl mb-2">📭</div>
        <div>Brak danych za {MONTH_NAMES[month]}</div>
      </div>
    );
  }

  const athleteMap = Object.fromEntries(data.athletes.map((a) => [a.userId, a]));

  const sorted = Object.entries(monthData.scores)
    .filter(([, score]) => score > 0)
    .sort(([, a], [, b]) => b - a);

  return (
    <div>
      {/* Main ranking table */}
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[620px]">
          <thead>
            <tr className="text-gray-400 uppercase tracking-widest border-b border-white/[0.06]">
              <th className="text-left pb-3 pr-3 w-8">#</th>
              <th className="text-left pb-3 pr-4">Zawodnik</th>
              <th className="text-right pb-3 px-2">Dyst.</th>
              <th className="text-right pb-3 px-2">Przewyż.</th>
              {EFFORT_DISTANCES.map((d) => (
                <th key={d} className="text-right pb-3 px-1 text-[10px]">{d.replace(" km", "k")}</th>
              ))}
              <th className="text-right pb-3 px-2 text-green-400">Bonus</th>
              <th className="text-right pb-3 pl-3 text-orange-400">Suma</th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(([userId, total], idx) => {
              const athlete = athleteMap[userId];
              const bd = monthData.breakdown[userId];
              const isExpanded = expandedAthlete === userId;

              if (!athlete) return null;

              const bonusTotal = (bd?.activeDays.bonus ?? 0) + (bd?.longestRide?.bonus ?? 0);
              const bonusParts: string[] = [];
              if (bd?.activeDays.bonus) bonusParts.push(`Aktywne dni: ${bd.activeDays.count} dni (+${bd.activeDays.bonus})`);
              if (bd?.longestRide) bonusParts.push(`Najdłuższa jazda: ${formatDist(bd.longestRide.distance)} (+${bd.longestRide.bonus})`);

              return [
                <tr
                  key={userId}
                  onClick={() => onSelectAthlete(userId)}
                  className={`border-b border-white/[0.04] cursor-pointer transition-colors ${
                    isExpanded ? "bg-orange-500/5" : "hover:bg-white/[0.03]"
                  }`}
                >
                  <td className="py-3 pr-3">
                    <RankBadgeSmall position={idx + 1} />
                  </td>
                  <td className="py-3 pr-4">
                    <div className="flex items-center gap-2">
                      <AthleteAvatar athlete={athlete} />
                      <span className="text-white/80 font-medium">
                        {athlete.firstname} {athlete.lastname?.charAt(0)}.
                      </span>
                    </div>
                  </td>
                  <td className="py-3 px-2 text-right tabular-nums">
                    <PointsCell
                      score={bd?.distance}
                      tip={bd?.distance ? `${formatDist(bd.distance.value)} — miejsce #${bd.distance.position}` : undefined}
                    />
                  </td>
                  <td className="py-3 px-2 text-right tabular-nums">
                    <PointsCell
                      score={bd?.elevation}
                      tip={bd?.elevation ? `${Math.round(bd.elevation.value)} m — miejsce #${bd.elevation.position}` : undefined}
                    />
                  </td>
                  {EFFORT_DISTANCES.map((d) => (
                    <td key={d} className="py-3 px-1 text-right tabular-nums">
                      <PointsCell
                        score={bd?.efforts[d]}
                        tip={bd?.efforts[d] ? `${formatEffortTime(bd.efforts[d]!.value)} — miejsce #${bd.efforts[d]!.position}` : undefined}
                      />
                    </td>
                  ))}
                  <td className="py-3 px-2 text-right tabular-nums">
                    {bonusTotal > 0 ? (
                      <Tooltip text={bonusParts.join(" | ")}>
                        <span className="text-green-400 font-medium">+{bonusTotal}</span>
                      </Tooltip>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="py-3 pl-3 text-right tabular-nums font-bold text-orange-400">
                    {formatPoints(total)}
                  </td>
                </tr>,
                isExpanded && bd && (
                  <tr key={`${userId}-expand`} className="bg-orange-500/[0.03]">
                    <td colSpan={11} className="pb-5 pt-3 px-4">
                      <MonthDetailExpanded bd={bd} athlete={athlete} month={month} />
                    </td>
                  </tr>
                ),
              ];
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PointsCell({ score, tip }: { score?: { points: number; position: number } | null; tip?: string }) {
  if (!score || score.points === 0) return <span className="text-gray-600">—</span>;
  const inner = (
    <span className="text-white/70">
      {formatPoints(score.points)}
      <span className="text-gray-600 text-[10px] ml-0.5">#{score.position}</span>
    </span>
  );
  return tip ? <Tooltip text={tip}>{inner}</Tooltip> : inner;
}

function MonthDetailExpanded({
  bd,
  athlete,
  month,
}: {
  bd: MonthBreakdown;
  athlete: Athlete;
  month: number;
}) {
  return (
    <div className="glass rounded-2xl p-4 border border-white/[0.08]">
      <div className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-4">
        {athlete.firstname} {athlete.lastname?.charAt(0)}. — {MONTH_NAMES[month]}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
        <DetailCard
          label="Dystans"
          rawValue={bd.distance ? formatDist(bd.distance.value) : "—"}
          position={bd.distance?.position ?? null}
          basePoints={bd.distance?.basePoints ?? 0}
          weight={1.0}
          points={bd.distance?.points ?? 0}
        />
        <DetailCard
          label="Przewyższenia"
          rawValue={bd.elevation ? `${Math.round(bd.elevation.value)} m` : "—"}
          position={bd.elevation?.position ?? null}
          basePoints={bd.elevation?.basePoints ?? 0}
          weight={1.0}
          points={bd.elevation?.points ?? 0}
        />
        {EFFORT_DISTANCES.map((d) => {
          const e = bd.efforts[d];
          return (
            <DetailCard
              key={d}
              label={`Najszybsze ${d}`}
              rawValue={e ? formatEffortTime(e.value) : "—"}
              position={e?.position ?? null}
              basePoints={e?.basePoints ?? 0}
              weight={EFFORT_WEIGHTS[d]}
              points={e?.points ?? 0}
              stravaActivityId={e?.stravaActivityId}
            />
          );
        })}
        <div className={`glass rounded-xl p-3 border ${bd.activeDays.bonus > 0 ? "border-green-500/20" : "border-white/[0.06]"}`}>
          <div className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-2">Aktywne dni</div>
          {bd.activeDays.count > 0 ? (
            <>
              <div className="text-xl font-black text-white mb-1">{bd.activeDays.count} <span className="text-sm font-normal text-white/40">dni</span></div>
              <div className="text-xs text-white/40">Miejsce: <span className="text-white/80">{bd.activeDays.bonus > 0 ? 4 - bd.activeDays.bonus : "—"}</span></div>
              <div className={`mt-1 text-sm font-bold ${bd.activeDays.bonus > 0 ? "text-green-400" : "text-white/20"}`}>
                {bd.activeDays.bonus > 0 ? `+${bd.activeDays.bonus} pkt` : "0 pkt"}
              </div>
            </>
          ) : (
            <div className="text-white/20 text-sm">—</div>
          )}
        </div>
        {bd.longestRide ? (
          <a
            href={`https://www.strava.com/activities/${bd.longestRide.stravaId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="glass rounded-xl p-3 border border-green-500/20 hover:border-green-500/50 hover:bg-white/[0.04] transition-colors block"
          >
            <div className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-2">Najdłuższa jazda</div>
            <div className="text-xl font-black text-white mb-1">{formatDist(bd.longestRide.distance)}</div>
            <div className="text-xs text-white/40">Miejsce: <span className="text-white/80">{4 - bd.longestRide.bonus}</span></div>
            <div className="mt-1 flex items-center justify-between">
              <span className="text-sm font-bold text-green-400">+{bd.longestRide.bonus} pkt</span>
              <span className="text-[10px] text-orange-400">↗ Strava</span>
            </div>
          </a>
        ) : (
          <div className="glass rounded-xl p-3 border border-white/[0.06]">
            <div className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-2">Najdłuższa jazda</div>
            <div className="text-white/20 text-sm">—</div>
            <div className="mt-1 text-sm font-bold text-white/20">0 pkt</div>
          </div>
        )}
      </div>
    </div>
  );
}

function DetailCard({
  label, rawValue, position, basePoints, weight, points, stravaActivityId,
}: {
  label: string; rawValue: string; position: number | null;
  basePoints: number; weight: number; points: number; stravaActivityId?: number;
}) {
  const empty = position === null || points === 0;
  const inner = (
    <>
      <div className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-2 leading-tight">{label}</div>
      <div className={`text-xl font-black mb-1.5 ${empty ? "text-white/20" : "text-white"}`}>{rawValue}</div>
      <div className="text-xs text-white/40">Miejsce: <span className={empty ? "text-white/20" : "text-white/80"}>{position ?? "—"}</span></div>
      <div className="text-xs text-white/40 mt-0.5">
        {empty ? <span className="text-white/20">0 pkt</span> : <>{basePoints} × {weight} = <span className="text-orange-400 font-bold">{formatPoints(points)} pkt</span></>}
      </div>
      {stravaActivityId && <div className="text-[10px] text-orange-400 mt-1.5">↗ Strava</div>}
    </>
  );
  if (stravaActivityId) {
    return (
      <a href={`https://www.strava.com/activities/${stravaActivityId}`} target="_blank" rel="noopener noreferrer"
        className="glass rounded-xl p-3 border border-white/[0.06] hover:border-orange-500/30 hover:bg-white/[0.04] transition-colors block">
        {inner}
      </a>
    );
  }
  return <div className="glass rounded-xl p-3 border border-white/[0.06]">{inner}</div>;
}

// ===================== SCORING LEGEND =====================

const PLACE_MEDAL = ["text-yellow-400", "text-gray-300", "text-orange-500"];

function ScoringLegend() {
  const [open, setOpen] = useState(false);
  return (
    <div className="mb-6">
      <button
        onClick={() => setOpen((v) => !v)}
        className="text-xs text-gray-400 hover:text-gray-300 flex items-center gap-1 transition-colors"
      >
        <span className={`transition-transform ${open ? "rotate-90" : ""}`}>▶</span>
        Zasady punktacji
      </button>
      {open && (
        <div className="mt-3 glass rounded-2xl border border-white/[0.06] overflow-hidden">
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-white/[0.06]">

            {/* Skala punktów */}
            <div className="p-4">
              <div className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Skala punktów — miejsca 1–10</div>
              <table className="w-full text-xs">
                <tbody>
                  {Array.from({ length: 5 }, (_, i) => (
                    <tr key={i} className="border-b border-white/[0.04] last:border-0">
                      <td className="py-1.5 pr-4 w-1/2">
                        <span className={`font-black mr-1.5 ${PLACE_MEDAL[i] ?? "text-white/50"}`}>{i + 1}</span>
                        <span className="text-white/60">miejsce</span>
                        <span className="text-orange-400 font-bold ml-auto float-right">{POINTS_SCALE[i]} pkt</span>
                      </td>
                      <td className="py-1.5 pl-4 border-l border-white/[0.04]">
                        <span className={`font-black mr-1.5 ${PLACE_MEDAL[i + 5] ?? "text-white/50"}`}>{i + 6}</span>
                        <span className="text-white/60">miejsce</span>
                        <span className="text-orange-400 font-bold ml-auto float-right">{POINTS_SCALE[i + 5]} pkt</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Kategorie */}
            <div className="p-4">
              <div className="text-xs font-semibold text-white/40 uppercase tracking-widest mb-3">Kategorie i wagi</div>
              <table className="w-full text-xs">
                <tbody>
                  {[
                    { label: "Dystans miesięczny", weight: "×1.0", green: false },
                    { label: "Suma przewyższeń", weight: "×1.0", green: false },
                    ...EFFORT_DISTANCES.map(d => ({ label: `Najszybsze ${d}`, weight: `×${EFFORT_WEIGHTS[d]}`, green: false })),
                    { label: "Aktywne dni", weight: "+3 / +2 / +1", green: true },
                    { label: "Najdłuższa jazda", weight: "+3 / +2 / +1", green: true },
                  ].map((row, i) => (
                    <tr key={i} className="border-b border-white/[0.04] last:border-0">
                      <td className="py-1.5 text-white/70">{row.label}</td>
                      <td className={`py-1.5 text-right font-bold ${row.green ? "text-green-400" : "text-orange-400"}`}>{row.weight}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// ===================== MAIN COMPONENT =====================

export default function RywalizacjaClient({ data, currentYear, selectedYear }: Props) {
  const [activeTab, setActiveTab] = useState<number | "total">("total");
  const [expandedAthlete, setExpandedAthlete] = useState<string | null>(null);

  const now = new Date();
  const isCurrentSeason = selectedYear === currentYear;
  const seasonActive =
    isCurrentSeason && now.getMonth() + 1 >= 3 && now.getMonth() + 1 <= 9;
  const seasonNotStarted = isCurrentSeason && now.getMonth() + 1 < 3;

  const handleSelectAthlete = (uid: string) => {
    setExpandedAthlete((prev) => (prev === uid ? null : uid));
  };

  const handleTabChange = (tab: number | "total") => {
    setActiveTab(tab);
    setExpandedAthlete(null);
  };

  return (
    <div>
      <div className="mb-5 p-4 glass rounded-2xl border border-white/[0.06]">
        <p className="text-sm text-gray-400 leading-relaxed">
          <span className="text-white font-semibold">Pre-Rywalizacja</span> to rozgrzewka przed właściwym sezonem.
          Sprawdź jak działa system punktacji, przetestuj kategorie i przyzwyczaj się do rywalizacji z kolegami z grupy.
          Punkty zdobyte w tym okresie nie liczą się do wyników sezonu głównego.{" "}
          <span className="text-orange-400">Rywalizacja 2026 startuje 1 kwietnia i potrwa do 30 września.</span>
        </p>
      </div>
      <ScoringLegend />

      {/* Tab bar */}
      <div className="flex gap-1 flex-wrap mb-6">
        <TabButton active={activeTab === "total"} onClick={() => handleTabChange("total")}>
          Total
        </TabButton>
        {SEASON_MONTHS.map((m) => (
          <TabButton
            key={m}
            active={activeTab === m}
            onClick={() => handleTabChange(m)}
          >
            {MONTH_SHORT[m]}
          </TabButton>
        ))}
      </div>

      {/* Content */}
      <div className="glass rounded-2xl border border-white/[0.06] p-4 sm:p-6">
        {activeTab === "total" ? (
          <>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
              Klasyfikacja generalna — Sezon {selectedYear}
            </div>
            <TotalView
              data={data}
              onSelectAthlete={handleSelectAthlete}
              expandedAthlete={expandedAthlete}
            />
          </>
        ) : (
          <>
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
              {MONTH_NAMES[activeTab]} {selectedYear}
            </div>
            <MonthView
              data={data}
              month={activeTab}
              onSelectAthlete={handleSelectAthlete}
              expandedAthlete={expandedAthlete}
            />
          </>
        )}
      </div>

    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
        active
          ? "bg-orange-500 text-white"
          : "glass text-gray-400 hover:text-white hover:bg-white/[0.08]"
      }`}
    >
      {children}
    </button>
  );
}
