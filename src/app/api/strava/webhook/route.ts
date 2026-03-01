import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getValidAccessToken } from "@/lib/strava";
import { fetchAndSaveBestEfforts } from "@/lib/efforts";
import { waitUntil } from "@vercel/functions";
import { supabaseStravaService } from "@/lib/supabase-strava";
import { calculateMetrics, type StravaStream } from "@/lib/strava-metrics";

const VERIFY_TOKEN = process.env.STRAVA_WEBHOOK_VERIFY_TOKEN || "lsk_webhook_secret";

// GET - weryfikacja subskrypcji przez Stravę
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === VERIFY_TOKEN) {
    return NextResponse.json({ "hub.challenge": challenge });
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}

async function syncToStravaSupabase(
  accessToken: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  activity: any,
  object_id: number
) {
  try {
    const streamsRes = await fetch(
      `https://www.strava.com/api/v3/activities/${object_id}/streams?keys=watts,heartrate,time,cadence&key_by_type=false`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const streams: StravaStream[] = streamsRes.ok ? await streamsRes.json() : [];

    const metrics = calculateMetrics(activity, Array.isArray(streams) ? streams : []);

    await supabaseStravaService.from("activities").upsert({
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
      ...metrics,
    }, { onConflict: "strava_activity_id" });
  } catch (err) {
    console.error("Strava Supabase sync error:", err);
  }
}

async function processWebhookEvent(
  object_type: string,
  aspect_type: string,
  object_id: number,
  owner_id: number
) {
  if (object_type !== "activity") return;

  const supabase = createServiceClient();

  const { data: user } = await supabase
    .from("users")
    .select("id, is_admin")
    .eq("strava_id", owner_id)
    .single();

  if (!user) return;

  if (aspect_type === "delete") {
    await supabase.from("lsk_activities").delete().eq("strava_id", object_id);
    if (user.is_admin) {
      await supabaseStravaService.from("activities").delete().eq("strava_activity_id", object_id);
    }
    return;
  }

  if (aspect_type === "create" || aspect_type === "update") {
    try {
      const accessToken = await getValidAccessToken(user.id);

      const res = await fetch(`https://www.strava.com/api/v3/activities/${object_id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) return;

      const activity = await res.json();

      const BIKE_TYPES = new Set(["Ride", "VirtualRide", "GravelRide", "MountainBikeRide", "EBikeRide"]);
      const isRide = BIKE_TYPES.has(activity.type) || BIKE_TYPES.has(activity.sport_type);

      if (!isRide) {
        await supabase.from("lsk_activities").delete().eq("strava_id", object_id);
        if (user.is_admin) {
          await supabaseStravaService.from("activities").delete().eq("strava_activity_id", object_id);
        }
        return;
      }

      await supabase.from("lsk_activities").upsert({
        strava_id: activity.id,
        user_id: user.id,
        name: activity.name,
        type: activity.type || activity.sport_type,
        distance: activity.distance,
        moving_time: activity.moving_time,
        elapsed_time: activity.elapsed_time,
        total_elevation_gain: activity.total_elevation_gain,
        start_date: activity.start_date,
        start_date_local: activity.start_date_local,
        trainer: activity.trainer === true,
      }, { onConflict: "strava_id" });

      // Sync do strava Supabase (prywatny dashboard) — tylko admin
      if (user.is_admin) {
        await syncToStravaSupabase(accessToken, activity, object_id);
      }

      // Best efforts dla outdoor Ride i GravelRide (nie VirtualRide, nie trainer)
      const EFFORT_TYPES = new Set(["Ride", "GravelRide", "MountainBikeRide"]);
      const isOutdoorRide = (EFFORT_TYPES.has(activity.type) || EFFORT_TYPES.has(activity.sport_type)) && !activity.trainer;
      if (isOutdoorRide) {
        await fetchAndSaveBestEfforts(user.id, object_id, {
          start_date: activity.start_date,
          distance: activity.distance,
          name: activity.name,
          trainer: activity.trainer === true,
          type: activity.sport_type || activity.type,
        });
      }

    } catch (err) {
      console.error("Webhook sync error:", err);
    }
  }
}

// POST - event od Stravy (create/update/delete aktywności)
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { object_type, aspect_type, object_id, owner_id } = body;

  // Natychmiast zwróć 200 - Strava wymaga odpowiedzi w ciągu 2 sekund
  waitUntil(processWebhookEvent(object_type, aspect_type, object_id, owner_id));

  return NextResponse.json({ ok: true });
}
