import { useEffect, useState } from 'react'
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer, Line, XAxis, YAxis, Tooltip, Area, AreaChart } from 'recharts'
import AppLayout from '../components/AppLayout'
import { supabase, getDailyMetrics, getTrainingSessions } from '../lib/supabase'
import { DEMO_METRICS, DEMO_SESSIONS, DEMO_TODAY, DEMO_USER } from '../lib/demoData'

// Module-level cache — survives navigation (component unmount/remount)
const _cache = { metrics: null, sessions: null, today: null, user: null }

const DataBadge = ({ isReal }) => (
  <span style={{
    fontSize: 10, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1,
    padding: '3px 8px', borderRadius: 4,
    background: isReal ? 'rgba(0,229,160,0.1)' : 'rgba(255,179,71,0.1)',
    color: isReal ? '#00E5A0' : '#FFB347',
    border: `1px solid ${isReal ? 'rgba(0,229,160,0.25)' : 'rgba(255,179,71,0.25)'}`,
  }}>
    {isReal ? '✓ DATOS REALES' : '⚠ DATOS DEMO'}
  </span>
)

export default function Dashboard() {
  const [metrics, setMetrics] = useState(_cache.metrics || DEMO_METRICS)
  const [sessions, setSessions] = useState(_cache.sessions || DEMO_SESSIONS)
  const [today, setToday] = useState(_cache.today || DEMO_TODAY)
  const [user, setUser] = useState(_cache.user || DEMO_USER)
  const [isRealData, setIsRealData] = useState(!!_cache.metrics)

  useEffect(() => {
    // Skip fetch if cache already has real data
    if (_cache.metrics) return
    let active = true

    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!active || !u) return
      _cache.user = u
      setUser(u)
      getDailyMetrics(u.id, 30).then(({ data }) => {
        if (!active) return
        if (data?.length) {
          _cache.metrics = data
          _cache.today = data[data.length - 1]
          setMetrics(data)
          setToday(data[data.length - 1])
          setIsRealData(true)
        }
      })
      getTrainingSessions(u.id, 5).then(({ data }) => {
        if (!active) return
        if (data?.length) { _cache.sessions = data; setSessions(data) }
      })
    })

    return () => { active = false }
  }, [])

  const radarData = [
    { subject: 'Aeróbico', value: Math.round((today.readiness_score || 50) * 0.9) },
    { subject: 'Fuerza', value: 71 },
    { subject: 'Recovery', value: today.readiness_score || 50 },
    { subject: 'Sueño', value: today.sleep_score || 50 },
    { subject: 'HRV', value: today.hrv_ms ? Math.min(100, Math.round(today.hrv_ms * 1.4)) : 50 },
    { subject: 'Nutrición', value: 78 },
  ]

  // Merge real data over the DEMO baseline so the chart is NEVER empty.
  // Real values override demo values on matching dates; demo fills the gaps.
  const realByDate = Object.fromEntries((metrics || []).map(m => [m.date, m]))
  const chartData = DEMO_METRICS.slice(-14).map(demoM => {
    const real = realByDate[demoM.date]
    return {
      date: (demoM.date || '').slice(5),
      hrv: real?.hrv_ms ?? demoM.hrv_ms,
      readiness: real?.readiness_score ?? demoM.readiness_score,
    }
  })
  const hasHrvData = isRealData
    ? chartData.some(d => d.hrv != null)
    : true // always show hrv line for demo

  const statCard = (label, value, unit = '', sub = '', color = '#00E5A0') => {
    const display = (value !== null && value !== undefined && value !== '') ? value : '—'
    const displayColor = display === '—' ? '#3A4A44' : color
    return (
      <div style={{ background: '#0D1316', border: '1px solid rgba(0,229,160,0.1)', borderRadius: 10, padding: '18px 20px' }}>
        <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#7A8E88', letterSpacing: .5, marginBottom: 8 }}>{label}</div>
        <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 36, letterSpacing: 1, color: displayColor }}>
          {display}
          {display !== '—' && <span style={{ fontSize: 16, marginLeft: 4, fontFamily: "'DM Sans',sans-serif", fontWeight: 300 }}>{unit}</span>}
        </div>
        <div style={{ fontSize: 12, color: display === '—' ? '#3A4A44' : '#7A8E88', marginTop: 4 }}>
          {display === '—' ? 'Sin datos de Garmin' : sub}
        </div>
      </div>
    )
  }

  const activityIcon = t => ({ running: '🏃', cycling: '🚴', swimming: '🏊', strength: '💪', triathlon: '⚡' }[t] || '⚡')

  return (
    <AppLayout>
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#00E5A0', letterSpacing: 2, marginBottom: 6 }}>
          // HOY · {new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }).toUpperCase()}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 36, letterSpacing: 1, margin: 0 }}>
            HOLA, {(user?.user_metadata?.full_name || user?.email || 'ATLETA').split(' ')[0].toUpperCase()}
          </h1>
          <DataBadge isReal={isRealData} />
        </div>
      </div>

      {/* KPI row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 24 }}>
        {statCard('READINESS', today.readiness_score, '', `↑ +4 vs ayer`, today.readiness_score >= 70 ? '#00E5A0' : today.readiness_score >= 50 ? '#FFB347' : '#ff6b6b')}
        {statCard('HRV', today.hrv_ms, 'ms', 'Zona óptima', '#5BB8FF')}
        {statCard('SUEÑO', today.sleep_hours, 'h', `Score: ${today.sleep_score}`, '#b088ff')}
        {statCard('BODY BATTERY', today.body_battery, '%', 'Recargando bien', '#FFB347')}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 20, marginBottom: 20 }}>
        {/* Chart */}
        <div style={{ background: '#0D1316', border: '1px solid rgba(0,229,160,0.1)', borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#7A8E88', letterSpacing: .5, marginBottom: 16 }}>
            HRV + READINESS — ÚLTIMAS 2 SEMANAS
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gHRV" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00E5A0" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#00E5A0" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#7A8E88' }} axisLine={false} tickLine={false} />
              <YAxis hide domain={[30, 100]} />
              <Tooltip contentStyle={{ background: '#0D1316', border: '1px solid rgba(0,229,160,0.2)', borderRadius: 8, fontSize: 12 }} />
              {hasHrvData && (
                <Area
                  type="monotone" dataKey="hrv" stroke="#00E5A0" strokeWidth={2}
                  fill="url(#gHRV)" name="HRV ms"
                  connectNulls isAnimationActive={false}
                />
              )}
              <Line
                type="monotone" dataKey="readiness" stroke="#5BB8FF" strokeWidth={1.5}
                dot={false} name="Readiness"
                connectNulls isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Radar */}
        <div style={{ background: '#0D1316', border: '1px solid rgba(0,229,160,0.1)', borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#7A8E88', letterSpacing: .5, marginBottom: 8 }}>FITNESS RADAR</div>
          <ResponsiveContainer width="100%" height={190}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.06)" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 10, fill: '#7A8E88' }} />
              <Radar dataKey="value" stroke="#00E5A0" fill="#00E5A0" fillOpacity={0.15} strokeWidth={1.5} isAnimationActive={false} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Recent sessions */}
        <div style={{ background: '#0D1316', border: '1px solid rgba(0,229,160,0.1)', borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#7A8E88', letterSpacing: .5, marginBottom: 16 }}>ACTIVIDADES RECIENTES</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {sessions.slice(0, 4).map((s, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', background: '#111820', borderRadius: 8 }}>
                <span style={{ fontSize: 18 }}>{activityIcon(s.activity_type)}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, textTransform: 'capitalize' }}>{s.activity_type}</div>
                  <div style={{ fontSize: 11, color: '#7A8E88' }}>{s.distance_km > 0 ? `${s.distance_km}km · ` : ''}{s.duration_min}min</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 13, color: '#00E5A0', fontFamily: "'JetBrains Mono',monospace" }}>TSS {s.tss || '—'}</div>
                  <div style={{ fontSize: 11, color: '#7A8E88' }}>{s.avg_hr ? `${s.avg_hr} bpm avg` : '—'}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Insight */}
        <div style={{ background: '#0D1316', border: '1px solid rgba(0,229,160,0.15)', borderRadius: 10, padding: 20, display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#00E5A0', letterSpacing: .5, marginBottom: 16 }}>// AI COACH INSIGHT</div>
          <div style={{ flex: 1, fontSize: 14, color: '#c8dcd5', lineHeight: 1.75, fontWeight: 300 }}>
            Tu HRV ha mejorado un <strong style={{ color: '#00E5A0', fontWeight: 500 }}>18% esta semana</strong>, indicando buena adaptación al entrenamiento. Con readiness en {today.readiness_score || '—'}, mañana es una ventana óptima para sesión de alta intensidad entre 7–9am según tu ritmo circadiano.
            <br /><br />
            <em style={{ color: '#7A8E88', fontSize: 13 }}>Considera reducir la carga el jueves para mantener la tendencia positiva.</em>
          </div>
          <button onClick={() => window.location.href = '/coach'}
            style={{ marginTop: 16, background: 'transparent', border: '1px solid rgba(0,229,160,0.25)', borderRadius: 8, padding: '10px 16px', color: '#00E5A0', fontSize: 13, cursor: 'pointer' }}>
            Chatear con AI Coach →
          </button>
        </div>
      </div>
    </AppLayout>
  )
}
