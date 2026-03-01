import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getValidAccessToken } from "@/lib/strava";
import { supabaseStravaService } from "@/lib/supabase-strava";
import { calculateMetrics, pickMetrics, type StravaStream } from "@/lib/strava-metrics";
import { cookies } from "next/headers";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("lsk_user_id")?.value;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();
  const { data: user } = await supabase.from("users").select("id, is_admin, strava_id").eq("id", userId).single();
  if (!user?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Opcjonalny parametr: after=2026-01-01 (domyślnie 2025-01-01)
  const body = await request.json().catch(() => ({}));
  const after: string = body.after ?? "2025-01-01";

  // Pobierz aktywności admina z LSK Supabase których jeszcze nie ma w strava Supabase
  const { data: lskActivities, error: lskError } = await supabase
    .from("lsk_activities")
    .select("strava_id, start_date")
    .eq("user_id", user.id)
    .gte("start_date", after)
    .order("start_date", { ascending: false });

  if (lskError || !lskActivities) {
    return NextResponse.json({ error: "Failed to fetch LSK activities" }, { status: 500 });
  }

  // Opcjonalny parametr: force=true — re-sync też tych co są, ale bez danych mocy
  const force: boolean = body.force === true;

  const stravaIds = lskActivities.map((a) => a.strava_id);
  const { data: existing } = await supabaseStravaService
    .from("activities")
    .select("strava_activity_id, has_power_data")
    .in("strava_activity_id", stravaIds);

  const existingWithPower = new Set(
    (existing ?? []).filter((a) => a.has_power_data).map((a) => a.strava_activity_id)
  );
  const existingAll = new Set((existing ?? []).map((a) => a.strava_activity_id));

  // force=true: pomiń tylko te które mają już dane mocy
  // force=false (domyślnie): pomiń wszystkie które już istnieją
  const missing = lskActivities.filter((a) =>
    force ? !existingWithPower.has(a.strava_id) : !existingAll.has(a.strava_id)
  );

  if (missing.length === 0) {
    return NextResponse.json({ synced: 0, message: "Wszystko już zsynchronizowane" });
  }

  const accessToken = await getValidAccessToken(user.id);

  let synced = 0;
  let errors = 0;
  const details: string[] = [];

  for (const act of missing) {
    try {
      // Pobierz pełne dane aktywności
      const actRes = await fetch(`https://www.strava.com/api/v3/activities/${act.strava_id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!actRes.ok) {
        details.push(`${act.strava_id}: activity fetch failed (${actRes.status})`);
        errors++;
        continue;
      }
      const activity = await actRes.json();

      // Pobierz streams
      const streamsRes = await fetch(
        `https://www.strava.com/api/v3/activities/${act.strava_id}/streams?keys=watts,heartrate,time,cadence&key_by_type=false`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
      const streams: StravaStream[] = streamsRes.ok ? await streamsRes.json() : [];

      const streamTypes = Array.isArray(streams) ? streams.map((s: StravaStream) => s.type) : [];
      const metrics = calculateMetrics(activity, Array.isArray(streams) ? streams : []);
      details.push(`${act.strava_id} (${activity.name}): streams=[${streamTypes.join(",")}] has_power=${metrics.has_power_data} NP=${metrics.normalized_power}`);

      const { error: upsertError } = await supabaseStravaService.from("activities").upsert({
        strava_activity_id: activity.id,
        name: activity.name,
        sport_type: activity.sport_type || activity.type,
        start_date: activity.start_date,
        elapsed_time_seconds: activity.elapsed_time,
        moving_time_seconds: activity.moving_time,
        distance_meters: activity.distance,
        total_elevation_gain: activity.total_elevation_gain,
        average_speed: activity.average_speed,
        max_speed: activity.max_speed,
        average_watts: activity.average_watts,
        max_watts: activity.max_watts,
        weighted_average_watts: activity.weighted_average_watts,
        average_heartrate: activity.average_heartrate,
        max_heartrate: activity.max_heartrate,
        average_cadence: activity.average_cadence,
        calories: activity.calories,
        device_name: activity.device_name,
        gear_id: activity.gear_id,
        ...pickMetrics(metrics),
      }, { onConflict: "strava_activity_id" });

      if (upsertError) {
        details.push(`${act.strava_id}: UPSERT ERROR — ${upsertError.message}`);
        errors++;
      } else {
        synced++;
      }

      // Rate limiting — krótka przerwa między requestami
      await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      details.push(`${act.strava_id}: ${err instanceof Error ? err.message : err}`);
      errors++;
    }
  }

  return NextResponse.json({
    total_missing: missing.length,
    synced,
    errors,
    details,
  });
}
