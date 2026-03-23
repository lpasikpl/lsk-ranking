// Pełne dane aktywnosci do widoku /analiza/[id]
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const activityId = parseInt(id, 10);

  const cookieStore = await cookies();
  const userId = cookieStore.get("lsk_user_id")?.value;
  if (!userId) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

  const supabase = createServiceClient();

  const { data: user } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", userId)
    .single();
  if (!user?.is_admin) return NextResponse.json({ error: "Brak dostepu" }, { status: 403 });

  // Pobierz wszystkie dane rownoczesnie
  const [actRes, fitRes, lapsRes, recordsRes, gearRes, commentsRes, settingsRes] =
    await Promise.all([
      supabase
        .from("activities")
        .select("*")
        .eq("id", activityId)
        .single(),
      supabase
        .from("fit_activities")
        .select("*")
        .eq("activity_id", activityId)
        .single(),
      supabase
        .from("fit_laps")
        .select("*")
        .eq("activity_id", activityId)
        .order("lap_number"),
      supabase
        .from("fit_records")
        .select("seconds_offset, latitude, longitude, altitude, power, heart_rate, cadence, speed, temperature, left_torque_effectiveness, left_pedal_smoothness")
        .eq("activity_id", activityId)
        .order("seconds_offset"),
      supabase
        .from("fit_gear_events")
        .select("*")
        .eq("activity_id", activityId)
        .order("seconds_offset"),
      supabase
        .from("ai_comments")
        .select("section, comment, created_at")
        .eq("activity_id", activityId),
      supabase
        .from("athlete_settings")
        .select("ftp, max_hr, resting_hr, power_zone_1_max, power_zone_2_max, power_zone_3_max, power_zone_4_max, power_zone_5_max, power_zone_6_max")
        .single(),
    ]);

  if (!actRes.data) {
    return NextResponse.json({ error: "Aktywnosc nie znaleziona" }, { status: 404 });
  }

  return NextResponse.json({
    activity: actRes.data,
    fitData: fitRes.data ?? null,
    laps: lapsRes.data ?? [],
    records: recordsRes.data ?? [],
    gearEvents: gearRes.data ?? [],
    aiComments: commentsRes.data ?? [],
    athleteSettings: settingsRes.data ?? null,
  });
}
