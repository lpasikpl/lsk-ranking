import { NextResponse } from "next/server";
import { supabaseStravaService } from "@/lib/supabase-strava";

export async function GET() {
  const { data, error } = await supabaseStravaService
    .from("activities")
    .select("id,start_date,sport_type,is_ride")
    .eq("is_ride", true)
    .gte("start_date", "2025-01-01")
    .lt("start_date", "2026-01-01")
    .order("start_date", { ascending: false });

  return NextResponse.json({
    count: data?.length ?? 0,
    error: error?.message ?? null,
    first5: data?.slice(0, 5).map((r) => ({ id: r.id, start_date: r.start_date, sport_type: r.sport_type })),
    last5: data?.slice(-5).map((r) => ({ id: r.id, start_date: r.start_date, sport_type: r.sport_type })),
  });
}
