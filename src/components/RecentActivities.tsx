import Image from "next/image";
import { createServiceClient } from "@/lib/supabase/server";
import { formatTime } from "@/lib/format";

interface RecentActivitiesProps {
  year: number;
  month: number;
}

const TYPE_LABEL: Record<string, string> = {
  Ride: "Szosa",
  GravelRide: "Gravel",
  MountainBikeRide: "MTB",
  VirtualRide: "Wirtualna",
  EBikeRide: "E-Bike",
  Handcycle: "Handbike",
};

function typeLabel(type: string): string {
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

async function getRecentActivities(year: number, month: number) {
  const supabase = createServiceClient();
  const startDate = new Date(year, month - 1, 1).toISOString();
  const endDate = new Date(year, month, 0, 23, 59, 59).toISOString();

  const { data } = await supabase
    .from("lsk_activities")
    .select(`
      strava_id, name, type, distance, moving_time, total_elevation_gain, start_date_local,
      users!inner(id, firstname, lastname, profile_medium, is_active)
    `)
    .eq("users.is_active", true)
    .eq("trainer", false)
    .neq("type", "VirtualRide")
    .gte("start_date_local", startDate)
    .lte("start_date_local", endDate)
    .order("start_date_local", { ascending: false })
    .limit(30);

  return (data || []) as any[];
}

export default async function RecentActivities({ year, month }: RecentActivitiesProps) {
  const activities = await getRecentActivities(year, month);

  return (
    <div className="mt-6">
      <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
        Ostatnie aktywności
      </h2>
      <div className="glass rounded-2xl overflow-hidden">
        {/* Header */}
        <div className="hidden sm:grid grid-cols-[1fr_100px_70px_70px_70px_60px] gap-0 px-4 py-3 border-b border-white/5 text-xs font-semibold text-gray-400 uppercase tracking-wider">
          <div>Zawodnik / Aktywność</div>
          <div className="text-right">Dystans</div>
          <div className="text-right">Czas</div>
          <div className="text-right">Śr. pr.</div>
          <div className="text-right">Przewyż.</div>
          <div />
        </div>

        {activities.length === 0 ? (
          <div className="py-16 text-center text-gray-400">
            <div className="text-4xl mb-3">🚴</div>
            <div>Brak aktywności w wybranym okresie</div>
          </div>
        ) : (
          <div>
            {activities.map((a, i) => (
              <a
                key={`${a.strava_id}-${i}`}
                href={`https://www.strava.com/activities/${a.strava_id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex sm:grid sm:grid-cols-[1fr_100px_70px_70px_70px_60px] gap-0 items-center px-4 py-3 border-b border-white/[0.03] hover:bg-white/[0.03] transition-colors"
              >
                {/* Zawodnik + info */}
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {a.users.profile_medium ? (
                    <Image
                      src={a.users.profile_medium}
                      alt=""
                      width={28}
                      height={28}
                      className="rounded-full flex-shrink-0 ring-1 ring-white/10"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-white/5 flex-shrink-0" />
                  )}
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white/90 truncate">
                      {a.users.firstname} {a.users.lastname?.charAt(0)}.
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <span className="text-xs text-gray-500">{formatDate(a.start_date_local)}</span>
                      <span className="text-gray-700">·</span>
                      <span className="text-xs text-gray-500">{typeLabel(a.type)}</span>
                      {a.name && (
                        <>
                          <span className="text-gray-700">·</span>
                          <span className="text-xs text-gray-600 truncate max-w-[140px]">{a.name}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Dystans */}
                <div className="hidden sm:block text-right">
                  <div className="text-sm font-semibold text-white/90">
                    {(a.distance / 1000).toFixed(1)}
                  </div>
                  <div className="text-xs text-gray-400">km</div>
                </div>

                {/* Czas */}
                <div className="hidden sm:block text-right">
                  <div className="text-sm text-white/70">{formatTime(a.moving_time)}</div>
                  <div className="text-xs text-gray-400">h</div>
                </div>

                {/* Średnia prędkość */}
                <div className="hidden sm:block text-right">
                  <div className="text-sm text-white/70">{formatSpeed(a.distance, a.moving_time)}</div>
                  <div className="text-xs text-gray-400">km/h</div>
                </div>

                {/* Przewyższenie */}
                <div className="hidden sm:block text-right">
                  <div className="text-sm text-white/70">{Math.round(a.total_elevation_gain)}</div>
                  <div className="text-xs text-gray-400">m</div>
                </div>

                {/* Strava arrow */}
                <div className="hidden sm:flex justify-end text-gray-600 text-xs">↗</div>

                {/* Mobile: kluczowe dane */}
                <div className="sm:hidden flex-shrink-0 text-right ml-3">
                  <div className="text-sm font-semibold text-white/90">{(a.distance / 1000).toFixed(1)} km</div>
                  <div className="text-xs text-gray-400">{formatSpeed(a.distance, a.moving_time)} km/h</div>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
