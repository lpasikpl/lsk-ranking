-- Dane dzienne z Garmin Connect (HRV, tętno spoczynkowe, gotowość treningowa, sen)
-- Zaciągane codziennie ~8:30 przez cloud routine Claude (Garmin MCP) -> POST /api/sync/garmin
-- Jeden wiersz na dzień (calendar_date = poranna data, do której odnoszą się metryki nocy).

CREATE TABLE IF NOT EXISTS garmin_daily (
  calendar_date            date PRIMARY KEY,

  -- HRV (get_hrv -> hrvSummary)
  hrv_last_night           integer,  -- lastNightAvg
  hrv_weekly_avg           integer,  -- weeklyAvg
  hrv_status               text,     -- BALANCED / LOW / UNBALANCED / ...
  hrv_baseline_low         integer,  -- baseline.balancedLow
  hrv_baseline_upper       integer,  -- baseline.balancedUpper

  -- Tętno spoczynkowe (get_resting_heart_rate lub sleep DTO.restingHeartRate)
  resting_hr               integer,

  -- Gotowość treningowa (get_training_readiness, wpis AFTER_WAKEUP_RESET)
  readiness_score          integer,  -- score
  readiness_level          text,     -- HIGH / MODERATE / LOW / POOR
  readiness_feedback       text,     -- feedbackShort
  acute_load               integer,  -- acuteLoad
  recovery_time            integer,  -- recoveryTime (minuty)

  -- Sen (get_sleep_data -> dailySleepDTO)
  sleep_score              integer,  -- sleepScores.overall.value
  sleep_seconds            integer,  -- sleepTimeSeconds
  deep_seconds             integer,  -- deepSleepSeconds
  light_seconds            integer,  -- lightSleepSeconds
  rem_seconds              integer,  -- remSleepSeconds
  awake_seconds            integer,  -- awakeSleepSeconds
  sleep_avg_hr             integer,  -- avgHeartRate
  sleep_avg_overnight_hrv  integer,  -- avgOvernightHrv (top-level)
  sleep_avg_stress         integer,  -- avgSleepStress
  sleep_avg_respiration    real,     -- averageRespirationValue
  sleep_feedback           text,     -- sleepScoreFeedback

  updated_at               timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_garmin_daily_date ON garmin_daily (calendar_date DESC);
