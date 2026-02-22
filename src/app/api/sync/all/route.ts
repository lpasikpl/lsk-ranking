import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { syncUserActivities } from "@/lib/strava";
import { cookies } from "next/headers";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const webhookSecret = process.env.SYNC_WEBHOOK_SECRET;

  // Autoryzacja: Bearer secret LUB zalogowany admin
  const isBearerAuth = webhookSecret && authHeader === `Bearer ${webhookSecret}`;

  let isAdminAuth = false;
  if (!isBearerAuth) {
    const cookieStore = await cookies();
    const userId = cookieStore.get("lsk_user_id")?.value;
    if (userId) {
      const supabaseCheck = createServiceClient();
      const { data: u } = await supabaseCheck.from("users").select("is_admin").eq("id", userId).single();
      isAdminAuth = u?.is_admin === true;
    }
  }

  if (!isBearerAuth && !isAdminAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createServiceClient();

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

  const results = [];

  const START_2025 = Math.floor(new Date("2025-01-01T00:00:00Z").getTime() / 1000);

  for (const user of users) {
    // Pobierz timestamp ostatniej udanej synchronizacji (fallback: 2025-01-01)
    const { data: lastSync } = await supabase
      .from("sync_logs")
      .select("created_at")
      .eq("user_id", user.id)
      .eq("status", "success")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    const afterTimestamp = lastSync
      ? Math.floor(new Date(lastSync.created_at).getTime() / 1000) - 3600
      : START_2025;

    const result = await syncUserActivities(user.id, { afterTimestamp });
    results.push({
      userId: user.id,
      name: `${user.firstname} ${user.lastname}`,
      synced: result.synced,
      error: result.error,
    });
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  return NextResponse.json({
    success: true,
    users_processed: users.length,
    results,
  });
}
