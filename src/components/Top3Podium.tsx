import Image from "next/image";
import { RankingEntry } from "@/types/database";
import { formatDistance, formatTime, getCountryFlag, formatNumber } from "@/lib/format";
import RankBadge from "@/components/RankBadge";

interface Top3PodiumProps {
  entries: RankingEntry[];
  metric: "distance" | "elevation" | "time" | "count";
  title: string;
  unit: string;
  label?: string;
}

function getValue(entry: RankingEntry, metric: Top3PodiumProps["metric"]): string {
  switch (metric) {
    case "distance": return formatDistance(entry.total_distance);
    case "elevation": return formatNumber(entry.total_elevation);
    case "time": return formatTime(entry.total_time);
    case "count": return entry.activity_count.toString();
  }
}

function getNumericValue(entry: RankingEntry, metric: Top3PodiumProps["metric"]): number {
  switch (metric) {
    case "distance": return entry.total_distance;
    case "elevation": return entry.total_elevation;
    case "time": return entry.total_time;
    case "count": return entry.activity_count;
  }
}

function sortEntries(entries: RankingEntry[], metric: Top3PodiumProps["metric"]): RankingEntry[] {
  return [...entries].sort((a, b) => {
    switch (metric) {
      case "distance": return b.total_distance - a.total_distance;
      case "elevation": return b.total_elevation - a.total_elevation;
      case "time": return b.total_time - a.total_time;
      case "count": return b.activity_count - a.activity_count;
    }
  });
}

const medalStyles = [
  { bg: "from-yellow-500/20 to-yellow-600/5", border: "border-yellow-500/30", text: "text-yellow-400", badge: "gradient-gold", label: "🥇" },
  { bg: "from-gray-400/20 to-gray-500/5", border: "border-gray-400/30", text: "text-gray-300", badge: "gradient-silver", label: "🥈" },
  { bg: "from-orange-700/20 to-orange-800/5", border: "border-orange-700/30", text: "text-orange-600", badge: "gradient-bronze", label: "🥉" },
];

export default function Top3Podium({ entries, metric, title, unit, label }: Top3PodiumProps) {
  const sorted = sortEntries(entries, metric)
    .filter(e => getNumericValue(e, metric) > 0)
    .slice(0, 3);

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-baseline gap-1.5">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-widest">{title}</h3>
          {label && <span className="text-xs text-gray-500">— {label}</span>}
        </div>
      </div>
      <div className="space-y-2">
        {[0, 1, 2].map((index) => {
          const entry = sorted[index];
          const medal = medalStyles[index];
          if (entry) {
            return (
              <div
                key={entry.user_id}
                className={`glass glass-hover rounded-xl p-3 bg-gradient-to-r ${medal.bg} border ${medal.border}`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-7 flex-shrink-0">
                    <RankBadge position={index + 1} showTrophyFrom={2} />
                  </span>
                  {entry.profile_medium ? (
                    <Image
                      src={entry.profile_medium}
                      alt={`${entry.firstname}`}
                      width={28}
                      height={28}
                      className="rounded-full object-cover flex-shrink-0 ring-1 ring-white/10"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-white/5 flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <a
                      href={`/athlete/${entry.user_id}`}
                      className="text-sm font-medium text-white/90 hover:text-white truncate block leading-tight"
                    >
                      {entry.firstname} {entry.lastname?.charAt(0)}.
                      {getCountryFlag(entry.country) && (
                        <span className="ml-1 text-xs">{getCountryFlag(entry.country)}</span>
                      )}
                    </a>
                  </div>
                  <span className={`text-sm font-bold ${medal.text} flex-shrink-0 whitespace-nowrap`}>
                    {getValue(entry, metric)}{unit && metric !== "time" && <span className="text-xs font-normal ml-0.5">{unit}</span>}
                  </span>
                </div>
              </div>
            );
          }
          return (
            <div
              key={`empty-${index}`}
              className={`glass rounded-xl p-3 bg-gradient-to-r ${medal.bg} border ${medal.border} opacity-50`}
            >
              <div className="flex items-center gap-3">
                <span className="flex items-center justify-center w-7 flex-shrink-0">
                  <RankBadge position={index + 1} showTrophyFrom={2} />
                </span>
                <div className="w-7 h-7 rounded-full bg-white/5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm text-gray-500 italic">Brak danych</span>
                </div>
                <span className="text-sm font-bold text-gray-600 flex-shrink-0">—</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
