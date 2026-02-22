"use client";

import Image from "next/image";
import { useState } from "react";
import { formatTime } from "@/lib/format";

const TYPE_LABEL: Record<string, string> = {
  Ride: "Ride",
  GravelRide: "Gravel",
  MountainBikeRide: "MTB",
  VirtualRide: "Virtual",
  EBikeRide: "E-Bike",
  EBikeMountainBikeRide: "E-MTB",
  Handcycle: "Handbike",
};

function typeLabel(type: string, trainer: boolean): string {
  if (trainer) return "Indoor";
  return TYPE_LABEL[type] ?? type;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("pl-PL", { day: "numeric", month: "short" });
}

function formatSpeed(distance: number, movingTime: number): string {
  if (!movingTime) return "—";
  return ((distance / movingTime) * 3.6).toFixed(1);
}

interface Activity {
  strava_id: number;
  name: string | null;
  type: string;
  trainer: boolean;
  distance: number;
  moving_time: number;
  total_elevation_gain: number;
  start_date_local: string;
  users: {
    firstname: string | null;
    lastname: string | null;
    profile_medium: string | null;
  };
}

const INITIAL_LIMIT = 10;

export default function RecentActivitiesList({ activities }: { activities: Activity[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? activities : activities.slice(0, INITIAL_LIMIT);
  const hasMore = activities.length > INITIAL_LIMIT;

  if (activities.length === 0) {
    return (
      <div className="glass rounded-2xl py-12 text-center text-gray-400">
        <div className="text-3xl mb-2">🚴</div>
        <div>Brak aktywności w wybranym okresie</div>
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="grid grid-cols-[1fr_72px_72px_72px_60px_24px] gap-0 px-4 py-2.5 border-b border-white/5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
        <div>Zawodnik</div>
        <div className="text-right">Dystans</div>
        <div className="text-right">Czas</div>
        <div className="text-right">Śr. pr.</div>
        <div className="text-right">Przewyż.</div>
        <div />
      </div>

      {visible.map((a, i) => (
        <a
          key={`${a.strava_id}-${i}`}
          href={`https://www.strava.com/activities/${a.strava_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="grid grid-cols-[1fr_72px_72px_72px_60px_24px] gap-0 items-center px-4 py-2.5 border-b border-white/[0.03] hover:bg-white/[0.04] transition-colors"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {a.users.profile_medium ? (
              <Image src={a.users.profile_medium} alt="" width={24} height={24}
                className="rounded-full flex-shrink-0 ring-1 ring-white/10" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-white/5 flex-shrink-0" />
            )}
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-medium text-white/90 truncate">
                {a.users.firstname} {a.users.lastname?.charAt(0)}.
              </span>
              <span className="text-xs text-gray-500 flex-shrink-0">{formatDate(a.start_date_local)}</span>
              <span className="text-xs px-1.5 py-0.5 rounded bg-white/[0.06] text-gray-400 flex-shrink-0">
                {typeLabel(a.type, a.trainer)}
              </span>
              {a.name && (
                <span className="text-xs text-gray-600 truncate hidden md:block">{a.name}</span>
              )}
            </div>
          </div>

          <div className="text-right">
            <span className="text-sm font-semibold text-white/90">{(a.distance / 1000).toFixed(1)}</span>
            <span className="text-xs text-gray-400 ml-1">km</span>
          </div>

          <div className="text-right">
            <span className="text-sm text-white/70">{formatTime(a.moving_time)}</span>
          </div>

          <div className="text-right">
            <span className="text-sm text-white/70">{formatSpeed(a.distance, a.moving_time)}</span>
            <span className="text-xs text-gray-400 ml-1">km/h</span>
          </div>

          <div className="text-right">
            <span className="text-sm text-white/70">{Math.round(a.total_elevation_gain)}</span>
            <span className="text-xs text-gray-400 ml-1">m</span>
          </div>

          <div className="text-gray-600 text-xs text-right">↗</div>
        </a>
      ))}

      {hasMore && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full py-3 text-xs text-gray-400 hover:text-white hover:bg-white/[0.03] transition-colors border-t border-white/[0.04]"
        >
          {expanded ? "↑ Zwiń" : `↓ Pokaż więcej (${activities.length - INITIAL_LIMIT})`}
        </button>
      )}
    </div>
  );
}
