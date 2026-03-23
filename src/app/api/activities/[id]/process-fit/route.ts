// Ręczne przetworzenie pliku FIT dla aktywności
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/server";
import { downloadFitFile, uploadFitToStorage } from "@/lib/strava-fit";
import { parseFitFile } from "@/lib/fit-parser";
import {
  calculateDecoupling,
  calculateGearUsage,
  calculatePedalingDynamics,
  sendToN8n,
  type N8nPayload,
} from "@/lib/n8n-webhook";

// Pobierz admin user_id z cookies i sprawdz is_admin
async function getAdminUser(cookieStore: any) {
  const userId = cookieStore.get("lsk_user_id")?.value;
  if (!userId) return null;
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("users")
    .select("id, is_admin, strava_id")
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
  if (isNaN(activityId)) {
    return NextResponse.json({ error: "Nieprawidlowe ID aktywnosci" }, { status: 400 });
  }

  const cookieStore = await cookies();
  const adminUser = await getAdminUser(cookieStore);
  if (!adminUser) {
    return NextResponse.json({ error: "Brak dostepu" }, { status: 403 });
  }

  const supabase = createServiceClient();

  // Pobierz aktywnosc z bazy
  const { data: activity, error: actErr } = await supabase
    .from("activities")
    .select("id, strava_activity_id, name, start_date, distance_meters, moving_time_seconds, average_watts, weighted_average_watts, intensity_factor, tss, average_heartrate, max_heartrate, average_cadence, total_elevation_gain, power_z1_seconds, power_z2_seconds, power_z3_seconds, power_z4_seconds, power_z5_seconds, power_z6_seconds, power_z7_seconds")
    .eq("id", activityId)
    .single();

  if (actErr || !activity) {
    return NextResponse.json({ error: "Aktywnosc nie znaleziona" }, { status: 404 });
  }

  // Pobierz plik FIT
  const fitBuffer = await downloadFitFile(activity.strava_activity_id, adminUser.id);

  if (!fitBuffer) {
    // Brak FIT - oznacz jako przetworzone bez danych FIT
    await supabase
      .from("activities")
      .update({ has_fit_analysis: true })
      .eq("id", activityId);
    return NextResponse.json({ ok: true, hasFit: false, message: "Brak pliku FIT (nie z Garmina)" });
  }

  // Parsuj FIT
  let parsedData;
  try {
    parsedData = await parseFitFile(fitBuffer);
  } catch (e) {
    console.error("Blad parsowania FIT:", e);
    return NextResponse.json({ error: "Blad parsowania pliku FIT" }, { status: 500 });
  }

  const { session, laps, records, gearEvents } = parsedData;

  // Upload do Storage
  const fitPath = await uploadFitToStorage(activityId, fitBuffer);

  // Zapisz fit_activities
  const { error: faErr } = await supabase
    .from("fit_activities")
    .upsert({
      activity_id: activityId,
      total_work_kj: session.total_work_kj,
      avg_temperature: session.avg_temperature,
      max_temperature: session.max_temperature,
      avg_left_torque_effectiveness: session.avg_left_torque_effectiveness,
      avg_left_pedal_smoothness: session.avg_left_pedal_smoothness,
      training_effect_aerobic: session.training_effect_aerobic,
      training_effect_anaerobic: session.training_effect_anaerobic,
      avg_vam: session.avg_vam,
      threshold_power_from_device: session.threshold_power_from_device,
      max_hr_from_device: session.max_hr_from_device,
      threshold_hr_from_device: session.threshold_hr_from_device,
      resting_hr_from_device: session.resting_hr_from_device,
      has_fit_data: true,
      has_pedaling_data: session.has_pedaling_data,
      has_gear_data: session.has_gear_data,
      has_temperature_data: session.has_temperature_data,
      fit_file_path: fitPath,
      processed_at: new Date().toISOString(),
    }, { onConflict: "activity_id" });

  if (faErr) console.error("Blad zapisu fit_activities:", faErr);

  // Zapisz fit_laps
  if (laps.length > 0) {
    await supabase.from("fit_laps").delete().eq("activity_id", activityId);
    const { error: lapErr } = await supabase.from("fit_laps").insert(
      laps.map(lap => ({ activity_id: activityId, ...lap }))
    );
    if (lapErr) console.error("Blad zapisu fit_laps:", lapErr);
  }

  // Zapisz fit_records
  if (records.length > 0) {
    await supabase.from("fit_records").delete().eq("activity_id", activityId);
    // Wstaw partiami po 500
    for (let i = 0; i < records.length; i += 500) {
      const batch = records.slice(i, i + 500);
      const { error: recErr } = await supabase.from("fit_records").insert(
        batch.map(r => ({ activity_id: activityId, ...r }))
      );
      if (recErr) console.error("Blad zapisu fit_records (batch):", recErr);
    }
  }

  // Zapisz fit_gear_events
  if (gearEvents.length > 0) {
    await supabase.from("fit_gear_events").delete().eq("activity_id", activityId);
    const { error: gearErr } = await supabase.from("fit_gear_events").insert(
      gearEvents.map(g => ({ activity_id: activityId, ...g }))
    );
    if (gearErr) console.error("Blad zapisu fit_gear_events:", gearErr);
  }

  // Zaktualizuj activities.has_fit_analysis
  await supabase
    .from("activities")
    .update({ has_fit_analysis: true })
    .eq("id", activityId);

  // Przygotuj payload do n8n
  const athleteSettings = await supabase
    .from("athlete_settings")
    .select("ftp, max_hr, resting_hr")
    .single();

  const ftp = athleteSettings.data?.ftp ?? 280;
  const maxHr = athleteSettings.data?.max_hr ?? 190;
  const restingHr = athleteSettings.data?.resting_hr ?? 45;

  // Oblicz statystyki
  const decoupling = calculateDecoupling(laps);
  const pedalingDynamics = calculatePedalingDynamics(records);
  const totalSeconds = activity.moving_time_seconds ?? 0;
  const gearUsage = calculateGearUsage(gearEvents, totalSeconds);

  // Strefa mocy
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
  const powerZones = zoneSecs.map((s, i) => ({
    zone: `Z${i + 1}`,
    seconds: s,
    pct: Math.round((s / totalZoneSecs) * 1000) / 10,
  }));

  const lapsSummary = laps.map((l, i) => ({
    n: i + 1,
    time: Math.round(l.total_time_seconds ?? 0),
    avg_power: l.avg_power,
    np: l.normalized_power,
    avg_hr: l.avg_hr,
    avg_cadence: l.avg_cadence,
  }));

  const payload: N8nPayload = {
    activity_id: activityId,
    callback_url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://lsk-ranking.vercel.app"}/api/activities/${activityId}/ai-comment`,
    secret: (process.env.N8N_WEBHOOK_SECRET ?? "").trim(),
    athlete: { ftp, weight: 80, max_hr: maxHr, resting_hr: restingHr },
    session: {
      name: activity.name ?? "",
      date: activity.start_date ? new Date(activity.start_date).toISOString().split("T")[0] : "",
      distance_km: Math.round((activity.distance_meters ?? 0) / 100) / 10,
      time_seconds: activity.moving_time_seconds ?? 0,
      avg_power: activity.average_watts,
      normalized_power: activity.weighted_average_watts,
      intensity_factor: activity.intensity_factor,
      tss: activity.tss,
      avg_hr: activity.average_heartrate,
      max_hr: activity.max_heartrate,
      avg_cadence: activity.average_cadence,
      total_ascent: activity.total_elevation_gain,
      total_work_kj: session.total_work_kj,
      avg_temperature: session.avg_temperature,
      training_effect_aerobic: session.training_effect_aerobic,
      training_effect_anaerobic: session.training_effect_anaerobic,
    },
    power_zones: powerZones,
    laps_summary: lapsSummary,
    decoupling,
    pedaling: pedalingDynamics,
    gear_usage: gearUsage,
  };

  // Wyslij do n8n (nie blokuj odpowiedzi)
  sendToN8n(payload).catch(console.error);

  return NextResponse.json({
    ok: true,
    hasFit: true,
    laps: laps.length,
    records: records.length,
    gearEvents: gearEvents.length,
    hasPedaling: session.has_pedaling_data,
    hasGears: session.has_gear_data,
  });
}
