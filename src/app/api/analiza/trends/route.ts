// Dane trendow dla /analiza/trendy
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
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

  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  let query = supabase
    .from("activities")
    .select(`
      id, start_date, distance_meters, moving_time_seconds,
      average_watts, weighted_average_watts, normalized_power,
      intensity_factor, tss, effective_tss,
      average_heartrate, average_cadence, total_elevation_gain,
      has_fit_analysis
    `)
    .eq("is_ride", true)
    .eq("is_ignored", false)
    .order("start_date", { ascending: true });

  if (from) query = query.gte("start_date", from);
  if (to) query = query.lte("start_date", to);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const activities = data ?? [];

  // Agregacja tygodniowa
  const weeklyMap: Record<string, { distance: number; elevation: number; count: number }> = {};
  activities.forEach(a => {
    const date = new Date(a.start_date);
    const dayOfWeek = date.getDay();
    const diff = date.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(date.setDate(diff));
    const key = monday.toISOString().split("T")[0];
    if (!weeklyMap[key]) weeklyMap[key] = { distance: 0, elevation: 0, count: 0 };
    weeklyMap[key].distance += (a.distance_meters ?? 0) / 1000;
    weeklyMap[key].elevation += a.total_elevation_gain ?? 0;
    weeklyMap[key].count++;
  });

  const weeklyVolume = Object.entries(weeklyMap)
    .map(([week, v]) => ({ week, ...v }))
    .sort((a, b) => a.week.localeCompare(b.week));

  // Podsumowanie okresu
  const totalDistance = activities.reduce((s, a) => s + (a.distance_meters ?? 0) / 1000, 0);
  const totalTime = activities.reduce((s, a) => s + (a.moving_time_seconds ?? 0), 0);
  const avgNp = activities.filter(a => a.weighted_average_watts).length > 0
    ? activities.reduce((s, a) => s + (a.weighted_average_watts ?? 0), 0) / activities.filter(a => a.weighted_average_watts).length
    : null;
  const avgIf = activities.filter(a => a.intensity_factor).length > 0
    ? activities.reduce((s, a) => s + (a.intensity_factor ?? 0), 0) / activities.filter(a => a.intensity_factor).length
    : null;
  const avgTss = activities.filter(a => a.effective_tss ?? a.tss).length > 0
    ? activities.reduce((s, a) => s + (a.effective_tss ?? a.tss ?? 0), 0) / activities.filter(a => a.effective_tss ?? a.tss).length
    : null;

  return NextResponse.json({
    activities,
    weeklyVolume,
    summary: {
      count: activities.length,
      totalDistance: Math.round(totalDistance * 10) / 10,
      totalTime,
      avgNp: avgNp ? Math.round(avgNp) : null,
      avgIf: avgIf ? Math.round(avgIf * 1000) / 1000 : null,
      avgTss: avgTss ? Math.round(avgTss * 10) / 10 : null,
    },
  });
}
