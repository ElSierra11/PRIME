-- ====================================================================
-- PRIME OS - SUPABASE DATABASE SCHEMA & INITIAL SEED
-- Microservicios: Schedule, Outlier, Habits, Finance, Profile, Notifications
-- ====================================================================

-- 1. TABLA: Perfil del Usuario
CREATE TABLE IF NOT EXISTS public.profiles (
  id TEXT PRIMARY KEY DEFAULT 'alejosierra656@gmail.com',
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL DEFAULT 'Alejo Sierra',
  role TEXT DEFAULT 'Ingeniería & Arbitraje',
  prime_score INTEGER DEFAULT 85,
  streak_days INTEGER DEFAULT 14,
  preferences JSONB DEFAULT '{"theme": "dark", "sound": true, "vibration": true, "dnd": false}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TABLA: Horario y Eventos Semanales
CREATE TABLE IF NOT EXISTS public.schedule_events (
  id TEXT PRIMARY KEY,
  day INTEGER NOT NULL CHECK (day >= 0 AND day <= 6), -- 0 = Lunes, 6 = Domingo
  title TEXT NOT NULL,
  category TEXT NOT NULL, -- university, thesis, outlier, gym, family, referee, rest, other
  start_time TEXT NOT NULL, -- '08:00'
  end_time TEXT NOT NULL, -- '12:00'
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. TABLA: Sesiones de Trabajo Remoto en Outlier
CREATE TABLE IF NOT EXISTS public.outlier_sessions (
  id TEXT PRIMARY KEY,
  date DATE DEFAULT CURRENT_DATE NOT NULL,
  hours NUMERIC(4, 2) NOT NULL,
  rate_usd NUMERIC(6, 2) DEFAULT 15.00 NOT NULL,
  earned_usd NUMERIC(8, 2) NOT NULL,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABLA: Estado Diario de Hábitos, Agua y Sueño
CREATE TABLE IF NOT EXISTS public.habits_daily (
  id TEXT PRIMARY KEY DEFAULT 'today',
  date DATE DEFAULT CURRENT_DATE UNIQUE NOT NULL,
  water_current_ml INTEGER DEFAULT 0 NOT NULL,
  water_goal_ml INTEGER DEFAULT 2500 NOT NULL,
  sleep_target_bedtime TEXT DEFAULT '22:00' NOT NULL,
  sleep_target_wakeup TEXT DEFAULT '06:30' NOT NULL,
  sleep_confirmed BOOLEAN DEFAULT false NOT NULL,
  sleep_confirmed_at TIMESTAMPTZ,
  chores JSONB DEFAULT '[
    {"id": "ch-1", "text": "Entrenamiento Prime (60m)", "done": false, "category": "gym"},
    {"id": "ch-2", "text": "Bloque Outlier (3 a 4 horas)", "done": true, "category": "outlier"},
    {"id": "ch-3", "text": "Avance en Trabajo de Grado U", "done": true, "category": "thesis"},
    {"id": "ch-4", "text": "Tomar al menos 2.5L de agua", "done": false, "category": "health"},
    {"id": "ch-5", "text": "Desconexión de pantallas antes de las 10 PM", "done": false, "category": "sleep"}
  ]'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. TABLA: Metas y Registros Financieros
CREATE TABLE IF NOT EXISTS public.finance_goals (
  id TEXT PRIMARY KEY DEFAULT 'main',
  monthly_goal_cop NUMERIC(12, 2) DEFAULT 2000000 NOT NULL,
  current_saved_cop NUMERIC(12, 2) DEFAULT 1120000 NOT NULL,
  exchange_rate_cop_usd NUMERIC(8, 2) DEFAULT 4000 NOT NULL,
  outlier_rate_usd NUMERIC(6, 2) DEFAULT 15.00 NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.finance_savings (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  amount_cop NUMERIC(12, 2) NOT NULL,
  category TEXT DEFAULT 'impulse',
  date_label TEXT DEFAULT 'Hoy',
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. TABLA: Notificaciones y Recordatorios
CREATE TABLE IF NOT EXISTS public.notifications (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  category TEXT DEFAULT 'prime',
  type TEXT DEFAULT 'reminder',
  tab TEXT DEFAULT 'dashboard',
  priority INTEGER DEFAULT 2,
  status TEXT DEFAULT 'pending', -- pending, confirmed, snoozed, dismissed
  snooze_count INTEGER DEFAULT 0,
  delivered_in_app BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ====================================================================
-- POLÍTICAS DE ACCESO (Row Level Security - RLS)
-- Permite lectura y escritura con clave pública / backend
-- ====================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schedule_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.outlier_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.habits_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.finance_savings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read/write on profiles" ON public.profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on schedule_events" ON public.schedule_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on outlier_sessions" ON public.outlier_sessions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on habits_daily" ON public.habits_daily FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on finance_goals" ON public.finance_goals FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on finance_savings" ON public.finance_savings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public read/write on notifications" ON public.notifications FOR ALL USING (true) WITH CHECK (true);

-- ====================================================================
-- SEED DATA (Datos Reales Iniciales de Alejo Sierra)
-- ====================================================================

-- Perfil
INSERT INTO public.profiles (id, email, name, role, prime_score, streak_days)
VALUES ('alejosierra656@gmail.com', 'alejosierra656@gmail.com', 'Alejo Sierra', 'Ingeniería & Arbitraje', 85, 14)
ON CONFLICT (id) DO NOTHING;

-- Metas Financieras
INSERT INTO public.finance_goals (id, monthly_goal_cop, current_saved_cop, exchange_rate_cop_usd, outlier_rate_usd)
VALUES ('main', 2000000, 1120000, 4000, 15.00)
ON CONFLICT (id) DO NOTHING;

-- Ahorros Iniciales
INSERT INTO public.finance_savings (id, title, amount_cop, category, date_label)
VALUES 
  ('sav-1', 'Freno en comida rápida en la U', 35000, 'impulse', 'Ayer'),
  ('sav-2', 'Ahorro de pago partido arbitraje fin de semana', 90000, 'opportunity', 'Fin de semana')
ON CONFLICT (id) DO NOTHING;

-- Hábitos de Hoy
INSERT INTO public.habits_daily (id, date, water_current_ml, water_goal_ml, sleep_target_bedtime)
VALUES ('today', CURRENT_DATE, 1250, 2500, '22:00')
ON CONFLICT (id) DO NOTHING;

-- Sesiones Outlier de Referencia
INSERT INTO public.outlier_sessions (id, date, hours, rate_usd, earned_usd, notes)
VALUES
  ('s-1', CURRENT_DATE - INTERVAL '1 day', 3.5, 15.00, 52.50, 'Anotación y revisión de prompts'),
  ('s-2', CURRENT_DATE - INTERVAL '2 days', 4.0, 15.00, 60.00, 'Evaluación técnica de respuestas')
ON CONFLICT (id) DO NOTHING;

-- Eventos del Horario Semanal
INSERT INTO public.schedule_events (id, day, title, category, start_time, end_time, notes)
VALUES
  -- Lunes (0)
  ('ev-1', 0, 'Levantarme & Llevar a mis hermanas', 'family', '06:30', '07:15', 'Colegio'),
  ('ev-2', 0, 'Clase U: Gestión y Calidad del Software', 'university', '09:00', '12:00', 'Materia obligatoria U'),
  ('ev-3', 0, 'Trabajo de Grado U (Tesis)', 'thesis', '10:00', '12:30', 'Avance con asesor (Solapamiento con clase)'),
  ('ev-4', 0, 'Recoger a Avril', 'family', '12:45', '13:30', 'Colegio'),
  ('ev-5', 0, 'GYM Sesión Prime (Pecho/Tríceps)', 'gym', '15:30', '16:45', '65 min intensos'),
  ('ev-6', 0, 'Turno Outlier (Deep Work)', 'outlier', '18:00', '21:30', '3.5 horas de tareas'),

  -- Martes (1)
  ('ev-7', 1, 'Levantarme & Llevar a mis hermanas', 'family', '06:30', '07:15', 'Salida colegio'),
  ('ev-8', 1, 'Terapias Abuela', 'family', '07:30', '08:15', 'Acompañamiento'),
  ('ev-9', 1, 'Trabajo de Grado U (Tesis)', 'thesis', '08:30', '12:30', 'Bloque de 4 horas enfocado'),
  ('ev-10', 1, 'Recoger a Avril', 'family', '12:45', '13:30', 'Colegio'),
  ('ev-11', 1, 'GYM Sesión Prime (Espalda/Bíceps)', 'gym', '15:30', '16:45', '70 min'),
  ('ev-12', 1, 'Turno Outlier (Deep Work)', 'outlier', '18:00', '21:30', '3.5 horas'),

  -- Miércoles (2)
  ('ev-13', 2, 'Trabajo de Grado U (Tesis)', 'thesis', '08:00', '12:30', 'Desarrollo de entregable'),
  ('ev-14', 2, 'Clase U: Asp. Gen. del Medio Ambiente', 'university', '14:00', '17:00', 'Ingeniería'),
  ('ev-15', 2, 'Clase U: Auditoría de Sistemas', 'university', '17:00', '20:00', 'Ingeniería'),
  ('ev-16', 2, 'Turno Outlier (Bloque Nocturno)', 'outlier', '20:30', '22:30', '2 horas de apoyo'),
  ('ev-17', 2, 'Dormir & Recuperación', 'rest', '22:30', '23:59', 'Mínimo 7.5 hrs sueño'),

  -- Jueves (3)
  ('ev-18', 3, 'Trabajo de Grado U (Tesis)', 'thesis', '08:00', '12:30', 'Documentación y código'),
  ('ev-19', 3, 'Clase U: Ley y Ética para Ingeniería', 'university', '14:00', '17:00', 'Ingeniería'),
  ('ev-20', 3, 'Clase U: Práct. Emp. Apli. Trab. Grado', 'university', '18:00', '21:00', 'Asignatura clave'),
  ('ev-21', 3, 'Entrenamiento COARC (Árbitros)', 'referee', '19:15', '21:15', 'Pruebas físicas arbitraje (Solapamiento con Práctica U)'),
  ('ev-22', 3, 'Dormir & Recuperación', 'rest', '22:30', '23:59', 'Descanso'),

  -- Viernes (4)
  ('ev-23', 4, 'Llevar a mis hermanas', 'family', '06:45', '07:20', 'Colegio'),
  ('ev-24', 4, 'Terapias Abuela', 'family', '07:30', '08:15', 'Acompañamiento'),
  ('ev-25', 4, 'Trabajo de Grado U (Tesis)', 'thesis', '08:30', '11:45', 'Revisión final semana'),
  ('ev-26', 4, 'Recoger a Avril', 'family', '12:45', '13:30', 'Colegio'),
  ('ev-27', 4, 'GYM Sesión Prime (Pierna & Potencia)', 'gym', '15:30', '16:45', 'Piernas y sprints'),
  ('ev-28', 4, 'Turno Outlier (Deep Work)', 'outlier', '18:00', '21:30', '3.5 horas'),

  -- Sábado (5)
  ('ev-29', 5, 'Partidos de Arbitraje (Colegio COARC)', 'referee', '08:30', '13:00', 'Torneo aficionado / formativo'),
  ('ev-30', 5, 'Turno Outlier (Flexible)', 'outlier', '15:00', '18:30', '3.5 horas remuneradas'),
  ('ev-31', 5, 'Descanso / Social / Tiempo Libre', 'rest', '19:00', '22:30', 'Desconexión'),

  -- Domingo (6)
  ('ev-32', 6, 'Misa', 'other', '08:00', '09:00', 'Espiritual'),
  ('ev-33', 6, 'Partidos de Arbitraje / Tarde', 'referee', '10:00', '13:30', 'Partidos programados'),
  ('ev-34', 6, 'Turno Outlier + Planeación Semanal', 'outlier', '16:00', '19:30', '3.5 horas de trabajo')
ON CONFLICT (id) DO NOTHING;
