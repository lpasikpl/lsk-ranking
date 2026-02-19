import Image from "next/image";
import { RankingEntry } from "@/types/database";
import { formatDistance, formatTime, getCountryFlag } from "@/lib/format";

interface RankingTableProps {
  entries: RankingEntry[];
}

export default function RankingTable({ entries }: RankingTableProps) {
  const totalDistance = entries.reduce((sum, e) => sum + e.total_distance, 0);
  const totalElevation = entries.reduce((sum, e) => sum + e.total_elevation, 0);
  const totalTime = entries.reduce((sum, e) => sum + e.total_time, 0);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="bg-gray-800 text-white">
            <th className="text-left py-3 px-4 font-semibold w-12">
              Poz.{" "}
              <span className="text-gray-400 font-normal text-xs">▼</span>
            </th>
            <th className="text-left py-3 px-4 font-semibold">
              Imię{" "}
              <span className="text-gray-400 font-normal text-xs">▼</span>
            </th>
            <th className="text-right py-3 px-4 font-semibold">
              Dystans{" "}
              <span className="text-gray-400 font-normal text-xs">(km)</span>
            </th>
            <th className="text-right py-3 px-4 font-semibold">
              Przewyż.{" "}
              <span className="text-gray-400 font-normal text-xs">(m)</span>
            </th>
            <th className="text-right py-3 px-4 font-semibold">
              Czas{" "}
              <span className="text-gray-400 font-normal text-xs">(h)</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {entries.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-8 text-center text-gray-400">
                Brak aktywności w wybranym okresie
              </td>
            </tr>
          ) : (
            entries.map((entry, index) => (
              <tr
                key={entry.user_id}
                className={`border-b border-gray-100 transition-colors hover:bg-blue-50 ${
                  index % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                }`}
              >
                <td className="py-3 px-4 text-gray-500 font-medium">{index + 1}</td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    {entry.profile_medium ? (
                      <Image
                        src={entry.profile_medium}
                        alt={`${entry.firstname} ${entry.lastname}`}
                        width={28}
                        height={28}
                        className="rounded-full object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-gray-200 flex-shrink-0" />
                    )}
                    <a
                      href={`https://www.strava.com/athletes/${entry.strava_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 hover:underline font-medium"
                    >
                      {entry.firstname} {entry.lastname}
                    </a>
                    {getCountryFlag(entry.country) && (
                      <span className="text-base leading-none">
                        {getCountryFlag(entry.country)}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-4 text-right font-semibold text-gray-800">
                  {formatDistance(entry.total_distance)}
                </td>
                <td className="py-3 px-4 text-right text-gray-700">
                  {Math.round(entry.total_elevation)}
                </td>
                <td className="py-3 px-4 text-right text-gray-700">
                  {formatTime(entry.total_time)}
                </td>
              </tr>
            ))
          )}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-gray-300 bg-gray-50 font-semibold">
            <td className="py-3 px-4" colSpan={2} />
            <td className="py-3 px-4 text-right text-gray-800">
              {formatDistance(totalDistance)}
            </td>
            <td className="py-3 px-4 text-right text-gray-800">
              {Math.round(totalElevation)}
            </td>
            <td className="py-3 px-4 text-right text-gray-800">
              {formatTime(totalTime)}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
