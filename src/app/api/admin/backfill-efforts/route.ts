import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { fetchAndSaveBestEfforts, TARGET_DISTANCES } from "@/lib/efforts";
import { cookies } from "next/headers";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("lsk_user_id")?.value;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();
  const { data: user } = await supabase.from("users").select("is_admin").eq("id", userId).single();
  if (!user?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json().catch(() => ({}));
  // force=true: przetwarza też aktywności które już mają część dystansów (np. brakuje 90km)
  const force: boolean = body.force === true;
  // userId: ogranicz backfill do jednego usera (zalecane żeby nie przekroczyć limitu Strava)
  const targetUserId: string | undefined = body.userId;

  const usersQuery = supabase.from("users").select("id").eq("is_active", true);
  if (targetUserId) usersQuery.eq("id", targetUserId);
  const { data: users } = await usersQuery;
  if (!users || users.length === 0) return NextResponse.json({ error: "No users found" }, { status: 404 });

  const allResults: Array<{
    userId: string;
    activities: number;
    processed: number;
    skipped: number;
    saved: number;
  }> = [];

  // Sekwencyjne przetwarzanie userów — unikamy przekroczenia app-level limitu Strava (600 req/15min)
  for (const u of users) {
    const { data: activities } = await supabase
      .from("lsk_activities")
      .select("strava_id, start_date, distance, name, trainer, type")
      .eq("user_id", u.id)
      .neq("type", "VirtualRide")
      .eq("trainer", false)
      .gte("start_date", "2025-01-01")
      .order("start_date", { ascending: false });

    if (!activities || activities.length === 0) {
      allResults.push({ userId: u.id, activities: 0, processed: 0, skipped: 0, saved: 0 });
      continue;
    }

    // Jedna zbiorcza query dla istniejących best efforts tego usera
    const stravaIds = activities.map((a) => a.strava_id);
    const { data: existing } = await supabase
      .from("lsk_best_efforts")
      .select("strava_activity_id, effort_name")
      .eq("user_id", u.id)
      .in("strava_activity_id", stravaIds);

    const existingMap = new Map<number, Set<string>>();
    for (const e of existing ?? []) {
      if (!existingMap.has(e.strava_activity_id)) existingMap.set(e.strava_activity_id, new Set());
      existingMap.get(e.strava_activity_id)!.add(e.effort_name);
    }

    let processed = 0, skipped = 0, saved = 0;

    for (const act of activities) {
      if (!force) {
        // Oblicz które dystanse ta aktywność może mieć (min 97% dystansu)
        const qualifying = Object.entries(TARGET_DISTANCES)
          .filter(([, meters]) => (act.distance ?? 0) >= meters * 0.97)
          .map(([label]) => label);

        if (qualifying.length === 0) { skipped++; continue; }

        const actExisting = existingMap.get(act.strava_id);
        if (actExisting && qualifying.every((d) => actExisting.has(d))) {
          skipped++;
          continue; // Ma już wszystkie możliwe dystanse
        }
      }

      const n = await fetchAndSaveBestEfforts(u.id, act.strava_id, {
        start_date: act.start_date,
        distance: act.distance,
        name: act.name,
        trainer: act.trainer === true,
        type: act.type,
      });

      processed++;
      saved += n;

      // 350ms przerwa — bezpieczny limit ~2.8 req/s per user, sekwencyjnie per user
      await new Promise((r) => setTimeout(r, 350));
    }

    allResults.push({ userId: u.id, activities: activities.length, processed, skipped, saved });
  }

  return NextResponse.json({
    users: allResults,
    total_activities: allResults.reduce((s, r) => s + r.activities, 0),
    total_processed: allResults.reduce((s, r) => s + r.processed, 0),
    total_skipped: allResults.reduce((s, r) => s + r.skipped, 0),
    total_saved: allResults.reduce((s, r) => s + r.saved, 0),
  });
}
