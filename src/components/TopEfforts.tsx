import Image from "next/image";
import { createServiceClient } from "@/lib/supabase/server";

const DISTANCES = ["10 km", "20 km", "30 km", "40 km", "50 km", "100 km"] as const;

function formatPace(movingTime: number, distance: number): string {
  const speedKmh = (distance / movingTime) * 3.6;
  return `${speedKmh.toFixed(1)} km/h`;
}

function formatEffortTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

interface TopEffortsProps {
  year: number;
  month?: number;
}

async function getTopEfforts(year: number, month?: number) {
  const supabase = createServiceClient();

  const startDate = month
    ? new Date(year, month - 1, 1).toISOString()
    : new Date(year, 0, 1).toISOString();
  const endDate = month
    ? new Date(year, month, 0, 23, 59, 59).toISOString()
    : new Date(year, 11, 31, 23, 59, 59).toISOString();

  const results: Record<string, Array<{
    user_id: string;
    firstname: string;
    lastname: string;
    profile_medium: string | null;
    moving_time: number;
    distance: number;
    strava_activity_id: number;
  }>> = {};

  for (const dist of DISTANCES) {
    const { data } = await supabase
      .from("lsk_best_efforts")
      .select(`
        strava_activity_id, moving_time, distance,
        users!inner(id, firstname, lastname, profile_medium, is_active)
      `)
      .eq("effort_name", dist)
      .eq("users.is_active", true)
      .gte("activity_date", startDate)
      .lte("activity_date", endDate)
      .order("moving_time", { ascending: true })
      .limit(50);

    if (data && data.length > 0) {
      const seen = new Set<string>();
      const deduped = data.filter((r: any) => {
        if (seen.has(r.users.id)) return false;
        seen.add(r.users.id);
        return true;
      }).slice(0, 3);

      results[dist] = deduped.map((r: any) => ({
        user_id: r.users.id,
        firstname: r.users.firstname,
        lastname: r.users.lastname,
        profile_medium: r.users.profile_medium,
        moving_time: r.moving_time,
        distance: r.distance,
        strava_activity_id: r.strava_activity_id,
      }));
    }
  }

  return results;
}

const medalColors = ["text-yellow-400", "text-gray-300", "text-orange-600"];
const medalBg = ["border-yellow-500/20", "border-gray-400/20", "border-orange-700/20"];

export default async function TopEfforts({ year, month }: TopEffortsProps) {
  const efforts = await getTopEfforts(year, month);

  return (
    <div className="mt-6">
      <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-4">
        Top prędkości — najlepsze czasy
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DISTANCES.map(dist => {
          const top = efforts[dist];

          return (
            <div key={dist} className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-white">{dist}</span>
                <span className="text-xs text-gray-600">najszybszy czas</span>
              </div>
              {(!top || top.length === 0) ? (
                <div className="flex items-center justify-center h-16 text-xs text-gray-600">
                  brak danych
                </div>
              ) : (
                <div className="space-y-2">
                  {top.map((e, i) => (
                    <a
                      key={i}
                      href={`https://www.strava.com/activities/${e.strava_activity_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`flex items-center gap-3 rounded-xl px-3 py-2 border ${medalBg[i]} bg-white/[0.02] hover:bg-white/[0.05] transition-colors cursor-pointer`}
                    >
                      <span className={`text-sm font-bold w-4 ${medalColors[i]}`}>{i + 1}</span>
                      {e.profile_medium ? (
                        <Image src={e.profile_medium} alt="" width={24} height={24} className="rounded-full flex-shrink-0" />
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-white/5 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-medium text-white/80 truncate">
                          {e.firstname} {e.lastname?.charAt(0)}.
                        </div>
                        <div className="text-xs text-gray-500 tabular-nums">{formatEffortTime(e.moving_time)}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className={`text-xs font-bold ${i === 0 ? "text-yellow-400" : "text-white/70"}`}>
                          {formatPace(e.moving_time, e.distance)}
                        </div>
                      </div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
