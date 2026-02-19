import Image from "next/image";
import { RankingEntry } from "@/types/database";
import { formatDistance, formatTime, getCountryFlag, formatNumber } from "@/lib/format";

interface Top3PodiumProps {
  entries: RankingEntry[];
  metric: "distance" | "elevation" | "time" | "count";
  title: string;
  unit: string;
}

function getValue(entry: RankingEntry, metric: Top3PodiumProps["metric"]): string {
  switch (metric) {
    case "distance": return formatDistance(entry.total_distance);
    case "elevation": return formatNumber(entry.total_elevation);
    case "time": return formatTime(entry.total_time);
    case "count": return entry.activity_count.toString();
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

export default function Top3Podium({ entries, metric, title, unit }: Top3PodiumProps) {
  const sorted = sortEntries(entries, metric).slice(0, 3);

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{title}</h3>
        <span className="text-xs text-gray-600">{unit}</span>
      </div>
      <div className="space-y-2">
        {sorted.length === 0 ? (
          <div className="text-center py-6 text-gray-600 text-sm">Brak danych</div>
        ) : (
          sorted.map((entry, index) => {
            const medal = medalStyles[index];
            return (
              <div
                key={entry.user_id}
                className={`glass glass-hover rounded-xl p-3 bg-gradient-to-r ${medal.bg} border ${medal.border}`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg leading-none w-6 text-center flex-shrink-0">{medal.label}</span>
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
                  <span className={`text-sm font-bold ${medal.text} flex-shrink-0`}>
                    {getValue(entry, metric)}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
