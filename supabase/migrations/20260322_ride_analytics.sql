-- Nowe tabele dla Ride Analytics

CREATE TABLE IF NOT EXISTS fit_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id bigint UNIQUE NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  total_work_kj numeric,
  avg_temperature numeric(4,1),
  max_temperature numeric(4,1),
  avg_left_torque_effectiveness numeric(4,1),
  avg_left_pedal_smoothness numeric(4,1),
  training_effect_aerobic numeric(3,1),
  training_effect_anaerobic numeric(3,1),
  avg_vam numeric(5,3),
  threshold_power_from_device integer,
  max_hr_from_device integer,
  threshold_hr_from_device integer,
  resting_hr_from_device integer,
  has_fit_data boolean DEFAULT false,
  has_pedaling_data boolean DEFAULT false,
  has_gear_data boolean DEFAULT false,
  has_temperature_data boolean DEFAULT false,
  fit_file_path text,
  processed_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS fit_laps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id bigint NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  lap_number integer NOT NULL,
  start_time timestamptz,
  total_time_seconds numeric,
  total_distance_meters numeric,
  avg_power integer,
  max_power integer,
  normalized_power integer,
  avg_hr integer,
  max_hr integer,
  avg_cadence integer,
  max_cadence integer,
  avg_speed numeric(6,3),
  max_speed numeric(6,3),
  total_ascent integer,
  total_descent integer,
  total_calories integer,
  total_work_kj numeric,
  avg_temperature numeric(4,1),
  avg_left_torque_effectiveness numeric(4,1),
  avg_left_pedal_smoothness numeric(4,1),
  avg_vam numeric(5,3),
  UNIQUE(activity_id, lap_number)
);

CREATE TABLE IF NOT EXISTS fit_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id bigint NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  seconds_offset integer NOT NULL,
  latitude numeric(9,6),
  longitude numeric(9,6),
  altitude numeric(6,1),
  power integer,
  heart_rate integer,
  cadence integer,
  speed numeric(5,1),
  temperature numeric(4,1),
  left_torque_effectiveness numeric(4,1),
  left_pedal_smoothness numeric(4,1)
);

CREATE TABLE IF NOT EXISTS fit_gear_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id bigint NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  seconds_offset integer NOT NULL,
  front_gear integer,
  rear_gear integer,
  power_at_change integer,
  speed_at_change numeric(5,1)
);

CREATE TABLE IF NOT EXISTS ai_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id bigint NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  section text NOT NULL,
  comment text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(activity_id, section)
);

-- Dodaj kolumny do istniejącej tabeli activities
ALTER TABLE activities ADD COLUMN IF NOT EXISTS is_commute boolean DEFAULT false;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS is_ignored boolean DEFAULT false;
ALTER TABLE activities ADD COLUMN IF NOT EXISTS has_fit_analysis boolean DEFAULT false;

-- Indeksy
CREATE INDEX IF NOT EXISTS idx_fit_activities_activity ON fit_activities(activity_id);
CREATE INDEX IF NOT EXISTS idx_fit_laps_activity ON fit_laps(activity_id, lap_number);
CREATE INDEX IF NOT EXISTS idx_fit_records_activity ON fit_records(activity_id, seconds_offset);
CREATE INDEX IF NOT EXISTS idx_fit_gear_events_activity ON fit_gear_events(activity_id, seconds_offset);
CREATE INDEX IF NOT EXISTS idx_ai_comments_activity ON ai_comments(activity_id, section);
CREATE INDEX IF NOT EXISTS idx_activities_analysis ON activities(start_date DESC) WHERE is_ignored = false AND is_ride = true AND has_fit_analysis = true;

-- RLS
ALTER TABLE fit_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE fit_laps ENABLE ROW LEVEL SECURITY;
ALTER TABLE fit_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE fit_gear_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read access" ON fit_activities FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON fit_laps FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON fit_records FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON fit_gear_events FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated read access" ON ai_comments FOR SELECT TO authenticated USING (true);

CREATE POLICY "Service role write access" ON fit_activities FOR ALL TO service_role USING (true);
CREATE POLICY "Service role write access" ON fit_laps FOR ALL TO service_role USING (true);
CREATE POLICY "Service role write access" ON fit_records FOR ALL TO service_role USING (true);
CREATE POLICY "Service role write access" ON fit_gear_events FOR ALL TO service_role USING (true);
CREATE POLICY "Service role write access" ON ai_comments FOR ALL TO service_role USING (true);
