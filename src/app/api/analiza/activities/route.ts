// Lista aktywnosci do widoku /analiza
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("lsk_user_id")?.value;
  if (!userId) return NextResponse.json({ error: "Brak autoryzacji" }, { status: 401 });

  const supabase = createServiceClient();

  // Sprawdz is_admin
  const { data: user } = await supabase
    .from("users")
    .select("is_admin")
    .eq("id", userId)
    .single();
  if (!user?.is_admin) return NextResponse.json({ error: "Brak dostepu" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const hasFit = searchParams.get("hasFit") === "true";
  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);

  let query = supabase
    .from("activities")
    .select(`
      id, name, start_date, distance_meters, moving_time_seconds, elapsed_time_seconds,
      average_watts, weighted_average_watts, normalized_power, intensity_factor, tss, effective_tss,
      average_heartrate, max_heartrate, average_cadence, total_elevation_gain,
      is_commute, is_ignored, has_fit_analysis, sport_type,
      fit_activities(
        total_work_kj, training_effect_aerobic, training_effect_anaerobic,
        has_pedaling_data, has_gear_data, has_temperature_data
      ),
      ai_comments(section)
    `)
    .eq("is_ride", true)
    .eq("is_ignored", false)
    .order("start_date", { ascending: false })
    .limit(limit);

  if (from) query = query.gte("start_date", from);
  if (to) query = query.lte("start_date", to);
  if (hasFit) query = query.eq("has_fit_analysis", true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ activities: data ?? [] });
}
