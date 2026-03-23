// Wysylanie danych do n8n i przyjmowanie callbacku z komentarzami AI

export interface PowerZoneStat {
  zone: string;
  seconds: number;
  pct: number;
}

export interface LapSummary {
  n: number;
  time: number;
  avg_power: number | null;
  np: number | null;
  avg_hr: number | null;
  avg_cadence: number | null;
}

export interface GearUsage {
  combo: string;
  seconds: number;
  pct: number;
  avg_power: number | null;
}

export interface N8nPayload {
  activity_id: number;
  callback_url: string;
  secret: string;
  athlete: {
    ftp: number;
    weight: number;
    max_hr: number;
    resting_hr: number;
  };
  session: {
    name: string;
    date: string;
    distance_km: number;
    time_seconds: number;
    avg_power: number | null;
    normalized_power: number | null;
    intensity_factor: number | null;
    tss: number | null;
    avg_hr: number | null;
    max_hr: number | null;
    avg_cadence: number | null;
    total_ascent: number | null;
    total_work_kj: number | null;
    avg_temperature: number | null;
    training_effect_aerobic: number | null;
    training_effect_anaerobic: number | null;
  };
  power_zones: PowerZoneStat[];
  laps_summary: LapSummary[];
  decoupling: {
    ef_first_half: number | null;
    ef_second_half: number | null;
    drift_pct: number | null;
  };
  pedaling: {
    first_half_te: number | null;
    first_half_ps: number | null;
    second_half_te: number | null;
    second_half_ps: number | null;
  };
  gear_usage: GearUsage[];
}

// Oblicz decoupling z lapow
export function calculateDecoupling(laps: any[]): {
  ef_first_half: number | null;
  ef_second_half: number | null;
  drift_pct: number | null;
} {
  if (laps.length < 2) return { ef_first_half: null, ef_second_half: null, drift_pct: null };

  const half = Math.floor(laps.length / 2);
  const firstHalf = laps.slice(0, half);
  const secondHalf = laps.slice(half);

  const avgEf = (lapGroup: any[]) => {
    const withData = lapGroup.filter(l => l.normalized_power && l.avg_hr);
    if (withData.length === 0) return null;
    const totalTime = withData.reduce((s, l) => s + (l.total_time_seconds ?? 0), 0);
    if (totalTime === 0) return null;
    const weightedEf = withData.reduce((s, l) => {
      const ef = l.normalized_power / l.avg_hr;
      return s + ef * (l.total_time_seconds ?? 0);
    }, 0);
    return weightedEf / totalTime;
  };

  const ef1 = avgEf(firstHalf);
  const ef2 = avgEf(secondHalf);

  if (!ef1 || !ef2) return { ef_first_half: ef1, ef_second_half: ef2, drift_pct: null };

  const drift = ((ef2 - ef1) / ef1) * 100;

  return {
    ef_first_half: Math.round(ef1 * 1000) / 1000,
    ef_second_half: Math.round(ef2 * 1000) / 1000,
    drift_pct: Math.round(drift * 10) / 10,
  };
}

// Oblicz pedaling dynamics z rekordow
export function calculatePedalingDynamics(records: any[]): {
  first_half_te: number | null;
  first_half_ps: number | null;
  second_half_te: number | null;
  second_half_ps: number | null;
} {
  const withPedaling = records.filter(r => r.left_torque_effectiveness != null);
  if (withPedaling.length < 2) {
    return { first_half_te: null, first_half_ps: null, second_half_te: null, second_half_ps: null };
  }

  const half = Math.floor(withPedaling.length / 2);
  const avg = (arr: any[], key: string) => {
    const vals = arr.map(r => r[key]).filter(v => v != null);
    if (vals.length === 0) return null;
    return Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 10) / 10;
  };

  return {
    first_half_te: avg(withPedaling.slice(0, half), "left_torque_effectiveness"),
    first_half_ps: avg(withPedaling.slice(0, half), "left_pedal_smoothness"),
    second_half_te: avg(withPedaling.slice(half), "left_torque_effectiveness"),
    second_half_ps: avg(withPedaling.slice(half), "left_pedal_smoothness"),
  };
}

// Oblicz uzycie przerzutek z gear events
export function calculateGearUsage(
  gearEvents: any[],
  totalSeconds: number
): GearUsage[] {
  if (gearEvents.length === 0) return [];

  // Oblicz czas per kombinacja
  const gearTime: Record<string, { seconds: number; powers: number[] }> = {};

  for (let i = 0; i < gearEvents.length; i++) {
    const evt = gearEvents[i];
    const nextEvt = gearEvents[i + 1];
    const duration = nextEvt
      ? nextEvt.seconds_offset - evt.seconds_offset
      : totalSeconds - evt.seconds_offset;

    if (duration <= 0) continue;
    const combo = `${evt.front_gear}/${evt.rear_gear}`;
    if (!gearTime[combo]) gearTime[combo] = { seconds: 0, powers: [] };
    gearTime[combo].seconds += duration;
    if (evt.power_at_change != null) gearTime[combo].powers.push(evt.power_at_change);
  }

  return Object.entries(gearTime)
    .map(([combo, { seconds, powers }]) => ({
      combo,
      seconds,
      pct: Math.round((seconds / totalSeconds) * 1000) / 10,
      avg_power:
        powers.length > 0
          ? Math.round(powers.reduce((a, b) => a + b, 0) / powers.length)
          : null,
    }))
    .sort((a, b) => b.seconds - a.seconds)
    .slice(0, 10);
}

// Wyslij payload do n8n
export async function sendToN8n(payload: N8nPayload): Promise<boolean> {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;
  if (!webhookUrl) {
    console.error("Brak N8N_WEBHOOK_URL w zmiennych srodowiskowych");
    return false;
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error(`Blad wyslania do n8n: ${res.status} ${res.statusText}`);
      return false;
    }

    return true;
  } catch (e) {
    console.error("Wyjatek przy wyslaniu do n8n:", e);
    return false;
  }
}
