// Parsowanie plików FIT z Garmina (server-side)
// Używa biblioteki fit-file-parser

import FitParser from "fit-file-parser";

// Konwersja semicircles -> stopnie
const semicirclesToDegrees = (sc: number) => sc * (180 / Math.pow(2, 31));

export interface FitSession {
  total_work_kj: number | null;
  avg_temperature: number | null;
  max_temperature: number | null;
  avg_left_torque_effectiveness: number | null;
  avg_left_pedal_smoothness: number | null;
  training_effect_aerobic: number | null;
  training_effect_anaerobic: number | null;
  avg_vam: number | null;
  threshold_power_from_device: number | null;
  max_hr_from_device: number | null;
  threshold_hr_from_device: number | null;
  resting_hr_from_device: number | null;
  has_pedaling_data: boolean;
  has_gear_data: boolean;
  has_temperature_data: boolean;
}

export interface FitLap {
  lap_number: number;
  start_time: string | null;
  total_time_seconds: number | null;
  total_distance_meters: number | null;
  avg_power: number | null;
  max_power: number | null;
  normalized_power: number | null;
  avg_hr: number | null;
  max_hr: number | null;
  avg_cadence: number | null;
  max_cadence: number | null;
  avg_speed: number | null;
  max_speed: number | null;
  total_ascent: number | null;
  total_descent: number | null;
  total_calories: number | null;
  total_work_kj: number | null;
  avg_temperature: number | null;
  avg_left_torque_effectiveness: number | null;
  avg_left_pedal_smoothness: number | null;
  avg_vam: number | null;
}

export interface FitRecord {
  seconds_offset: number;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  power: number | null;
  heart_rate: number | null;
  cadence: number | null;
  speed: number | null; // km/h
  temperature: number | null;
  left_torque_effectiveness: number | null;
  left_pedal_smoothness: number | null;
}

export interface FitGearEvent {
  seconds_offset: number;
  front_gear: number | null;
  rear_gear: number | null;
  power_at_change: number | null;
  speed_at_change: number | null;
}

export interface ParsedFitData {
  session: FitSession;
  laps: FitLap[];
  records: FitRecord[];
  gearEvents: FitGearEvent[];
}

export async function parseFitFile(buffer: Buffer): Promise<ParsedFitData> {
  return new Promise((resolve, reject) => {
    const parser = new FitParser({
      force: true,
      speedUnit: "m/s",
      lengthUnit: "m",
      temperatureUnit: "celsius",
      elapsedRecordField: true,
      mode: "list",
    });

    parser.parse(buffer as Buffer<ArrayBuffer>, (error: Error | null, data: any) => {
      if (error) {
        reject(error);
        return;
      }

      try {
        const result = extractFitData(data);
        resolve(result);
      } catch (e) {
        reject(e);
      }
    });
  });
}

function extractFitData(data: any): ParsedFitData {
  // --- SESSION ---
  const sessionMsg = data.sessions?.[0] ?? data.session?.[0] ?? {};

  const session: FitSession = {
    total_work_kj: sessionMsg.total_work != null ? Math.round(sessionMsg.total_work / 1000) : null,
    avg_temperature: sessionMsg.avg_temperature ?? null,
    max_temperature: sessionMsg.max_temperature ?? null,
    avg_left_torque_effectiveness: sessionMsg.avg_left_torque_effectiveness ?? null,
    avg_left_pedal_smoothness: sessionMsg.avg_left_pedal_smoothness ?? null,
    training_effect_aerobic: sessionMsg.total_training_effect ?? null,
    training_effect_anaerobic: sessionMsg.total_anaerobic_training_effect ?? null,
    avg_vam: sessionMsg.avg_vam ?? null,
    threshold_power_from_device: sessionMsg.threshold_power ?? null,
    max_hr_from_device: sessionMsg.max_heart_rate ?? null,
    threshold_hr_from_device: sessionMsg.threshold_heart_rate ?? null,
    resting_hr_from_device: sessionMsg.resting_heart_rate ?? null,
    has_pedaling_data: sessionMsg.avg_left_torque_effectiveness != null,
    has_gear_data: false, // ustawiane po analizie gear events
    has_temperature_data: sessionMsg.avg_temperature != null,
  };

  // --- LAPS ---
  const lapsRaw: any[] = data.laps ?? [];
  const laps: FitLap[] = lapsRaw.map((lap: any, index: number) => ({
    lap_number: index + 1,
    start_time: lap.start_time ? new Date(lap.start_time).toISOString() : null,
    total_time_seconds: lap.total_elapsed_time ?? lap.total_timer_time ?? null,
    total_distance_meters: lap.total_distance ?? null,
    avg_power: lap.avg_power ?? null,
    max_power: lap.max_power ?? null,
    normalized_power: lap.normalized_power ?? null,
    avg_hr: lap.avg_heart_rate ?? null,
    max_hr: lap.max_heart_rate ?? null,
    avg_cadence: lap.avg_cadence ?? null,
    max_cadence: lap.max_cadence ?? null,
    avg_speed: lap.avg_speed ?? null, // m/s
    max_speed: lap.max_speed ?? null, // m/s
    total_ascent: lap.total_ascent ?? null,
    total_descent: lap.total_descent ?? null,
    total_calories: lap.total_calories ?? null,
    total_work_kj: lap.total_work != null ? Math.round(lap.total_work / 1000) : null,
    avg_temperature: lap.avg_temperature ?? null,
    avg_left_torque_effectiveness: lap.avg_left_torque_effectiveness ?? null,
    avg_left_pedal_smoothness: lap.avg_left_pedal_smoothness ?? null,
    avg_vam: lap.avg_vam ?? null,
  }));

  // --- RECORDS (próbkowanie co 10 rekordów) ---
  const recordsRaw: any[] = data.records ?? [];
  const startTimestamp = recordsRaw[0]?.timestamp
    ? new Date(recordsRaw[0].timestamp).getTime()
    : 0;

  const records: FitRecord[] = recordsRaw
    .filter((_: any, i: number) => i % 10 === 0) // co 10 rekordów (~10s)
    .map((rec: any) => {
      const ts = rec.timestamp ? new Date(rec.timestamp).getTime() : null;
      const secondsOffset = ts != null ? Math.round((ts - startTimestamp) / 1000) : rec.elapsed_time ?? 0;

      // Konwersja lat/lon z semicircles
      let lat: number | null = null;
      let lon: number | null = null;
      if (rec.position_lat != null && rec.position_lat !== 0) {
        lat = Math.round(semicirclesToDegrees(rec.position_lat) * 1e6) / 1e6;
      }
      if (rec.position_long != null && rec.position_long !== 0) {
        lon = Math.round(semicirclesToDegrees(rec.position_long) * 1e6) / 1e6;
      }

      // Prędkość: m/s -> km/h
      const speedMps = rec.enhanced_speed ?? rec.speed ?? null;
      const speedKmh = speedMps != null ? Math.round(speedMps * 3.6 * 10) / 10 : null;

      // Altitude
      const altitude = rec.enhanced_altitude ?? rec.altitude ?? null;

      return {
        seconds_offset: secondsOffset,
        latitude: lat,
        longitude: lon,
        altitude: altitude != null ? Math.round(altitude * 10) / 10 : null,
        power: rec.power ?? null,
        heart_rate: rec.heart_rate ?? null,
        cadence: rec.cadence ?? null,
        speed: speedKmh,
        temperature: rec.temperature ?? null,
        left_torque_effectiveness: rec.left_torque_effectiveness ?? null,
        left_pedal_smoothness: rec.left_pedal_smoothness ?? null,
      };
    });

  // --- GEAR EVENTS ---
  const eventsRaw: any[] = data.events ?? [];
  const gearEvents: FitGearEvent[] = [];

  eventsRaw.forEach((evt: any) => {
    if (evt.front_gear == null && evt.rear_gear == null) return;
    const ts = evt.timestamp ? new Date(evt.timestamp).getTime() : null;
    const secondsOffset = ts != null ? Math.round((ts - startTimestamp) / 1000) : 0;

    // Znajdz najblizszy rekord dla power i speed
    const nearestRecord = recordsRaw.reduce((best: any, rec: any) => {
      if (!rec.timestamp) return best;
      const recTs = new Date(rec.timestamp).getTime();
      if (!best) return rec;
      const bestTs = new Date(best.timestamp).getTime();
      return Math.abs(recTs - (ts ?? 0)) < Math.abs(bestTs - (ts ?? 0)) ? rec : best;
    }, null);

    const speedMps = nearestRecord?.enhanced_speed ?? nearestRecord?.speed ?? null;

    gearEvents.push({
      seconds_offset: secondsOffset,
      front_gear: evt.front_gear ?? null,
      rear_gear: evt.rear_gear ?? null,
      power_at_change: nearestRecord?.power ?? null,
      speed_at_change: speedMps != null ? Math.round(speedMps * 3.6 * 10) / 10 : null,
    });
  });

  session.has_gear_data = gearEvents.length > 0;

  return { session, laps, records, gearEvents };
}
