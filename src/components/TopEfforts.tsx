import Image from "next/image";
import { createServiceClient } from "@/lib/supabase/server";
import { formatNumber } from "@/lib/format";

const DISTANCES = ["5 km", "10 km", "20 km", "30 km", "40 km", "50 km"];

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

async function getTopEfforts() {
  const supabase = createServiceClient();

  const results: Record<string, Array<{
    user_id: string;
    firstname: string;
    lastname: string;
    profile_medium: string | null;
    moving_time: number;
    avg_speed: number;
    activity_date: string;
    distance: number;
  }>> = {};

  for (const dist of DISTANCES) {
    const { data } = await supabase
      .from("lsk_best_efforts")
      .select(`
        moving_time, avg_speed, activity_date, distance,
        users!inner(id, firstname, lastname, profile_medium, is_active)
      `)
      .eq("effort_name", dist)
      .eq("users.is_active", true)
      .order("moving_time", { ascending: true })
      .limit(3);

    if (data && data.length > 0) {
      results[dist] = data.map((r: any) => ({
        user_id: r.users.id,
        firstname: r.users.firstname,
        lastname: r.users.lastname,
        profile_medium: r.users.profile_medium,
        moving_time: r.moving_time,
        avg_speed: r.avg_speed,
        activity_date: r.activity_date,
        distance: r.distance,
      }));
    }
  }

  return results;
}

const medalColors = [
  "text-yellow-400",
  "text-gray-300",
  "text-orange-600",
];
const medalBg = [
  "border-yellow-500/20",
  "border-gray-400/20",
  "border-orange-700/20",
];

export default async function TopEfforts() {
  const efforts = await getTopEfforts();

  const hasAnyData = Object.keys(efforts).length > 0;
  if (!hasAnyData) return null;

  return (
    <div>
      <h2 className="text-xs font-semibold text-gray-600 uppercase tracking-widest mb-4">
        Top prędkości — najlepsze czasy
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DISTANCES.map(dist => {
          const top = efforts[dist];
          if (!top || top.length === 0) return null;

          return (
            <div key={dist} className="glass rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-bold text-white">{dist}</span>
                <span className="text-xs text-gray-600">najszybszy czas</span>
              </div>
              <div className="space-y-2">
                {top.map((e, i) => (
                  <div key={i} className={`flex items-center gap-3 rounded-xl px-3 py-2 border ${medalBg[i]} bg-white/[0.02]`}>
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
                      <div className="text-xs text-gray-600">{formatPace(e.moving_time, e.distance)}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={`text-sm font-bold tabular-nums ${i === 0 ? "text-yellow-400" : "text-white/70"}`}>
                        {formatEffortTime(e.moving_time)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
