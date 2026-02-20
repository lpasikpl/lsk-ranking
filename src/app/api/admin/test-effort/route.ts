import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { getValidAccessToken } from "@/lib/strava";
import { cookies } from "next/headers";

export async function GET(_request: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("lsk_user_id")?.value;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();
  const { data: user } = await supabase.from("users").select("is_admin").eq("id", userId).single();
  if (!user?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Weź pierwszą aktywność Ride >= 20km
  const { data: act } = await supabase
    .from("lsk_activities")
    .select("strava_id, distance")
    .eq("user_id", userId)
    .eq("type", "Ride")
    .gte("distance", 20000)
    .order("start_date", { ascending: false })
    .limit(1)
    .single();

  if (!act) return NextResponse.json({ error: "Brak aktywności Ride >= 20km" });

  const accessToken = await getValidAccessToken(userId);

  // Fetch activity
  const actRes = await fetch(`https://www.strava.com/api/v3/activities/${act.strava_id}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const actData = await actRes.json();

  // Fetch streams
  const streamsRes = await fetch(
    `https://www.strava.com/api/v3/activities/${act.strava_id}/streams?keys=distance,time&key_by_type=true`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const streamsData = await streamsRes.json();

  return NextResponse.json({
    activity_id: act.strava_id,
    activity_distance_db: act.distance,
    act_status: actRes.status,
    streams_status: streamsRes.status,
    act_type: actData.type,
    act_sport_type: actData.sport_type,
    act_trainer: actData.trainer,
    best_efforts_count: actData.best_efforts?.length ?? 0,
    streams_keys: Object.keys(streamsData),
    streams_error: streamsData.message ?? null,
    distance_stream_length: streamsData.distance?.data?.length ?? "brak",
    time_stream_sample: streamsData.time?.data?.slice(0, 5) ?? "brak",
    dist_stream_sample: streamsData.distance?.data?.slice(0, 5) ?? "brak",
  });
}
