import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { syncUserActivities } from "@/lib/strava";

// Endpoint do wywoływania przez n8n (cron nocny)
export async function POST(request: NextRequest) {
  // Weryfikacja tokenu
  const authHeader = request.headers.get("authorization");
  const webhookSecret = process.env.SYNC_WEBHOOK_SECRET;

  if (!webhookSecret || authHeader !== `Bearer ${webhookSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Pobierz wszystkich aktywnych użytkowników
  const { data: users, error } = await supabase
    .from("users")
    .select("id, firstname, lastname")
    .eq("is_active", true);

  if (error || !users) {
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }

  const results: Array<{
    userId: string;
    name: string;
    synced: number;
    error?: string;
  }> = [];

  // Synchronizuj każdego użytkownika sekwencyjnie (rate limiting)
  for (const user of users) {
    // Pobierz ostatnią synchronizację dla tego użytkownika
    const { data: lastSync } = await supabase
      .from("sync_logs")
      .select("created_at")
      .eq("user_id", user.id)
      .eq("status", "success")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    let afterTimestamp: number | undefined;
    if (lastSync) {
      afterTimestamp = Math.floor(
        new Date(lastSync.created_at).getTime() / 1000
      );
    }

    const result = await syncUserActivities(user.id, { afterTimestamp });
    results.push({
      userId: user.id,
      name: `${user.firstname} ${user.lastname}`,
      synced: result.synced,
      error: result.error,
    });

    // Poczekaj 2 sekundy między użytkownikami (rate limiting Strava)
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  const totalSynced = results.reduce((sum, r) => sum + r.synced, 0);
  const errors = results.filter((r) => r.error);

  return NextResponse.json({
    success: true,
    users_processed: users.length,
    total_activities_synced: totalSynced,
    errors: errors.length,
    results,
  });
}
