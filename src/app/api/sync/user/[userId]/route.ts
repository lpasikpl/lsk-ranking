import { NextRequest, NextResponse } from "next/server";
import { syncUserActivities } from "@/lib/strava";
import { createServiceClient } from "@/lib/supabase/server";

export const maxDuration = 60; // Vercel Pro: 60s, Hobby: 10s (ignorowane ale nie zaszkodzi)

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  const authHeader = request.headers.get("authorization");
  const webhookSecret = process.env.SYNC_WEBHOOK_SECRET;

  const cookieUserId = request.cookies.get("lsk_user_id")?.value;
  const isOwnSync = cookieUserId === userId;
  const isBearerAuth = authHeader === `Bearer ${webhookSecret}`;

  let isAdmin = false;
  if (cookieUserId && !isOwnSync && !isBearerAuth) {
    const supabaseCheck = createServiceClient();
    const { data: adminCheck } = await supabaseCheck
      .from("users")
      .select("is_admin")
      .eq("id", cookieUserId)
      .single();
    isAdmin = adminCheck?.is_admin === true;
  }

  const isAuthorized = isOwnSync || isBearerAuth || isAdmin;

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Sprawdź kiedy była ostatnia udana synchronizacja
  const supabase = createServiceClient();
  const { data: lastSync } = await supabase
    .from("sync_logs")
    .select("created_at")
    .eq("user_id", userId)
    .eq("status", "success")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  let afterTimestamp: number | undefined;
  if (lastSync) {
    // Sync od ostatniej synchronizacji (z buforem -1h)
    afterTimestamp = Math.floor(new Date(lastSync.created_at).getTime() / 1000) - 3600;
  } else {
    // Pierwsze logowanie - pobierz aktywności od 2025-01-01
    afterTimestamp = Math.floor(new Date("2025-01-01T00:00:00Z").getTime() / 1000);
  }

  const result = await syncUserActivities(userId, { afterTimestamp });

  return NextResponse.json({
    success: !result.error,
    synced: result.synced,
    error: result.error,
  });
}
