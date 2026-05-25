-- Tagi aktywności (Strava UI tags wprowadzane ręcznie w naszej apce)
-- Brak publicznego Strava API dla nowych tagów (Zawody, Z dzieckiem, ...), więc tagujemy lokalnie.

ALTER TABLE activities ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}'::text[];
CREATE INDEX IF NOT EXISTS idx_activities_tags_gin ON activities USING gin (tags);
