"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { RankingEntry } from "@/types/database";
import { formatDistance, formatTime, getCountryFlag, formatNumber } from "@/lib/format";
import RankBadge from "@/components/RankBadge";

interface RankingTableDarkProps {
  entries: RankingEntry[];
  isAdmin?: boolean;
}

export default function RankingTableDark({ entries, isAdmin }: RankingTableDarkProps) {
  const router = useRouter();
  const [removing, setRemoving] = useState<string | null>(null);
  const [localEntries, setLocalEntries] = useState(entries);

  const maxDistance = localEntries[0]?.total_distance || 1;
  const totalDistance = localEntries.reduce((sum, e) => sum + e.total_distance, 0);
  const totalElevation = localEntries.reduce((sum, e) => sum + e.total_elevation, 0);
  const totalTime = localEntries.reduce((sum, e) => sum + e.total_time, 0);

  const positionStyle = (index: number) => {
    if (index === 0) return "text-yellow-400 font-bold";
    if (index === 1) return "text-gray-300 font-bold";
    if (index === 2) return "text-orange-600 font-bold";
    return "text-gray-400";
  };

  const handleRemove = async (userId: string, name: string) => {
    if (!confirm(`Usunąć ${name} z rankingu?`)) return;
    setRemoving(userId);

    const res = await fetch(`/api/admin/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: false }),
    });

    if (res.ok) {
      setLocalEntries(prev => prev.filter(e => e.user_id !== userId));
    }
    setRemoving(null);
  };

  const gridCols = isAdmin
    ? "grid-cols-[36px_1fr_64px_90px_32px] sm:grid-cols-[40px_1fr_90px_80px_110px_32px]"
    : "grid-cols-[36px_1fr_64px_90px] sm:grid-cols-[40px_1fr_90px_80px_110px]";

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Header */}
      <div className={`grid ${gridCols} gap-0 px-3 sm:px-4 py-3 border-b border-white/5`}>
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">#</div>
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Zawodnik</div>
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Dystans</div>
        <div className="hidden sm:block text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Przewyż.</div>
        <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider text-right">Czas</div>
        {isAdmin && <div />}
      </div>

      {/* Rows */}
      {localEntries.length === 0 ? (
        <div className="py-16 text-center text-gray-400">
          <div className="text-4xl mb-3">🚴</div>
          <div>Brak aktywności w wybranym okresie</div>
        </div>
      ) : (
        <div>
          {localEntries.map((entry, index) => {
            const barWidth = Math.max(2, (entry.total_distance / maxDistance) * 100);
            return (
              <div
                key={entry.user_id}
                className="group relative px-3 sm:px-4 py-2.5 border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors"
              >
                <div
                  className="absolute left-0 top-0 bottom-0 opacity-[0.03] bg-gradient-to-r from-orange-500 to-transparent pointer-events-none"
                  style={{ width: `${barWidth}%` }}
                />

                <div className={`grid ${gridCols} gap-0 items-center relative`}>
                  <div className="flex items-center justify-start w-10">
                    {index + 1 <= 10 ? (
                      <RankBadge position={index + 1} showTrophyFrom={2} />
                    ) : (
                      <span className="text-sm text-gray-400">{index + 1}</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    {entry.profile_medium ? (
                      <Image src={entry.profile_medium} alt="" width={28} height={28}
                        className="rounded-full object-cover flex-shrink-0 ring-1 ring-white/10 sm:w-8 sm:h-8" />
                    ) : (
                      <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/5 flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <a href={`/athlete/${entry.user_id}`}
                        className="text-sm font-medium text-white/80 hover:text-white truncate block transition-colors">
                        {entry.firstname} {entry.lastname?.charAt(0)}.
                        {getCountryFlag(entry.country) && (
                          <span className="ml-1 text-xs">{getCountryFlag(entry.country)}</span>
                        )}
                      </a>
                      <div className="hidden sm:block text-xs text-gray-400 mt-0.5">
                        {entry.active_days ?? entry.activity_count} {(entry.active_days ?? entry.activity_count) === 1 ? "aktywny dzień" : "aktywnych dni"}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm font-semibold text-white/90 whitespace-nowrap">{formatDistance(entry.total_distance)} <span className="text-xs text-gray-400 font-normal">km</span></div>
                  </div>

                  <div className="hidden sm:block text-right">
                    <div className="text-sm text-white/70 whitespace-nowrap">{formatNumber(entry.total_elevation)} <span className="text-xs text-gray-400">m</span></div>
                  </div>

                  <div className="text-right">
                    <div className="text-sm text-white/70">{formatTime(entry.total_time)}</div>
                  </div>

                  {isAdmin && (
                    <button
                      onClick={() => handleRemove(entry.user_id, `${entry.firstname} ${entry.lastname}`)}
                      disabled={removing === entry.user_id}
                      className="w-6 h-6 rounded-lg flex items-center justify-center text-gray-700 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 disabled:opacity-50"
                      title="Usuń z rankingu"
                    >
                      {removing === entry.user_id ? "…" : "✕"}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer totals */}
      {localEntries.length > 0 && (
        <div className={`grid ${gridCols} gap-0 px-3 sm:px-4 py-3 border-t border-white/10 bg-white/[0.02]`}>
          <div />
          <div className="text-xs text-gray-400 uppercase tracking-wider font-semibold">Suma</div>
          <div className="text-right text-sm font-bold text-gradient-orange">{formatDistance(totalDistance)}</div>
          <div className="hidden sm:block text-right text-sm font-semibold text-white/60">{formatNumber(totalElevation)}</div>
          <div className="text-right text-sm font-semibold text-white/60">{formatTime(totalTime)}</div>
          {isAdmin && <div />}
        </div>
      )}
    </div>
  );
}
