import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { fetchAndSaveBestEfforts } from "@/lib/efforts";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("lsk_user_id")?.value;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();
  const { data: user } = await supabase.from("users").select("is_admin").eq("id", userId).single();
  if (!user?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Pobierz wszystkich aktywnych użytkowników
  const { data: users } = await supabase.from("users").select("id").eq("is_active", true);
  if (!users) return NextResponse.json({ error: "No users" }, { status: 500 });

  let total = 0;
  let processed = 0;

  for (const u of users) {
    // Pobierz wszystkie aktywności typu Ride (nie Virtual)
    const { data: activities } = await supabase
      .from("lsk_activities")
      .select("strava_id")
      .eq("user_id", u.id)
      .in("type", ["Ride"]);

    if (!activities) continue;

    for (const act of activities) {
      processed++;
      const saved = await fetchAndSaveBestEfforts(u.id, act.strava_id);
      total += saved;
      // Rate limiting - 2 req/s
      await new Promise(r => setTimeout(r, 500));
    }
  }

  return NextResponse.json({ processed, total });
}
