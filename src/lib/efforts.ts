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

// Najszybszy odcinek danego dystansu ze strumienia GPS (sliding window O(n))
function fastestSegment(
  distStream: number[],
  timeStream: number[],
  targetMeters: number
): number | null {
  let j = 0;
  let minTime = Infinity;

  for (let i = 0; i < distStream.length; i++) {
    // Przesuń j do przodu aż pokryje target
    while (j < distStream.length && distStream[j] - distStream[i] < targetMeters) {
      j++;
    }
    if (j < distStream.length) {
      const t = timeStream[j] - timeStream[i];
      if (t < minTime) minTime = t;
    }
  }

  return minTime === Infinity ? null : Math.round(minTime);
}

export async function fetchAndSaveBestEfforts(userId: string, stravaActivityId: number): Promise<number> {
  const supabase = createServiceClient();

  try {
    const accessToken = await getValidAccessToken(userId);

    // 1. Pobierz dane aktywności (typ, data, dystans)
    const actRes = await fetch(
      `https://www.strava.com/api/v3/activities/${stravaActivityId}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!actRes.ok) return 0;
    const activity = await actRes.json();

    // Tylko outdoor Ride - wyklucz VirtualRide i indoor (trainer)
    const isVirtual = activity.type === "VirtualRide" || activity.sport_type === "VirtualRide";
    const isIndoor = activity.trainer === true;
    const isRide = activity.type === "Ride" || activity.sport_type === "Ride";
    if (!isRide || isVirtual || isIndoor) return 0;

    // Pomiń aktywności krótsze niż 5km
    if (activity.distance < 5000) return 0;

    // 2. Pobierz strumień dystansu i czasu
    const streamsRes = await fetch(
      `https://www.strava.com/api/v3/activities/${stravaActivityId}/streams?keys=distance,time&key_by_type=true`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!streamsRes.ok) return 0;
    const streams = await streamsRes.json();

    const distStream: number[] = streams.distance?.data ?? [];
    const timeStream: number[] = streams.time?.data ?? [];
    if (distStream.length === 0 || timeStream.length === 0) return 0;

    // 3. Dla każdego docelowego dystansu znajdź najszybszy odcinek
    const toSave: Array<{
      strava_activity_id: number;
      user_id: string;
      effort_name: string;
      distance: number;
      moving_time: number;
      elapsed_time: number;
      avg_speed: number;
      activity_date: string;
    }> = [];

    for (const [label, targetMeters] of Object.entries(TARGET_DISTANCES)) {
      // Pomiń jeśli aktywność jest za krótka
      if (activity.distance < targetMeters * 0.97) continue;

      const movingTime = fastestSegment(distStream, timeStream, targetMeters);
      if (movingTime === null) continue;

      toSave.push({
        strava_activity_id: stravaActivityId,
        user_id: userId,
        effort_name: label,
        distance: targetMeters,
        moving_time: movingTime,
        elapsed_time: movingTime,
        avg_speed: targetMeters / movingTime, // m/s
        activity_date: activity.start_date,
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
