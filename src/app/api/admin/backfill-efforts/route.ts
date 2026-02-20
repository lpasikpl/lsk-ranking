import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { fetchAndSaveBestEfforts } from "@/lib/efforts";
import { cookies } from "next/headers";

export const maxDuration = 300;

export async function POST(_request: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("lsk_user_id")?.value;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();
  const { data: user } = await supabase.from("users").select("is_admin").eq("id", userId).single();
  if (!user?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Pobierz wszystkich aktywnych użytkowników
  const { data: users } = await supabase.from("users").select("id").eq("is_active", true);
  if (!users) return NextResponse.json({ error: "No users" }, { status: 500 });

  // Przetwarzaj każdego usera równolegle - każdy ma osobny limit API na Stravie
  const results = await Promise.all(users.map(async (u) => {
    const { data: activities } = await supabase
      .from("lsk_activities")
      .select("strava_id, start_date, distance, name")
      .eq("user_id", u.id)
      .in("type", ["Ride"]);

    if (!activities || activities.length === 0) {
      return { userId: u.id, activities: 0, saved: 0 };
    }

    let saved = 0;
    for (const act of activities) {
      // Przekazujemy dane z bazy — pomijamy API call dla activity details (rate limit!)
      const n = await fetchAndSaveBestEfforts(u.id, act.strava_id, {
        start_date: act.start_date,
        distance: act.distance,
        name: act.name,
      });
      saved += n;
      // 300ms = maks ~3 aktywności/s, bezpieczny limit per user (200 req/15min per token)
      await new Promise(r => setTimeout(r, 300));
    }

    return { userId: u.id, activities: activities.length, saved };
  }));

  const total = results.reduce((s, r) => s + r.saved, 0);
  const processed = results.reduce((s, r) => s + r.activities, 0);
  const perUser = Object.fromEntries(results.map(r => [r.userId, { activities: r.activities, saved: r.saved }]));

  return NextResponse.json({ processed, total, perUser });
}
