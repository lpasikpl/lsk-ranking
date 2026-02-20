import { createServiceClient } from "@/lib/supabase/server";
import { getValidAccessToken } from "@/lib/strava";

// Dystanse które nas interesują (w metrach)
const TARGET_DISTANCES: Record<string, number> = {
  "5 km":  5000,
  "10 km": 10000,
  "20 km": 20000,
  "30 km": 30000,
  "40 km": 40000,
  "50 km": 50000,
};

// Dla best_efforts 3% (standardowe dystanse), dla fallback total distance 15%
const DISTANCE_TOLERANCE_EFFORTS = 0.03;
const DISTANCE_TOLERANCE_TOTAL = 0.15;

function matchDistance(distanceMeters: number, tolerance = DISTANCE_TOLERANCE_EFFORTS): string | null {
  for (const [label, target] of Object.entries(TARGET_DISTANCES)) {
    if (Math.abs(distanceMeters - target) / target < tolerance) {
      return label;
    }
  }
  return null;
}

export async function fetchAndSaveBestEfforts(userId: string, stravaActivityId: number): Promise<number> {
  const supabase = createServiceClient();

  try {
    const accessToken = await getValidAccessToken(userId);
    const res = await fetch(`https://www.strava.com/api/v3/activities/${stravaActivityId}?include_all_efforts=true`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) return 0;

    const activity = await res.json();

    // Tylko outdoor Ride (nie VirtualRide)
    const isOutdoorRide = activity.type === "Ride" || activity.sport_type === "Ride";
    if (!isOutdoorRide) return 0;

    // Próbuj best_efforts[] (Strava API - dla biegania pewne, dla Ride może być puste)
    const bestEfforts: Array<{
      distance: number;
      moving_time: number;
      elapsed_time: number;
    }> = activity.best_efforts || [];

    const byLabel: Record<string, { distance: number; moving_time: number; elapsed_time: number }> = {};

    if (bestEfforts.length > 0) {
      // Użyj segmentów dystansowych z API
      for (const effort of bestEfforts) {
        const label = matchDistance(effort.distance);
        if (!label) continue;
        if (!byLabel[label] || effort.moving_time < byLabel[label].moving_time) {
          byLabel[label] = effort;
        }
      }
    }

    // Fallback: jeśli best_efforts puste, sprawdź czy cała aktywność pasuje do dystansu (±15%)
    if (Object.keys(byLabel).length === 0) {
      const label = matchDistance(activity.distance, DISTANCE_TOLERANCE_TOTAL);
      if (label) {
        byLabel[label] = {
          distance: activity.distance,
          moving_time: activity.moving_time,
          elapsed_time: activity.elapsed_time,
        };
      }
    }

    if (Object.keys(byLabel).length === 0) return 0;

    const toSave = Object.entries(byLabel).map(([label, effort]) => ({
      strava_activity_id: stravaActivityId,
      user_id: userId,
      effort_name: label,
      distance: effort.distance,
      moving_time: effort.moving_time,
      elapsed_time: effort.elapsed_time,
      avg_speed: effort.distance / effort.moving_time, // m/s
      activity_date: activity.start_date,
    }));

    await supabase
      .from("lsk_best_efforts")
      .upsert(toSave, { onConflict: "strava_activity_id,effort_name" });

    return toSave.length;
  } catch {
    return 0;
  }
}
