// Obliczanie metryk treningowych Strava (NP, IF, TSS, hrTSS, strefy)
// Port z n8n Code Node (02_code_node_metrics.js)

const FTP = 280;
const MAX_HR = 190;
const RESTING_HR = 45;

const POWER_ZONES = [
  { min: 0,           max: FTP * 0.55 },
  { min: FTP * 0.55,  max: FTP * 0.75 },
  { min: FTP * 0.75,  max: FTP * 0.90 },
  { min: FTP * 0.90,  max: FTP * 1.05 },
  { min: FTP * 1.05,  max: FTP * 1.20 },
  { min: FTP * 1.20,  max: FTP * 1.50 },
  { min: FTP * 1.50,  max: Infinity   },
];

const HR_ZONES = [
  { min: 0,             max: MAX_HR * 0.60 },
  { min: MAX_HR * 0.60, max: MAX_HR * 0.70 },
  { min: MAX_HR * 0.70, max: MAX_HR * 0.80 },
  { min: MAX_HR * 0.80, max: MAX_HR * 0.90 },
  { min: MAX_HR * 0.90, max: Infinity       },
];

const TRIMP_COEFFICIENTS = [1.0, 1.1, 1.2, 2.0, 4.5];

export interface StravaStream {
  type: string;
  data: number[];
}

export interface ActivityMetrics {
  is_ride: boolean;
  has_power_data: boolean;
  has_stream_data: boolean;
  normalized_power: number | null;
  intensity_factor: number | null;
  tss: number | null;
  hr_tss: number | null;
  trimp: number | null;
  effective_tss: number;
  ftp_at_time: number;
  power_z1_seconds: number;
  power_z2_seconds: number;
  power_z3_seconds: number;
  power_z4_seconds: number;
  power_z5_seconds: number;
  power_z6_seconds: number;
  power_z7_seconds: number;
  hr_z1_seconds: number;
  hr_z2_seconds: number;
  hr_z3_seconds: number;
  hr_z4_seconds: number;
  hr_z5_seconds: number;
  processing_errors: string[];
}

function expandToPerSecond(data: number[], timeSeries: number[]): number[] {
  if (!timeSeries || data.length !== timeSeries.length) return data;
  const expanded: number[] = [];
  for (let i = 0; i < timeSeries.length - 1; i++) {
    const dt = timeSeries[i + 1] - timeSeries[i];
    for (let s = 0; s < dt; s++) {
      const ratio = dt > 0 ? s / dt : 0;
      expanded.push(data[i] + (data[i + 1] - data[i]) * ratio);
    }
  }
  if (data.length > 0) expanded.push(data[data.length - 1]);
  return expanded;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
// Tylko kolumny które na pewno istnieją w tabeli activities
export function pickMetrics(m: ActivityMetrics) {
  return {
    is_ride: m.is_ride,
    has_power_data: m.has_power_data,
    normalized_power: m.normalized_power,
    intensity_factor: m.intensity_factor,
    tss: m.tss,
    hr_tss: m.hr_tss,
    effective_tss: m.effective_tss,
    ftp_at_time: m.ftp_at_time,
    power_z1_seconds: m.power_z1_seconds,
    power_z2_seconds: m.power_z2_seconds,
    power_z3_seconds: m.power_z3_seconds,
    power_z4_seconds: m.power_z4_seconds,
    power_z5_seconds: m.power_z5_seconds,
    power_z6_seconds: m.power_z6_seconds,
    power_z7_seconds: m.power_z7_seconds,
    hr_z1_seconds: m.hr_z1_seconds,
    hr_z2_seconds: m.hr_z2_seconds,
    hr_z3_seconds: m.hr_z3_seconds,
    hr_z4_seconds: m.hr_z4_seconds,
    hr_z5_seconds: m.hr_z5_seconds,
  };
}

export function calculateMetrics(activity: any, streams: StravaStream[]): ActivityMetrics {
  const errors: string[] = [];

  let wattsData: number[] | null = null;
  let hrData: number[] | null = null;
  let timeData: number[] | null = null;

  for (const stream of streams) {
    if (stream.type === "watts") wattsData = stream.data;
    if (stream.type === "heartrate") hrData = stream.data;
    if (stream.type === "time") timeData = stream.data;
  }

  const hasPowerData = wattsData !== null && wattsData.length > 0;
  const hasHrData = hrData !== null && hrData.length > 0;
  const hasStreamData = hasPowerData || hasHrData;
  const movingTime: number = activity.moving_time || activity.elapsed_time || 0;

  const RIDE_TYPES = new Set(["Ride", "VirtualRide", "EBikeRide", "GravelRide", "MountainBikeRide", "Velomobile"]);
  const isRide = RIDE_TYPES.has(activity.sport_type) || RIDE_TYPES.has(activity.type);

  // --- Moc ---
  let normalizedPower: number | null = null;
  let intensityFactor: number | null = null;
  let tss: number | null = null;
  const powerZoneSeconds = [0, 0, 0, 0, 0, 0, 0];

  if (hasPowerData && wattsData) {
    try {
      const watts = timeData ? expandToPerSecond(wattsData, timeData) : wattsData;

      for (const w of watts) {
        for (let z = 0; z < POWER_ZONES.length; z++) {
          if (w >= POWER_ZONES[z].min && w < POWER_ZONES[z].max) {
            powerZoneSeconds[z]++;
            break;
          }
        }
      }

      if (watts.length >= 30) {
        const rollingAvg: number[] = [];
        let sum = 0;
        for (let i = 0; i < watts.length; i++) {
          sum += watts[i];
          if (i >= 30) sum -= watts[i - 30];
          if (i >= 29) rollingAvg.push(sum / 30);
        }
        const fourthPowerMean = rollingAvg.reduce((acc, v) => acc + Math.pow(v, 4), 0) / rollingAvg.length;
        normalizedPower = Math.round(Math.pow(fourthPowerMean, 0.25));
        intensityFactor = Math.round((normalizedPower / FTP) * 1000) / 1000;
        tss = Math.round((watts.length * normalizedPower * intensityFactor) / (FTP * 3600) * 100);
      } else {
        errors.push("Power data too short for NP (<30s)");
        const avgWatts = watts.reduce((a, b) => a + b, 0) / watts.length;
        normalizedPower = Math.round(avgWatts);
        intensityFactor = Math.round((avgWatts / FTP) * 1000) / 1000;
        tss = Math.round((watts.length * avgWatts * intensityFactor) / (FTP * 3600) * 100);
      }
    } catch (e) {
      errors.push(`Power calc error: ${e instanceof Error ? e.message : e}`);
    }
  }

  // --- HR ---
  let hrTss: number | null = null;
  let trimp: number | null = null;
  const hrZoneSeconds = [0, 0, 0, 0, 0];

  if (hasHrData && hrData) {
    try {
      const hr = timeData ? expandToPerSecond(hrData, timeData) : hrData;

      for (const h of hr) {
        for (let z = 0; z < HR_ZONES.length; z++) {
          if (h >= HR_ZONES[z].min && h < HR_ZONES[z].max) {
            hrZoneSeconds[z]++;
            break;
          }
        }
      }

      trimp = Math.round(
        hrZoneSeconds.reduce((acc, secs, z) => acc + (secs / 60) * TRIMP_COEFFICIENTS[z], 0)
      );

      const hrReserve = MAX_HR - RESTING_HR;
      const avgHr = hr.reduce((a, b) => a + b, 0) / hr.length;
      const hrRatio = (avgHr - RESTING_HR) / hrReserve;
      const durationHours = hr.length / 3600;
      const coeff = TRIMP_COEFFICIENTS[
        hrRatio < 0.6 ? 0 : hrRatio < 0.7 ? 1 : hrRatio < 0.8 ? 2 : hrRatio < 0.9 ? 3 : 4
      ];
      hrTss = Math.round(durationHours * hrRatio * 100 * coeff);
    } catch (e) {
      errors.push(`HR calc error: ${e instanceof Error ? e.message : e}`);
    }
  }

  // --- Fallback: Strava weighted_average_watts gdy brak streamu mocy ---
  // Strava nie zawsze zwraca per-sekundowy stream watts, ale ma WAP w podsumowaniu aktywności
  const stravaWap: number | null = (activity.weighted_average_watts ?? null) as number | null;
  if (!hasPowerData && stravaWap && stravaWap > 0) {
    normalizedPower = Math.round(stravaWap);
    intensityFactor = Math.round((stravaWap / FTP) * 1000) / 1000;
    tss = Math.round((movingTime * stravaWap * intensityFactor) / (FTP * 3600) * 100);
    errors.push("Power from Strava WAP fallback (no stream)");
  }

  // --- Effective TSS ---
  let effectiveTss: number;
  if (tss !== null && tss > 0) {
    effectiveTss = tss;
  } else if (hrTss !== null && hrTss > 0) {
    effectiveTss = hrTss;
  } else {
    effectiveTss = Math.round((movingTime / 3600) * 40);
    errors.push("No power/HR data — time-based TSS estimate");
  }

  return {
    is_ride: isRide,
    has_power_data: hasPowerData || (stravaWap !== null && stravaWap > 0),
    has_stream_data: hasStreamData,
    normalized_power: normalizedPower,
    intensity_factor: intensityFactor,
    tss,
    hr_tss: hrTss,
    trimp,
    effective_tss: effectiveTss,
    ftp_at_time: FTP,
    power_z1_seconds: powerZoneSeconds[0],
    power_z2_seconds: powerZoneSeconds[1],
    power_z3_seconds: powerZoneSeconds[2],
    power_z4_seconds: powerZoneSeconds[3],
    power_z5_seconds: powerZoneSeconds[4],
    power_z6_seconds: powerZoneSeconds[5],
    power_z7_seconds: powerZoneSeconds[6],
    hr_z1_seconds: hrZoneSeconds[0],
    hr_z2_seconds: hrZoneSeconds[1],
    hr_z3_seconds: hrZoneSeconds[2],
    hr_z4_seconds: hrZoneSeconds[3],
    hr_z5_seconds: hrZoneSeconds[4],
    processing_errors: errors,
  };
}
