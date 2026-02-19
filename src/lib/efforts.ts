import { createServiceClient } from "@/lib/supabase/server";
import { getValidAccessToken } from "@/lib/strava";

// Dystanse które nas interesują (w metrach) - tylko outdoor Ride
const TARGET_DISTANCES: Record<string, number> = {
  "5 km":  5000,
  "10 km": 10000,
  "20 km": 20000,
  "30 km": 30000,
  "40 km": 40000,
  "50 km": 50000,
};

const DISTANCE_TOLERANCE = 0.15; // 15% tolerancji

export function matchDistance(distanceMeters: number): string | null {
  for (const [label, target] of Object.entries(TARGET_DISTANCES)) {
    if (Math.abs(distanceMeters - target) / target < DISTANCE_TOLERANCE) {
      return label;
    }
  }
  return null;
}

export async function fetchAndSaveBestEfforts(userId: string, stravaActivityId: number): Promise<number> {
  const supabase = createServiceClient();

  try {
    const accessToken = await getValidAccessToken(userId);
    const res = await fetch(`https://www.strava.com/api/v3/activities/${stravaActivityId}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) return 0;

    const activity = await res.json();

    // Tylko outdoor Ride (nie VirtualRide)
    const isOutdoorRide = activity.type === "Ride" || activity.sport_type === "Ride";
    if (!isOutdoorRide) return 0;

    const efforts = activity.best_efforts;
    if (!Array.isArray(efforts) || efforts.length === 0) return 0;

    const toSave = [];

    for (const effort of efforts) {
      const label = matchDistance(effort.distance);
      if (!label) continue;

      toSave.push({
        strava_activity_id: stravaActivityId,
        user_id: userId,
        effort_name: label,
        distance: effort.distance,
        moving_time: effort.moving_time,
        elapsed_time: effort.elapsed_time,
        avg_speed: effort.distance / effort.moving_time, // m/s
        activity_date: effort.start_date,
      });
    }

    if (toSave.length === 0) return 0;

    await supabase
      .from("lsk_best_efforts")
      .upsert(toSave, { onConflict: "strava_activity_id,effort_name" });

    return toSave.length;
  } catch {
    return 0;
  }
}
