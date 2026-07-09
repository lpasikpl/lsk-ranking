import { NextRequest, NextResponse } from "next/server";
import { supabaseStravaService } from "@/lib/supabase-strava";
import { openGarminSession, fetchGarminDay } from "@/lib/garmin-mcp";

export const maxDuration = 300;

const DAY = 86_400_000;
const ymd = (d: Date) => d.toISOString().slice(0, 10);
const addDays = (s: string, n: number) => ymd(new Date(Date.parse(s) + n * DAY));

// Pobiera dane z Garmin MCP i upsertuje do garmin_daily.
// Body (opcjonalny):
//   { date: "YYYY-MM-DD" }               -> jeden dzień
//   { startDate, endDate }               -> zakres
//   {} lub brak                          -> auto: od (ostatni dzień w bazie + 1) do wczoraj, max 14 dni
// Wywoływane przez cron (n8n / Vercel) z Bearer SYNC_WEBHOOK_SECRET.
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization");
  const secret = process.env.SYNC_WEBHOOK_SECRET;
  if (!secret || authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { date?: string; startDate?: string; endDate?: string; maxDays?: number } = {};
  try { body = (await request.json()) ?? {}; } catch { /* pusty body OK */ }

  const yesterday = ymd(new Date(Date.now() - DAY));

  // Ustal listę dat do pobrania
  let dates: string[] = [];
  if (body.date) {
    dates = [body.date];
  } else if (body.startDate && body.endDate) {
    for (let d = body.startDate; d <= body.endDate; d = addDays(d, 1)) dates.push(d);
  } else {
    // auto catch-up od ostatniego dnia w bazie
    const { data: last } = await supabaseStravaService
      .from("garmin_daily")
      .select("calendar_date")
      .order("calendar_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    const start = last?.calendar_date ? addDays(last.calendar_date, 1) : yesterday;
    for (let d = start; d <= yesterday; d = addDays(d, 1)) dates.push(d);
  }

  const cap = Math.min(body.maxDays ?? 14, 31);
  if (dates.length > cap) dates = dates.slice(-cap); // najnowsze dni mają priorytet

  if (dates.length === 0) {
    return NextResponse.json({ success: true, upserted: 0, dates: [], note: "Brak dni do pobrania (baza aktualna)." });
  }

  let callTool;
  try {
    callTool = await openGarminSession();
  } catch (e) {
    return NextResponse.json({ error: `MCP init: ${(e as Error).message}` }, { status: 502 });
  }

  const rows = [];
  const errors: Array<{ date: string; error: string }> = [];
  for (const date of dates) {
    try {
      const rec = await fetchGarminDay(callTool, date);
      rows.push({ ...rec, updated_at: new Date().toISOString() });
    } catch (e) {
      errors.push({ date, error: (e as Error).message });
    }
  }

  if (rows.length > 0) {
    const { error } = await supabaseStravaService
      .from("garmin_daily")
      .upsert(rows, { onConflict: "calendar_date" });
    if (error) {
      return NextResponse.json({ error: error.message, errors }, { status: 500 });
    }
  }

  return NextResponse.json({
    success: true,
    upserted: rows.length,
    dates: rows.map((r) => r.calendar_date),
    errors: errors.length ? errors : undefined,
  });
}
