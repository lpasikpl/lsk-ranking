export interface YtdProgress {
  year: number;
  actual_km: number;
  goal_km: number;
  pct_complete: number;
  planned_km: number;
  ahead_behind_km: number;
  projected_km: number;
  actual_hours: number;
  actual_rides: number;
  actual_elevation: number;
  active_days: number;
  day_of_year: number;
  days_in_year: number;
}

export interface CumulativeDay {
  day: string;
  doy: number;
  actual_cumulative_km: number;
  plan_cumulative_km: number;
}

export interface CumulativeByYear {
  doy: number;
  cumulative_km: number;
  day: string;
}

export interface MonthlyYoy {
  year: number;
  month: number;
  month_name: string;
  rides: number;
  hours: number;
  distance_km: number;
  elevation_m: number;
  avg_np: number | null;
  avg_hr: number | null;
  total_tss: number;
  active_days: number;
}

export interface YearlyByType {
  year: number;
  ride_type: string;
  environment: string;
  rides: number;
  hours: number;
  distance_km: number;
  elevation_m: number;
  avg_np: number | null;
  total_tss: number;
}

export interface WeeklyNpHr {
  week_start: string;
  iso_year: number;
  iso_week: number;
  qualifying_rides: number;
  avg_np: number;
  avg_hr: number;
  np_hr_ratio: number;
  avg_if: number;
  total_hours: number;
}

export interface NpHrByYear {
  iso_week: number;
  week_start: string;
  avg_np: number;
  avg_hr: number;
  np_hr_ratio: number;
  qualifying_rides: number;
}

export interface TrainingLoadDay {
  day: string;
  daily_tss: number;
  ctl: number;
  atl: number;
  tsb: number;
}

export interface WeeklySummary {
  week_start: string;
  iso_year: number;
  iso_week: number;
  rides: number;
  hours: number;
  distance_km: number;
  elevation_m: number;
  total_tss: number;
  avg_np: number | null;
  avg_if: number | null;
  pz1: number; pz2: number; pz3: number; pz4: number;
  pz5: number; pz6: number; pz7: number;
  hz1: number; hz2: number; hz3: number; hz4: number; hz5: number;
}

export interface Activity {
  id: number;
  strava_activity_id: number;
  name: string;
  sport_type: string;
  start_date: string;
  elapsed_time_seconds: number;
  moving_time_seconds: number;
  distance_meters: number;
  total_elevation_gain: number;
  average_speed: number;
  average_watts: number | null;
  normalized_power: number | null;
  intensity_factor: number | null;
  tss: number | null;
  effective_tss: number | null;
  average_heartrate: number | null;
  max_heartrate: number | null;
  has_power_data: boolean;
}

export interface PeriodStats {
  distance_km: number;
  hours: number;
  rides: number;
  elevation_m: number;
  avg_np: number | null;
  active_days: number;
  total_tss: number;
  avg_distance_km: number | null;
}

export interface PeriodCompare {
  current: PeriodStats;
  previous: PeriodStats;
  label: string;
}

export interface DashboardData {
  ytdProgress: YtdProgress | null;
  cumulativeDaily: CumulativeDay[];
  cumulativePrevYear: CumulativeByYear[];
  monthlyYoy: MonthlyYoy[];
  yearlyByType: YearlyByType[];
  weeklyNpHr: WeeklyNpHr[];
  npHrCurrentYear: NpHrByYear[];
  npHrPrevYear: NpHrByYear[];
  trainingLoad: TrainingLoadDay[];
  weeklySummaries: WeeklySummary[];
  recentActivities: Activity[];
  prevYearActivities: Activity[];
  ytdCompare: PeriodCompare;
  monthPartialCompare: PeriodCompare;
}
