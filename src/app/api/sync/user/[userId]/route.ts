import { NextRequest, NextResponse } from "next/server";
import { syncUserActivities } from "@/lib/strava";

// Synchronizacja pojedynczego użytkownika
// Wywołaj: POST /api/sync/user/[userId]
// Header: Authorization: Bearer <SYNC_WEBHOOK_SECRET>
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  const { userId } = await params;

  const authHeader = request.headers.get("authorization");
  const webhookSecret = process.env.SYNC_WEBHOOK_SECRET;

  // Sprawdź token LUB czy to zalogowany admin (cookie)
  const cookieUserId = request.cookies.get("lsk_user_id")?.value;
  const isOwnSync = cookieUserId === userId;
  const isAuthorized =
    isOwnSync || authHeader === `Bearer ${webhookSecret}`;

  if (!isAuthorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await syncUserActivities(userId);

  return NextResponse.json({
    success: !result.error,
    synced: result.synced,
    error: result.error,
  });
}
