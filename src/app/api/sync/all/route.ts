import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { syncUserActivities } from "@/lib/strava";

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const webhookSecret = process.env.SYNC_WEBHOOK_SECRET;

  if (!webhookSecret || authHeader !== `Bearer ${webhookSecret}`) {
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

  for (const user of users) {
    const result = await syncUserActivities(user.id);
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
