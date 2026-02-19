import Image from "next/image";
import { RankingEntry } from "@/types/database";
import { formatDistance, formatTime, getCountryFlag } from "@/lib/strava";

interface Top3TableProps {
  title: string;
  entries: RankingEntry[];
  metric: "distance" | "elevation" | "time";
}

function getValue(entry: RankingEntry, metric: "distance" | "elevation" | "time"): string {
  switch (metric) {
    case "distance":
      return formatDistance(entry.total_distance);
    case "elevation":
      return Math.round(entry.total_elevation).toString();
    case "time":
      return formatTime(entry.total_time);
  }
}

function getUnit(metric: "distance" | "elevation" | "time"): string {
  switch (metric) {
    case "distance":
      return "km";
    case "elevation":
      return "m";
    case "time":
      return "h";
  }
}

function sortEntries(entries: RankingEntry[], metric: "distance" | "elevation" | "time"): RankingEntry[] {
  return [...entries].sort((a, b) => {
    switch (metric) {
      case "distance":
        return b.total_distance - a.total_distance;
      case "elevation":
        return b.total_elevation - a.total_elevation;
      case "time":
        return b.total_time - a.total_time;
    }
  });
}

export default function Top3Table({ title, entries, metric }: Top3TableProps) {
  const sorted = sortEntries(entries, metric).slice(0, 3);
  const unit = getUnit(metric);

  return (
    <div className="flex-1 min-w-0">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-800 text-white">
            <th className="text-left py-2 px-3 font-semibold w-10">Poz.</th>
            <th className="text-left py-2 px-3 font-semibold">Imię</th>
            <th className="text-right py-2 px-3 font-semibold whitespace-nowrap">
              {title}{" "}
              <span className="font-normal text-gray-400 text-xs">({unit})</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.length === 0 ? (
            <tr>
              <td colSpan={3} className="py-4 px-3 text-center text-gray-400 text-xs">
                Brak danych
              </td>
            </tr>
          ) : (
            sorted.map((entry, index) => (
              <tr
                key={entry.user_id}
                className={`border-b border-gray-100 ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
              >
                <td className="py-2 px-3 text-gray-500 font-medium">{index + 1}</td>
                <td className="py-2 px-3">
                  <div className="flex items-center gap-2">
                    {entry.profile_medium ? (
                      <Image
                        src={entry.profile_medium}
                        alt={`${entry.firstname} ${entry.lastname}`}
                        width={24}
                        height={24}
                        className="rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-gray-200 flex-shrink-0" />
                    )}
                    <a
                      href={`https://www.strava.com/athletes/${entry.strava_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline truncate"
                    >
                      {entry.firstname} {entry.lastname}
                    </a>
                    {getCountryFlag(entry.country) && (
                      <span className="text-base">{getCountryFlag(entry.country)}</span>
                    )}
                  </div>
                </td>
                <td className="py-2 px-3 text-right font-semibold text-gray-800">
                  {getValue(entry, metric)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
