import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getValidAccessToken } from "@/lib/strava";
import { fetchAndSaveBestEfforts } from "@/lib/efforts";
import { waitUntil } from "@vercel/functions";

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
    .select("id")
    .eq("strava_id", owner_id)
    .single();

  if (!user) return;

  if (aspect_type === "delete") {
    await supabase.from("lsk_activities").delete().eq("strava_id", object_id);
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

const N8N_WEBHOOK_URL = "https://n8n.tc.pl/webhook/strava-pasik";

// POST - event od Stravy (create/update/delete aktywności)
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { object_type, aspect_type, object_id, owner_id } = body;

  // Natychmiast zwróć 200 - Strava wymaga odpowiedzi w ciągu 2 sekund
  // Całe przetwarzanie idzie do tła przez waitUntil
  waitUntil(processWebhookEvent(object_type, aspect_type, object_id, owner_id));

  // Forward do n8n (personal dashboard)
  waitUntil(
    fetch(N8N_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }).catch(() => {})
  );

  return NextResponse.json({ ok: true });
}
