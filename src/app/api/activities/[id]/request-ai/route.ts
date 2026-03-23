// Trigger wysłania danych do n8n z UI (bez ponownego przetwarzania FIT)
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import {
  calculateDecoupling,
  calculateGearUsage,
  calculatePedalingDynamics,
  sendToN8n,
  type N8nPayload,
} from "@/lib/n8n-webhook";

async function getAdminUser(cookieStore: any) {
  const userId = cookieStore.get("lsk_user_id")?.value;
  if (!userId) return null;
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("users")
    .select("id, is_admin")
    .eq("id", userId)
    .single();
  return data?.is_admin ? data : null;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const activityId = parseInt(id, 10);

  const cookieStore = await cookies();
  const adminUser = await getAdminUser(cookieStore);
  if (!adminUser) {
    return NextResponse.json({ error: "Brak dostepu" }, { status: 403 });
  }

  const supabase = createServiceClient();

  // Pobierz wszystkie dane potrzebne do payloadu
  const [actRes, fitRes, lapsRes, recordsRes, gearRes, settingsRes] = await Promise.all([
    supabase.from("activities").select("*").eq("id", activityId).single(),
    supabase.from("fit_activities").select("*").eq("activity_id", activityId).single(),
    supabase.from("fit_laps").select("*").eq("activity_id", activityId).order("lap_number"),
    supabase.from("fit_records").select("seconds_offset,left_torque_effectiveness,left_pedal_smoothness").eq("activity_id", activityId).order("seconds_offset"),
    supabase.from("fit_gear_events").select("*").eq("activity_id", activityId).order("seconds_offset"),
    supabase.from("athlete_settings").select("ftp, max_hr, resting_hr").single(),
  ]);

  if (!actRes.data) {
    return NextResponse.json({ error: "Aktywnosc nie znaleziona" }, { status: 404 });
  }

  const activity = actRes.data;
  const fitData = fitRes.data;
  const laps = lapsRes.data ?? [];
  const records = recordsRes.data ?? [];
  const gearEvents = gearRes.data ?? [];
  const ftp = settingsRes.data?.ftp ?? 280;
  const maxHr = settingsRes.data?.max_hr ?? 190;
  const restingHr = settingsRes.data?.resting_hr ?? 45;

  const decoupling = calculateDecoupling(laps);
  const pedalingDynamics = calculatePedalingDynamics(records);
  const totalSeconds = activity.moving_time_seconds ?? 0;
  const gearUsage = calculateGearUsage(gearEvents, totalSeconds);

  const zoneSecs = [
    activity.power_z1_seconds ?? 0,
    activity.power_z2_seconds ?? 0,
    activity.power_z3_seconds ?? 0,
    activity.power_z4_seconds ?? 0,
    activity.power_z5_seconds ?? 0,
    activity.power_z6_seconds ?? 0,
    activity.power_z7_seconds ?? 0,
  ];
  const totalZoneSecs = zoneSecs.reduce((a, b) => a + b, 0) || 1;

  const payload: N8nPayload = {
    activity_id: activityId,
    callback_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://lsk-ranking.vercel.app"}/api/activities/${activityId}/ai-comment`,
    secret: process.env.N8N_WEBHOOK_SECRET ?? "",
    athlete: { ftp, weight: 80, max_hr: maxHr, resting_hr: restingHr },
    session: {
      name: activity.name ?? "",
      date: activity.start_date ? new Date(activity.start_date).toISOString().split("T")[0] : "",
      distance_km: Math.round((activity.distance_meters ?? 0) / 100) / 10,
      time_seconds: totalSeconds,
      avg_power: activity.average_watts,
      normalized_power: activity.weighted_average_watts,
      intensity_factor: activity.intensity_factor,
      tss: activity.tss,
      avg_hr: activity.average_heartrate,
      max_hr: activity.max_heartrate,
      avg_cadence: activity.average_cadence,
      total_ascent: activity.total_elevation_gain,
      total_work_kj: fitData?.total_work_kj ?? null,
      avg_temperature: fitData?.avg_temperature ?? null,
      training_effect_aerobic: fitData?.training_effect_aerobic ?? null,
      training_effect_anaerobic: fitData?.training_effect_anaerobic ?? null,
    },
    power_zones: zoneSecs.map((s, i) => ({
      zone: `Z${i + 1}`,
      seconds: s,
      pct: Math.round((s / totalZoneSecs) * 1000) / 10,
    })),
    laps_summary: laps.map((l: any, i: number) => ({
      n: i + 1,
      time: Math.round(l.total_time_seconds ?? 0),
      avg_power: l.avg_power,
      np: l.normalized_power,
      avg_hr: l.avg_hr,
      avg_cadence: l.avg_cadence,
    })),
    decoupling,
    pedaling: pedalingDynamics,
    gear_usage: gearUsage,
  };

  const sent = await sendToN8n(payload);
  if (!sent) {
    return NextResponse.json({ error: "Blad wyslania do n8n" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
