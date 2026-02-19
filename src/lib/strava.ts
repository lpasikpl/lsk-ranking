import { createServiceClient } from "@/lib/supabase/server";

export interface StravaAthlete {
  id: number;
  username: string;
  firstname: string;
  lastname: string;
  profile_medium: string;
  profile: string;
  city: string;
  country: string;
}

export interface StravaActivity {
  id: number;
  name: string;
  type: string;
  sport_type: string;
  distance: number;
  moving_time: number;
  elapsed_time: number;
  total_elevation_gain: number;
  start_date: string;
  start_date_local: string;
}

export interface StravaTokenResponse {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  athlete?: StravaAthlete;
}

const STRAVA_API_BASE = "https://www.strava.com/api/v3";
const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token";

export async function exchangeCodeForTokens(
  code: string
): Promise<StravaTokenResponse> {
  const response = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Strava token exchange failed: ${error}`);
  }

  return response.json();
}

export async function refreshAccessToken(refreshToken: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_at: number;
}> {
  const response = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to refresh Strava token");
  }

  return response.json();
}

export async function getValidAccessToken(userId: string): Promise<string> {
  const supabase = createServiceClient();

  const { data: tokenData, error } = await supabase
    .from("strava_tokens")
    .select("*")
    .eq("user_id", userId)
    .single();

  if (error || !tokenData) {
    throw new Error("No token found for user");
  }

  const now = Math.floor(Date.now() / 1000);
  if (tokenData.expires_at > now + 300) {
    return tokenData.access_token;
  }

  // Token wygasł - odśwież
  const refreshed = await refreshAccessToken(tokenData.refresh_token);

  await supabase
    .from("strava_tokens")
    .update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      expires_at: refreshed.expires_at,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId);

  return refreshed.access_token;
}

export async function getAthleteActivities(
  accessToken: string,
  params: {
    before?: number;
    after?: number;
    page?: number;
    per_page?: number;
  } = {}
): Promise<StravaActivity[]> {
  const searchParams = new URLSearchParams();
  if (params.before) searchParams.set("before", params.before.toString());
  if (params.after) searchParams.set("after", params.after.toString());
  if (params.page) searchParams.set("page", params.page.toString());
  searchParams.set("per_page", (params.per_page || 200).toString());

  const response = await fetch(
    `${STRAVA_API_BASE}/athlete/activities?${searchParams}`,
    {
      headers: { Authorization: `Bearer ${accessToken}` },
    }
  );

  if (response.status === 429) {
    throw new Error("RATE_LIMIT_EXCEEDED");
  }

  if (!response.ok) {
    throw new Error(`Strava API error: ${response.status}`);
  }

  return response.json();
}

export async function syncUserActivities(
  userId: string,
  options: { afterTimestamp?: number } = {}
): Promise<{ synced: number; error?: string }> {
  const supabase = createServiceClient();

  try {
    const accessToken = await getValidAccessToken(userId);

    const allActivities: StravaActivity[] = [];
    let page = 1;
    const PER_PAGE = 200;

    while (true) {
      const activities = await getAthleteActivities(accessToken, {
        after: options.afterTimestamp,
        page,
        per_page: PER_PAGE,
      });

      if (activities.length === 0) break;

      allActivities.push(...activities);

      if (activities.length < PER_PAGE) break;
      page++;

      // Rate limiting - poczekaj chwilę między requestami
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // Filtruj tylko jazdy rowerem
    const rideActivities = allActivities.filter(
      (a) =>
        a.type === "Ride" ||
        a.type === "VirtualRide" ||
        a.sport_type === "Ride" ||
        a.sport_type === "VirtualRide"
    );

    if (rideActivities.length === 0) {
      await supabase.from("sync_logs").insert({
        user_id: userId,
        status: "success",
        activities_synced: 0,
      });
      return { synced: 0 };
    }

    // Upsert aktywności do bazy
    const { error: upsertError } = await supabase.from("lsk_activities").upsert(
      rideActivities.map((a) => ({
        strava_id: a.id,
        user_id: userId,
        name: a.name,
        type: a.type || a.sport_type,
        distance: a.distance,
        moving_time: a.moving_time,
        elapsed_time: a.elapsed_time,
        total_elevation_gain: a.total_elevation_gain,
        start_date: a.start_date,
        start_date_local: a.start_date_local,
      })),
      { onConflict: "strava_id" }
    );

    if (upsertError) {
      throw new Error(upsertError.message);
    }

    await supabase.from("sync_logs").insert({
      user_id: userId,
      status: "success",
      activities_synced: rideActivities.length,
    });

    return { synced: rideActivities.length };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";

    await supabase.from("sync_logs").insert({
      user_id: userId,
      status: "error",
      activities_synced: 0,
      error_message: message,
    });

    return { synced: 0, error: message };
  }
}

export { formatTime, formatDistance, getCountryFlag } from "@/lib/format";
