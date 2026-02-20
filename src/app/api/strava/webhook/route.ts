import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getValidAccessToken } from "@/lib/strava";
import { fetchAndSaveBestEfforts } from "@/lib/efforts";

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

// POST - event od Stravy (create/update/delete aktywności)
export async function POST(request: NextRequest) {
  const body = await request.json();
  const { object_type, aspect_type, object_id, owner_id } = body;

  // Obsługujemy tylko aktywności
  if (object_type !== "activity") {
    return NextResponse.json({ ok: true });
  }

  const supabase = createServiceClient();

  // Znajdź usera po strava_id
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("strava_id", owner_id)
    .single();

  if (!user) {
    return NextResponse.json({ ok: true }); // nieznany użytkownik, ignoruj
  }

  if (aspect_type === "delete") {
    await supabase
      .from("lsk_activities")
      .delete()
      .eq("strava_id", object_id);

    return NextResponse.json({ ok: true });
  }

  if (aspect_type === "create" || aspect_type === "update") {
    try {
      const accessToken = await getValidAccessToken(user.id);

      const res = await fetch(`https://www.strava.com/api/v3/activities/${object_id}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        return NextResponse.json({ ok: true });
      }

      const activity = await res.json();

      const isRide = activity.type === "Ride" || activity.type === "VirtualRide" ||
        activity.sport_type === "Ride" || activity.sport_type === "VirtualRide";

      if (!isRide) {
        // Jeśli nie jazda - usuń jeśli istnieje (np. zmieniono typ)
        await supabase.from("lsk_activities").delete().eq("strava_id", object_id);
        return NextResponse.json({ ok: true });
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
      }, { onConflict: "strava_id" });

      // Zapisz best efforts (tylko outdoor Ride) - przekazujemy dane które już mamy
      await fetchAndSaveBestEfforts(user.id, object_id, {
        start_date: activity.start_date,
        distance: activity.distance,
        name: activity.name,
      });

    } catch (err) {
      console.error("Webhook sync error:", err);
    }
  }

  return NextResponse.json({ ok: true });
}
