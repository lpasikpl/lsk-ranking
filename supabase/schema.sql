-- ============================================================
-- LSK Ranking - Schemat bazy danych Supabase
-- Uruchom ten plik w SQL Editor w Supabase Dashboard
-- ============================================================

-- Włącz rozszerzenie UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABELE
-- ============================================================

-- Użytkownicy
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  strava_id BIGINT UNIQUE NOT NULL,
  username TEXT,
  firstname TEXT,
  lastname TEXT,
  profile_medium TEXT,
  profile TEXT,
  city TEXT,
  country TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  is_admin BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Tokeny Strava
CREATE TABLE IF NOT EXISTS public.strava_tokens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  access_token TEXT NOT NULL,
  refresh_token TEXT NOT NULL,
  expires_at BIGINT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Aktywności
CREATE TABLE IF NOT EXISTS public.activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  strava_id BIGINT UNIQUE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT,
  type TEXT NOT NULL,
  distance FLOAT NOT NULL DEFAULT 0,
  moving_time INTEGER NOT NULL DEFAULT 0,
  elapsed_time INTEGER NOT NULL DEFAULT 0,
  total_elevation_gain FLOAT NOT NULL DEFAULT 0,
  start_date TIMESTAMPTZ NOT NULL,
  start_date_local TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Logi synchronizacji
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  status TEXT NOT NULL CHECK (status IN ('success', 'error')),
  activities_synced INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ============================================================
-- INDEKSY
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_activities_user_id ON public.activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_start_date_local ON public.activities(start_date_local);
CREATE INDEX IF NOT EXISTS idx_activities_type ON public.activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_user_date ON public.activities(user_id, start_date_local);
CREATE INDEX IF NOT EXISTS idx_sync_logs_user_id ON public.sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_logs_created_at ON public.sync_logs(created_at DESC);

-- ============================================================
-- FUNKCJA RANKINGU (RPC)
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_ranking(
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ
)
RETURNS TABLE (
  user_id UUID,
  firstname TEXT,
  lastname TEXT,
  profile_medium TEXT,
  strava_id BIGINT,
  country TEXT,
  total_distance FLOAT,
  total_elevation FLOAT,
  total_time BIGINT
)
LANGUAGE SQL
STABLE
AS $$
  SELECT
    u.id AS user_id,
    u.firstname,
    u.lastname,
    u.profile_medium,
    u.strava_id,
    u.country,
    COALESCE(SUM(a.distance), 0) AS total_distance,
    COALESCE(SUM(a.total_elevation_gain), 0) AS total_elevation,
    COALESCE(SUM(a.moving_time), 0)::BIGINT AS total_time
  FROM public.users u
  LEFT JOIN public.activities a ON (
    a.user_id = u.id
    AND a.start_date_local >= start_date
    AND a.start_date_local <= end_date
    AND a.type IN ('Ride', 'VirtualRide', 'GravelRide', 'MountainBikeRide', 'EBikeRide')
  )
  WHERE u.is_active = true
  GROUP BY u.id, u.firstname, u.lastname, u.profile_medium, u.strava_id, u.country
  ORDER BY total_distance DESC;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.strava_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- USERS policies
-- Wszyscy mogą czytać aktywnych użytkowników (do rankingu publicznego)
CREATE POLICY "users_public_read" ON public.users
  FOR SELECT USING (is_active = true);

-- Zalogowany użytkownik może edytować własne dane
CREATE POLICY "users_own_update" ON public.users
  FOR UPDATE USING (
    auth.uid()::text = id::text
  );

-- Service role może robić wszystko
CREATE POLICY "users_service_all" ON public.users
  FOR ALL USING (
    current_setting('role') = 'service_role'
  );

-- STRAVA_TOKENS policies
-- Użytkownik widzi tylko swoje tokeny
CREATE POLICY "tokens_own_read" ON public.strava_tokens
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "tokens_service_all" ON public.strava_tokens
  FOR ALL USING (
    current_setting('role') = 'service_role'
  );

-- ACTIVITIES policies
-- Wszyscy mogą czytać aktywności (do rankingu)
CREATE POLICY "activities_public_read" ON public.activities
  FOR SELECT USING (true);

-- Service role może robić wszystko
CREATE POLICY "activities_service_all" ON public.activities
  FOR ALL USING (
    current_setting('role') = 'service_role'
  );

-- SYNC_LOGS policies
-- Tylko service role
CREATE POLICY "sync_logs_service_all" ON public.sync_logs
  FOR ALL USING (
    current_setting('role') = 'service_role'
  );

-- ============================================================
-- TRIGGER: updated_at dla users
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER strava_tokens_updated_at
  BEFORE UPDATE ON public.strava_tokens
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
