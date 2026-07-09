import { NextRequest, NextResponse } from "next/server";
import { supabaseStravaService } from "@/lib/supabase-strava";
import type { GarminDaily } from "@/lib/strava-types";

export const maxDuration = 60;

// Dozwolone kolumny tabeli garmin_daily (whitelist — odrzucamy nieznane pola)
const COLUMNS: (keyof GarminDaily)[] = [
  "calendar_date",
  "hrv_last_night", "hrv_weekly_avg", "hrv_status", "hrv_baseline_low", "hrv_baseline_upper",
  "resting_hr",
  "readiness_score", "readiness_level", "readiness_feedback", "acute_load", "recovery_time",
  "sleep_score", "sleep_seconds", "deep_seconds", "light_seconds", "rem_seconds", "awake_seconds",
  "sleep_avg_hr", "sleep_avg_overnight_hrv", "sleep_avg_stress", "sleep_avg_respiration", "sleep_feedback",
];

function sanitize(rec: Record<string, unknown>): Record<string, unknown> | null {
  const date = rec.calendar_date;
  if (typeof date !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const out: Record<string, unknown> = {};
  for (const col of COLUMNS) {
    if (rec[col] !== undefined) out[col] = rec[col];
  }
  out.updated_at = new Date().toISOString();
  return out;
}

// Endpoint do zaciągania danych Garmin (cloud routine Claude o ~8:30 lub ręczny backfill)
// Body: { records: GarminDaily[] }  albo pojedynczy rekord GarminDaily
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const webhookSecret = process.env.SYNC_WEBHOOK_SECRET;
  if (!webhookSecret || authHeader !== `Bearer ${webhookSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const raw = Array.isArray(body)
    ? body
    : Array.isArray((body as { records?: unknown })?.records)
      ? (body as { records: unknown[] }).records
      : [body];

  const rows = raw
    .map((r) => sanitize(r as Record<string, unknown>))
    .filter((r): r is Record<string, unknown> => r !== null);

  if (rows.length === 0) {
    return NextResponse.json({ error: "No valid records" }, { status: 400 });
  }

  const { error, count } = await supabaseStravaService
    .from("garmin_daily")
    .upsert(rows, { onConflict: "calendar_date", count: "exact" });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, upserted: count ?? rows.length });
}
