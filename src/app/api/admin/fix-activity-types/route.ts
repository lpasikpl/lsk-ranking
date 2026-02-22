import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";
import { syncUserActivities } from "@/lib/strava";

const AFTER_TIMESTAMP = Math.floor(new Date("2025-01-01T00:00:00Z").getTime() / 1000);

export async function POST(_request: NextRequest) {
  const cookieStore = await cookies();
  const userId = cookieStore.get("lsk_user_id")?.value;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();
  const { data: adminUser } = await supabase.from("users").select("is_admin").eq("id", userId).single();
  if (!adminUser?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: activeUsers } = await supabase
    .from("users")
    .select("id, firstname, lastname")
    .eq("is_active", true);

  if (!activeUsers || activeUsers.length === 0) {
    return NextResponse.json({ success: true, results: [], total: 0 });
  }

  const results: Array<{ userId: string; name: string; synced: number; error?: string }> = [];

  for (const user of activeUsers) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    const result = await syncUserActivities(user.id, { afterTimestamp: AFTER_TIMESTAMP });
    results.push({
      userId: user.id,
      name: `${user.firstname} ${user.lastname}`,
      synced: result.synced,
      error: result.error,
    });
  }

  const total = results.reduce((s, r) => s + r.synced, 0);

  return NextResponse.json({ success: true, results, total, users_processed: activeUsers.length });
}
