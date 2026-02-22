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
  const day = d.getDate();
  const month = d.toLocaleDateString("pl-PL", { month: "short" });
  return `${day} ${month}`;
}

function formatTime2(dateStr: string): string {
  const d = new Date(dateStr);
  const h = String(d.getHours()).padStart(2, "0");
  const m = String(d.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
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
  users: { firstname: string | null; lastname: string | null; profile_medium: string | null };
}

const INITIAL_LIMIT = 10;

export default function RecentActivitiesList({ activities }: { activities: Activity[] }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? activities : activities.slice(0, INITIAL_LIMIT);
  const hasMore = activities.length > INITIAL_LIMIT;

  if (activities.length === 0) {
    return (
      <div className="glass rounded-2xl py-10 text-center text-gray-400 text-sm">
        Brak aktywności w wybranym okresie
      </div>
    );
  }

  return (
    <div className="glass rounded-2xl overflow-hidden">
      {/* Header — mobile: 3 kolumny, desktop: 6 kolumn */}
      <div className="
        grid grid-cols-[1fr_60px_16px]
        sm:grid-cols-[1fr_64px_64px_64px_52px_16px]
        px-4 py-2 border-b border-white/5 text-[10px] font-semibold text-gray-500 uppercase tracking-wider
      ">
        <div>Zawodnik</div>
        <div className="text-right">Dystans</div>
        <div className="hidden sm:block text-right">Czas</div>
        <div className="hidden sm:block text-right">Śr. pr.</div>
        <div className="hidden sm:block text-right">Przewyż.</div>
        <div />
      </div>

      {visible.map((a, i) => (
        <a
          key={`${a.strava_id}-${i}`}
          href={`https://www.strava.com/activities/${a.strava_id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="
            grid grid-cols-[1fr_60px_16px]
            sm:grid-cols-[1fr_64px_64px_64px_52px_16px]
            items-center px-4 py-2 border-b border-white/[0.03] hover:bg-white/[0.04] transition-colors
          "
        >
          {/* Zawodnik */}
          <div className="flex items-center gap-2 min-w-0">
            {a.users.profile_medium ? (
              <Image src={a.users.profile_medium} alt="" width={20} height={20}
                className="rounded-full flex-shrink-0 ring-1 ring-white/10" />
            ) : (
              <div className="w-5 h-5 rounded-full bg-white/5 flex-shrink-0" />
            )}
            <div className="flex flex-col min-w-0 sm:flex-row sm:items-center sm:gap-2">
              <span className="text-xs font-medium text-white/90 flex-shrink-0 leading-tight">
                {a.users.firstname} {a.users.lastname?.charAt(0)}.
              </span>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-[10px] text-gray-500">{formatDate(a.start_date_local)} {formatTime2(a.start_date_local)}</span>
                <span className="text-[10px] px-1 py-0.5 rounded bg-white/[0.06] text-gray-400">
                  {typeLabel(a.type, a.trainer)}
                </span>
              </div>
              {a.name && (
                <span className="text-[10px] text-gray-600 truncate hidden lg:block">{a.name}</span>
              )}
            </div>
          </div>

          {/* Dystans */}
          <div className="text-right tabular-nums">
            <span className="text-xs font-semibold text-white/90">{(a.distance / 1000).toFixed(1)}</span>
            <span className="text-[10px] text-gray-400 ml-0.5">km</span>
          </div>

          {/* Czas — tylko desktop */}
          <div className="hidden sm:block text-right tabular-nums">
            <span className="text-xs text-white/70">{formatTime(a.moving_time)}</span>
          </div>

          {/* Śr. prędkość — tylko desktop */}
          <div className="hidden sm:block text-right tabular-nums">
            <span className="text-xs text-white/70">{formatSpeed(a.distance, a.moving_time)}</span>
            <span className="text-[10px] text-gray-400 ml-0.5">km/h</span>
          </div>

          {/* Przewyższenie — tylko desktop */}
          <div className="hidden sm:block text-right tabular-nums">
            <span className="text-xs text-white/70">{Math.round(a.total_elevation_gain)}</span>
            <span className="text-[10px] text-gray-400 ml-0.5">m</span>
          </div>

          <div className="text-[10px] text-gray-600 text-right">↗</div>
        </a>
      ))}

      {hasMore && (
        <button
          onClick={() => setExpanded(v => !v)}
          className="w-full py-2.5 text-xs text-gray-500 hover:text-white hover:bg-white/[0.03] transition-colors"
        >
          {expanded ? "↑ Zwiń" : `↓ Pokaż więcej (${activities.length - INITIAL_LIMIT})`}
        </button>
      )}
    </div>
  );
}
