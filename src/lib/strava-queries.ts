import { supabaseStrava as supabase } from "./supabase-strava";
import type {
  YtdProgress, CumulativeDay, CumulativeByYear,
  MonthlyYoy, YearlyByType, WeeklyNpHr, NpHrByYear,
  TrainingLoadDay, WeeklySummary, Activity, DashboardData,
  PeriodStats, PeriodCompare,
} from "./strava-types";

const CURRENT_YEAR = new Date().getFullYear();

export async function fetchYtdProgress(): Promise<YtdProgress | null> {
  const { data } = await supabase.from("ytd_progress").select("*").single();
  return data;
}

export async function fetchCumulativeDaily(): Promise<CumulativeDay[]> {
  const { data } = await supabase.from("ytd_cumulative_daily").select("*").order("doy");
  return data ?? [];
}

export async function fetchCumulativeByYear(year: number): Promise<CumulativeByYear[]> {
  const { data } = await supabase.rpc("get_cumulative_by_year", { target_year: year });
  return data ?? [];
}

export async function fetchMonthlyYoy(): Promise<MonthlyYoy[]> {
  const { data } = await supabase
    .from("monthly_yoy")
    .select("*")
    .in("year", [CURRENT_YEAR, CURRENT_YEAR - 1])
    .order("year", { ascending: false })
    .order("month", { ascending: false });
  return data ?? [];
}

export async function fetchYearlyByType(): Promise<YearlyByType[]> {
  const now = new Date();
  const month = now.getMonth() + 1;
  const day = now.getDate();
  const pad = (n: number) => String(n).padStart(2, "0");
  const nextDay = (y: number, m: number, d: number) => {
    const dt = new Date(y, m - 1, d + 1);
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
  };

  const currentFrom = `${CURRENT_YEAR}-01-01`;
  const currentTo = nextDay(CURRENT_YEAR, month, day);
  const prevFrom = `${CURRENT_YEAR - 1}-01-01`;
  const prevTo = nextDay(CURRENT_YEAR - 1, month, day);

  const [currentAct, prevAct] = await Promise.all([
    fetchActivitiesForPeriod(currentFrom, currentTo),
    fetchActivitiesForPeriod(prevFrom, prevTo),
  ]);

  function aggregate(activities: Activity[], year: number): YearlyByType[] {
    const groups = new Map<string, YearlyByType>();
    for (const a of activities) {
      const ride_type = a.sport_type === "VirtualRide" ? "Zwift" : a.sport_type === "GravelRide" ? "Gravel" : "Szosa";
      const environment = a.sport_type === "VirtualRide" ? "Indoor" : "Outdoor";
      const key = `${ride_type}|${environment}`;
      const g = groups.get(key) ?? { year, ride_type, environment, rides: 0, hours: 0, distance_km: 0, elevation_m: 0, avg_np: null, total_tss: 0 };
      g.rides += 1;
      g.hours += a.moving_time_seconds / 3600;
      g.distance_km += a.distance_meters / 1000;
      g.elevation_m += a.total_elevation_gain;
      g.total_tss += a.effective_tss ?? 0;
      groups.set(key, g);
    }
    return Array.from(groups.values());
  }

  return [...aggregate(currentAct, CURRENT_YEAR), ...aggregate(prevAct, CURRENT_YEAR - 1)];
}

export async function fetchWeeklyNpHr(): Promise<WeeklyNpHr[]> {
  const { data } = await supabase
    .from("weekly_np_hr")
    .select("*")
    .order("week_start", { ascending: false })
    .limit(52);
  return (data ?? []).reverse();
}

export async function fetchNpHrByYear(year: number): Promise<NpHrByYear[]> {
  const { data } = await supabase.rpc("get_np_hr_by_year", { target_year: year });
  return data ?? [];
}

export async function fetchTrainingLoad(): Promise<TrainingLoadDay[]> {
  const { data } = await supabase.from("training_load_trend").select("*").order("day");
  return data ?? [];
}

export async function fetchWeeklySummaries(): Promise<WeeklySummary[]> {
  const { data } = await supabase
    .from("weekly_summary")
    .select("*")
    .gte("week_start", "2025-01-01")
    .order("week_start", { ascending: true });
  return data ?? [];
}

export async function fetchRecentActivities(year = CURRENT_YEAR): Promise<Activity[]> {
  const { data } = await supabase
    .from("activities")
    .select("id,strava_activity_id,name,sport_type,start_date,elapsed_time_seconds,moving_time_seconds,distance_meters,total_elevation_gain,average_speed,average_watts,normalized_power,intensity_factor,tss,effective_tss,average_heartrate,max_heartrate,has_power_data")
    .eq("is_ride", true)
    .gte("start_date", `${year}-01-01`)
    .lt("start_date", `${year + 1}-01-01`)
    .order("start_date", { ascending: false });
  return data ?? [];
}

function aggregateActivities(activities: Activity[]): PeriodStats {
  const distance_km = activities.reduce((s, a) => s + a.distance_meters, 0) / 1000;
  const hours = activities.reduce((s, a) => s + a.moving_time_seconds, 0) / 3600;
  const rides = activities.length;
  const elevation_m = activities.reduce((s, a) => s + a.total_elevation_gain, 0);

  const withPower = activities.filter((a) => a.has_power_data && a.normalized_power != null);
  const avg_np = withPower.length > 0
    ? withPower.reduce((s, a) => s + a.normalized_power!, 0) / withPower.length
    : null;

  const uniqueDays = new Set(activities.map((a) => a.start_date.slice(0, 10)));
  const active_days = uniqueDays.size;

  const total_tss = Math.round(activities.reduce((s, a) => s + (a.effective_tss ?? 0), 0));

  const longRides = activities.filter((a) => a.moving_time_seconds > 3600);
  const avg_distance_km = longRides.length > 0
    ? longRides.reduce((s, a) => s + a.distance_meters, 0) / longRides.length / 1000
    : null;

  return { distance_km, hours, rides, elevation_m, avg_np, active_days, total_tss, avg_distance_km };
}

async function fetchActivitiesForPeriod(from: string, to: string): Promise<Activity[]> {
  const { data } = await supabase
    .from("activities")
    .select("id,strava_activity_id,name,sport_type,start_date,elapsed_time_seconds,moving_time_seconds,distance_meters,total_elevation_gain,average_speed,average_watts,normalized_power,intensity_factor,tss,effective_tss,average_heartrate,max_heartrate,has_power_data")
    .eq("is_ride", true)
    .gte("start_date", from)
    .lt("start_date", to);
  return data ?? [];
}

export async function fetchPeriodCompare(type: "ytd" | "month"): Promise<PeriodCompare> {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  const day = now.getDate();

  const pad = (n: number) => String(n).padStart(2, "0");
  const nextDay = (y: number, m: number, d: number) => {
    const dt = new Date(y, m - 1, d + 1);
    return `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;
  };

  let currentFrom: string;
  let currentTo: string;
  let prevFrom: string;
  let prevTo: string;
  let label: string;

  if (type === "ytd") {
    currentFrom = `${year}-01-01`;
    currentTo = nextDay(year, month, day);
    prevFrom = `${year - 1}-01-01`;
    prevTo = nextDay(year - 1, month, day);
    label = `YTD ${year} vs ${year - 1}`;
  } else {
    currentFrom = `${year}-${pad(month)}-01`;
    currentTo = nextDay(year, month, day);
    prevFrom = `${year - 1}-${pad(month)}-01`;
    prevTo = nextDay(year - 1, month, day);
    const monthName = now.toLocaleDateString("pl-PL", { month: "long" });
    label = `${monthName} 1-${day} ${year} vs ${year - 1}`;
  }

  const [currentActivities, prevActivities] = await Promise.all([
    fetchActivitiesForPeriod(currentFrom, currentTo),
    fetchActivitiesForPeriod(prevFrom, prevTo),
  ]);

  return {
    current: aggregateActivities(currentActivities),
    previous: aggregateActivities(prevActivities),
    label,
  };
}

export async function fetchDashboardData(): Promise<DashboardData> {
  const [
    ytdProgress,
    cumulativeDaily,
    cumulativePrevYear,
    monthlyYoy,
    yearlyByType,
    weeklyNpHr,
    npHrCurrentYear,
    npHrPrevYear,
    trainingLoad,
    weeklySummaries,
    recentActivities,
    prevYearActivities,
    ytdCompare,
    monthPartialCompare,
  ] = await Promise.all([
    fetchYtdProgress(),
    fetchCumulativeDaily(),
    fetchCumulativeByYear(CURRENT_YEAR - 1),
    fetchMonthlyYoy(),
    fetchYearlyByType(),
    fetchWeeklyNpHr(),
    fetchNpHrByYear(CURRENT_YEAR),
    fetchNpHrByYear(CURRENT_YEAR - 1),
    fetchTrainingLoad(),
    fetchWeeklySummaries(),
    fetchRecentActivities(),
    fetchRecentActivities(CURRENT_YEAR - 1),
    fetchPeriodCompare("ytd"),
    fetchPeriodCompare("month"),
  ]);

  return {
    ytdProgress,
    cumulativeDaily,
    cumulativePrevYear,
    monthlyYoy,
    yearlyByType,
    weeklyNpHr,
    npHrCurrentYear,
    npHrPrevYear,
    trainingLoad,
    weeklySummaries,
    recentActivities,
    prevYearActivities,
    ytdCompare,
    monthPartialCompare,
  };
}
