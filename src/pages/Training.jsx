import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import AppLayout from '../components/AppLayout'
import { supabase, getTrainingSessions, getDailyMetrics } from '../lib/supabase'
import { DEMO_SESSIONS, DEMO_METRICS } from '../lib/demoData'

const ZONES = [
  { name: 'Z1 Recuperación', color: '#5BB8FF', range: '< 120 bpm', pct: 18 },
  { name: 'Z2 Aeróbico', color: '#00E5A0', range: '120–140 bpm', pct: 42 },
  { name: 'Z3 Tempo', color: '#FFB347', range: '140–155 bpm', pct: 24 },
  { name: 'Z4 Umbral', color: '#FF8C47', range: '155–168 bpm', pct: 12 },
  { name: 'Z5 VO2max', color: '#ff6b6b', range: '> 168 bpm', pct: 4 },
]

const DAYS_ES = ['D', 'L', 'M', 'X', 'J', 'V', 'S'] // getDay() 0=Sun

export default function Training() {
  const [sessions, setSessions] = useState(DEMO_SESSIONS)
  const [metrics, setMetrics] = useState(DEMO_METRICS)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      getTrainingSessions(user.id).then(({ data }) => { if (data?.length) setSessions(data) })
      getDailyMetrics(user.id, 8).then(({ data }) => { if (data?.length) setMetrics(data) })
    })
  }, [])

  // Build daily TSS from real session data
  const sessionTssByDate: Record<string, number> = {}
  sessions.forEach(s => {
    const d = (s.start_time || s.date || '').slice(0, 10)
    if (d) sessionTssByDate[d] = (sessionTssByDate[d] || 0) + (s.tss || 0)
  })

  const weeklyLoad = metrics.slice(-8).map((m, i) => {
    const date = m.date || ''
    const dayIndex = date ? new Date(date + 'T12:00:00').getDay() : i
    return {
      day: DAYS_ES[dayIndex],
      tss: sessionTssByDate[date] || 0,
      readiness: m.readiness_score || 0,
    }
  })

  const recentSessions = sessions.slice(0, 7)
  const totalDistance = recentSessions.reduce((s, a) => s + (a.distance_km || 0), 0)
  const totalMinutes = recentSessions.reduce((s, a) => s + (a.duration_min || 0), 0)
  const totalTss = recentSessions.reduce((s, a) => s + (a.tss || 0), 0)
  const totalCalories = recentSessions.reduce((s, a) => s + (a.calories || 0), 0)

  const activityIcon = t => ({ running: '🏃', cycling: '🚴', swimming: '🏊', strength: '💪' }[t] || '⚡')
  const activityColor = t => ({ running: '#00E5A0', cycling: '#5BB8FF', swimming: '#b088ff', strength: '#FFB347' }[t] || '#00E5A0')

  return (
    <AppLayout>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#00E5A0', letterSpacing: 2, marginBottom: 4 }}>// ENTRENAMIENTO</p>
        <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, letterSpacing: 1 }}>TRAINING LOAD</h1>
      </div>

      {/* Weekly TSS chart */}
      <div style={{ background: '#0D1316', border: '1px solid rgba(0,229,160,0.1)', borderRadius: 10, padding: 20, marginBottom: 20 }}>
        <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#7A8E88', letterSpacing: .5, marginBottom: 16 }}>CARGA SEMANAL (TSS)</div>
        <ResponsiveContainer width="100%" height={140}>
          <BarChart data={weeklyLoad}>
            <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#7A8E88' }} axisLine={false} tickLine={false} />
            <YAxis hide />
            <Tooltip contentStyle={{ background: '#0D1316', border: '1px solid rgba(0,229,160,0.2)', borderRadius: 8, fontSize: 12 }} />
            <Bar dataKey="tss" fill="#00E5A0" fillOpacity={0.7} radius={[4, 4, 0, 0]} name="TSS" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* HR Zones */}
        <div style={{ background: '#0D1316', border: '1px solid rgba(0,229,160,0.1)', borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#7A8E88', letterSpacing: .5, marginBottom: 16 }}>ZONAS DE FRECUENCIA CARDÍACA</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {ZONES.map(z => (
              <div key={z.name}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ color: '#c8dcd5' }}>{z.name}</span>
                  <span style={{ color: z.color, fontFamily: "'JetBrains Mono',monospace" }}>{z.pct}%</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${z.pct}%`, background: z.color, borderRadius: 3, opacity: .8 }} />
                </div>
                <div style={{ fontSize: 10, color: '#7A8E88', marginTop: 2 }}>{z.range}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly summary */}
        <div style={{ background: '#0D1316', border: '1px solid rgba(0,229,160,0.1)', borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#7A8E88', letterSpacing: .5, marginBottom: 16 }}>RESUMEN SEMANAL</div>
          {[
            { label: 'VOLUMEN TOTAL', value: `${totalDistance.toFixed(1)} km` },
            { label: 'TIEMPO ACTIVO', value: `${Math.floor(totalMinutes / 60)}h ${totalMinutes % 60}min` },
            { label: 'TSS ACUMULADO', value: `${totalTss}` },
            { label: 'CALORÍAS', value: `${totalCalories.toLocaleString()} kcal` },
            { label: 'SESIONES', value: `${recentSessions.length}` },
          ].map(item => (
            <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#7A8E88', letterSpacing: .5 }}>{item.label}</span>
              <span style={{ fontSize: 16, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 1, color: '#00E5A0' }}>{item.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Session list */}
      <div style={{ background: '#0D1316', border: '1px solid rgba(0,229,160,0.1)', borderRadius: 10, padding: 20 }}>
        <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#7A8E88', letterSpacing: .5, marginBottom: 16 }}>ACTIVIDADES RECIENTES</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {sessions.map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: '#111820', borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: `${activityColor(s.activity_type)}15`, border: `1px solid ${activityColor(s.activity_type)}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                {activityIcon(s.activity_type)}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500, textTransform: 'capitalize', marginBottom: 2 }}>{s.activity_type}</div>
                <div style={{ fontSize: 11, color: '#7A8E88' }}>
                  {new Date(s.start_time || s.date).toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                </div>
              </div>
              {[
                s.distance_km > 0 ? { label: 'Distancia', val: `${s.distance_km}km` } : null,
                { label: 'Duración', val: `${s.duration_min}min` },
                s.avg_hr ? { label: 'FC avg', val: `${s.avg_hr}bpm` } : null,
                s.tss ? { label: 'TSS', val: s.tss } : null,
                s.calories ? { label: 'kcal', val: s.calories } : null,
              ].filter(Boolean).map(item => (
                <div key={item.label} style={{ textAlign: 'center', minWidth: 60 }}>
                  <div style={{ fontSize: 13, fontFamily: "'JetBrains Mono',monospace", color: activityColor(s.activity_type) }}>{item.val}</div>
                  <div style={{ fontSize: 10, color: '#7A8E88' }}>{item.label}</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
