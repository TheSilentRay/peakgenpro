// Demo data used as fallback when Supabase is unavailable (e.g. during local dev or Artifacts)
// Replace with real Supabase queries once deployed to Vercel

export const DEMO_USER = {
  id: 'demo-user-001',
  email: 'athlete@peakgenpro.io',
  user_metadata: {
    full_name: 'Carlos Demo',
    sport: 'triathlon',
    age: 28,
    weight_kg: 72,
    height_cm: 178,
    goal: 'performance'
  }
}

export const DEMO_METRICS = Array.from({ length: 30 }, (_, i) => {
  const date = new Date()
  date.setDate(date.getDate() - (29 - i))
  return {
    date: date.toISOString().split('T')[0],
    hrv_ms: Math.round(50 + Math.sin(i * 0.4) * 12 + Math.random() * 5),
    resting_hr: Math.round(52 + Math.cos(i * 0.3) * 4 + Math.random() * 3),
    sleep_hours: parseFloat((7 + Math.sin(i * 0.5) * 1.2).toFixed(1)),
    sleep_score: Math.round(70 + Math.sin(i * 0.45) * 15 + Math.random() * 8),
    readiness_score: Math.round(75 + Math.sin(i * 0.35) * 15 + Math.random() * 6),
    steps: Math.round(8000 + Math.random() * 6000),
    calories_active: Math.round(400 + Math.random() * 600),
    stress_score: Math.round(25 + Math.random() * 30),
    body_battery: Math.round(55 + Math.sin(i * 0.6) * 20)
  }
})

export const DEMO_SESSIONS = [
  { id: 1, activity_type: 'running', distance_km: 12.4, duration_min: 58, avg_hr: 152, max_hr: 174, calories: 720, tss: 68, date: new Date(Date.now() - 86400000).toISOString() },
  { id: 2, activity_type: 'cycling', distance_km: 45.2, duration_min: 92, avg_hr: 138, max_hr: 168, calories: 1240, tss: 95, date: new Date(Date.now() - 2 * 86400000).toISOString() },
  { id: 3, activity_type: 'swimming', distance_km: 2.0, duration_min: 45, avg_hr: 128, max_hr: 155, calories: 480, tss: 52, date: new Date(Date.now() - 3 * 86400000).toISOString() },
  { id: 4, activity_type: 'running', distance_km: 8.0, duration_min: 38, avg_hr: 144, max_hr: 169, calories: 520, tss: 44, date: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: 5, activity_type: 'strength', distance_km: 0, duration_min: 55, avg_hr: 118, max_hr: 148, calories: 320, tss: 38, date: new Date(Date.now() - 6 * 86400000).toISOString() },
]

export const DEMO_TODAY = DEMO_METRICS[DEMO_METRICS.length - 1]

export const DEMO_NUTRITION = {
  calories_target: 2800,
  calories_consumed: 2140,
  protein_g: 148,
  carbs_g: 268,
  fat_g: 72,
  water_ml: 2200,
  water_target_ml: 3000,
  meals: [
    { time: '07:30', name: 'Desayuno pre-entreno', calories: 520, protein: 32, carbs: 68, fat: 14 },
    { time: '10:00', name: 'Snack recovery', calories: 280, protein: 24, carbs: 30, fat: 8 },
    { time: '13:30', name: 'Almuerzo', calories: 780, protein: 52, carbs: 88, fat: 28 },
    { time: '17:00', name: 'Merienda', calories: 320, protein: 18, carbs: 42, fat: 12 },
    { time: '20:00', name: 'Cena', calories: 640, protein: 48, carbs: 72, fat: 22 },
  ]
}
