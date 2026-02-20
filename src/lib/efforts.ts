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

// Tolerancja 3% - best_efforts Stravy mają standardowe dystanse, nie ma potrzeby szerokiej tolerancji
const DISTANCE_TOLERANCE = 0.03;

function matchDistance(distanceMeters: number): string | null {
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

    // Strava zwraca best_efforts[] - najszybsze segmenty dystansowe wewnątrz aktywności
    // Każda aktywność 100km może mieć best effort na 10km, 20km, 30km itd.
    const bestEfforts: Array<{
      distance: number;
      moving_time: number;
      elapsed_time: number;
    }> = activity.best_efforts || [];

    if (bestEfforts.length === 0) return 0;

    // Dla każdego interesującego nas dystansu znajdź najszybszy effort w tej aktywności
    const byLabel: Record<string, typeof bestEfforts[0]> = {};
    for (const effort of bestEfforts) {
      const label = matchDistance(effort.distance);
      if (!label) continue;
      if (!byLabel[label] || effort.moving_time < byLabel[label].moving_time) {
        byLabel[label] = effort;
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
