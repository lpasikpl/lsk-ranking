// Pobieranie pliku FIT z Strava API (export_original)

import { createServiceClient } from "@/lib/supabase/server";

// Pobierz aktualny access token dla usera
async function getStravaToken(userId: string): Promise<string | null> {
  const supabase = createServiceClient();

  const { data: tokenData } = await supabase
    .from("strava_tokens")
    .select("access_token, refresh_token, expires_at")
    .eq("user_id", userId)
    .single();

  if (!tokenData) return null;

  // Sprawdz czy token jest aktualny (dodaj 5 min bufor)
  const nowSeconds = Math.floor(Date.now() / 1000);
  if (tokenData.expires_at > nowSeconds + 300) {
    return tokenData.access_token;
  }

  // Odswierz token
  const refreshed = await refreshStravaToken(tokenData.refresh_token);
  if (!refreshed) return null;

  // Zapisz nowy token
  await supabase
    .from("strava_tokens")
    .update({
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      expires_at: refreshed.expires_at,
    })
    .eq("user_id", userId);

  return refreshed.access_token;
}

async function refreshStravaToken(refreshToken: string) {
  const res = await fetch("https://www.strava.com/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  if (!res.ok) return null;
  return res.json();
}

// Pobierz plik FIT z Strava API
export async function downloadFitFile(
  stravaActivityId: bigint | number,
  userId: string
): Promise<Buffer | null> {
  const accessToken = await getStravaToken(userId);
  if (!accessToken) {
    console.error("Brak tokenu Strava dla usera:", userId);
    return null;
  }

  const url = `https://www.strava.com/api/v3/activities/${stravaActivityId}/export_original`;

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (res.status === 404) {
    // Aktywnosc nie z Garmina lub brak FIT
    console.log(`Brak pliku FIT dla aktywnosci ${stravaActivityId}`);
    return null;
  }

  if (!res.ok) {
    console.error(`Blad pobierania FIT: ${res.status} ${res.statusText}`);
    return null;
  }

  const arrayBuffer = await res.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

// Upload pliku FIT do Supabase Storage
export async function uploadFitToStorage(
  activityId: bigint | number,
  buffer: Buffer
): Promise<string | null> {
  const supabase = createServiceClient();
  const path = `activities/${activityId}.fit`;

  const { error } = await supabase.storage
    .from("fit-files")
    .upload(path, buffer, {
      contentType: "application/octet-stream",
      upsert: true,
    });

  if (error) {
    console.error("Blad uploadu FIT:", error);
    return null;
  }

  return path;
}
