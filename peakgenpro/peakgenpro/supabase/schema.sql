-- ============================================================
-- PeakGenPro — Supabase SQL Schema
-- Ejecutar en: Supabase Dashboard → SQL Editor → New Query
-- Proyecto: tkaouqqubptjeklgcnpj
-- ============================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLA: profiles
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  sport TEXT,
  level TEXT DEFAULT 'intermedio',
  age INTEGER,
  weight_kg DECIMAL(5,2),
  height_cm INTEGER,
  goal TEXT,
  sessions_per_week INTEGER DEFAULT 4,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: cada usuario solo ve su propio perfil
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================================
-- TABLA: waitlist
-- ============================================================
CREATE TABLE IF NOT EXISTS waitlist (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  source TEXT DEFAULT 'landing',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Waitlist es pública para insertar (anon puede añadirse)
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can join waitlist" ON waitlist FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can view waitlist" ON waitlist FOR SELECT USING (auth.role() = 'service_role');

-- ============================================================
-- TABLA: garmin_credentials
-- ============================================================
CREATE TABLE IF NOT EXISTS garmin_credentials (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  garmin_username TEXT NOT NULL,
  garmin_password_encrypted TEXT NOT NULL,
  last_sync_at TIMESTAMPTZ,
  sync_status TEXT DEFAULT 'pending', -- pending | success | error
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE garmin_credentials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own garmin creds" ON garmin_credentials
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- TABLA: training_sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS training_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  garmin_activity_id BIGINT UNIQUE,
  activity_type TEXT NOT NULL, -- running, cycling, swimming, strength, etc.
  start_time TIMESTAMPTZ NOT NULL,
  duration_min INTEGER,
  distance_km DECIMAL(8,3),
  avg_hr INTEGER,
  max_hr INTEGER,
  calories INTEGER,
  tss INTEGER, -- Training Stress Score
  avg_speed_kmh DECIMAL(6,2),
  avg_power_watts INTEGER, -- para ciclismo
  normalized_power INTEGER,
  elevation_gain_m INTEGER,
  vo2max_estimate DECIMAL(4,1),
  raw_data JSONB, -- datos raw de Garmin
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own sessions" ON training_sessions
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_training_sessions_user_date ON training_sessions(user_id, start_time DESC);

-- ============================================================
-- TABLA: daily_metrics
-- ============================================================
CREATE TABLE IF NOT EXISTS daily_metrics (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  -- HRV & Cardio
  hrv_ms INTEGER,
  resting_hr INTEGER,
  -- Sleep
  sleep_hours DECIMAL(4,2),
  sleep_score INTEGER,
  sleep_deep_hours DECIMAL(4,2),
  sleep_rem_hours DECIMAL(4,2),
  sleep_light_hours DECIMAL(4,2),
  sleep_awake_hours DECIMAL(4,2),
  -- Recovery
  readiness_score INTEGER,
  body_battery INTEGER,
  stress_score INTEGER,
  -- Activity
  steps INTEGER,
  calories_active INTEGER,
  calories_total INTEGER,
  -- Respiration
  spo2_avg DECIMAL(4,1),
  respiration_avg DECIMAL(4,1),
  -- Raw
  raw_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, date)
);

ALTER TABLE daily_metrics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own daily metrics" ON daily_metrics
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_daily_metrics_user_date ON daily_metrics(user_id, date DESC);

-- ============================================================
-- TABLA: sync_logs
-- ============================================================
CREATE TABLE IF NOT EXISTS sync_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL, -- full | incremental | manual
  status TEXT NOT NULL, -- running | success | error
  sessions_synced INTEGER DEFAULT 0,
  metrics_synced INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE sync_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sync logs" ON sync_logs FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- TRIGGER: auto-crear perfil al registrarse
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, sport, goal)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'sport',
    NEW.raw_user_meta_data->>'goal'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- FUNCIÓN: actualizar updated_at automáticamente
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_garmin_creds_updated_at BEFORE UPDATE ON garmin_credentials
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
