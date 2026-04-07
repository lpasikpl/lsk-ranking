import { NextResponse } from "next/server";
import { fetchDashboardData } from "@/lib/strava-queries";

export async function GET() {
  const data = await fetchDashboardData();
  const prev = data.prevYearActivities;

  return NextResponse.json({
    count: prev.length,
    first5: prev.slice(0, 5).map((r) => ({ id: r.id, start_date: r.start_date, sport_type: r.sport_type })),
    last5: prev.slice(-5).map((r) => ({ id: r.id, start_date: r.start_date, sport_type: r.sport_type })),
    months: [...new Set(prev.map((r) => r.start_date.slice(0, 7)))].sort().reverse(),
  });
}
