import { createServiceClient } from "@/lib/supabase/server";
import { getValidAccessToken } from "@/lib/strava";

// Dystanse które nas interesują (w metrach)
const TARGET_DISTANCES: Record<string, number> = {
  "10 km": 10000,
  "20 km": 20000,
  "30 km": 30000,
  "40 km": 40000,
  "50 km": 50000,
  "100 km": 100000,
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

// activityMeta - opcjonalne dane z lsk_activities (unikamy zbędnego API call)
export async function fetchAndSaveBestEfforts(
  userId: string,
  stravaActivityId: number,
  activityMeta?: { start_date: string; distance: number; name?: string }
): Promise<number> {
  const supabase = createServiceClient();

  try {
    const accessToken = await getValidAccessToken(userId);

    let activityDate: string;
    let activityDistance: number;

    if (activityMeta) {
      // Wyklucz aktywności z "rolka" w nazwie (indoor na rolkach z błędnym typem Ride)
      if (activityMeta.name?.toLowerCase().includes("rolka")) return 0;
      // Dane z bazy - bez API call
      activityDate = activityMeta.start_date;
      activityDistance = activityMeta.distance;
    } else {
      // Webhook: pobierz dane z API (pojedyncza aktywność, nie ma problemu z rate limit)
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

      activityDate = activity.start_date;
      activityDistance = activity.distance;
    }

    // Pomiń aktywności krótsze niż 5km
    if (activityDistance < 5000) return 0;

    // Pobierz strumień dystansu i czasu
    const streamsRes = await fetch(
      `https://www.strava.com/api/v3/activities/${stravaActivityId}/streams?keys=distance,time&key_by_type=true`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    if (!streamsRes.ok) return 0;
    const streams = await streamsRes.json();

    const distStream: number[] = streams.distance?.data ?? [];
    const timeStream: number[] = streams.time?.data ?? [];
    if (distStream.length === 0 || timeStream.length === 0) return 0;

    // Dla każdego docelowego dystansu znajdź najszybszy odcinek
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
      if (activityDistance < targetMeters * 0.97) continue;

      const movingTime = fastestSegment(distStream, timeStream, targetMeters);
      if (movingTime === null) continue;

      toSave.push({
        strava_activity_id: stravaActivityId,
        user_id: userId,
        effort_name: label,
        distance: targetMeters,
        moving_time: movingTime,
        elapsed_time: movingTime,
        avg_speed: targetMeters / movingTime,
        activity_date: activityDate,
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
