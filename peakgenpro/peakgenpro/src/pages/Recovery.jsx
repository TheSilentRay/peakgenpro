import { useEffect, useState } from 'react'
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import AppLayout from '../components/AppLayout'
import { supabase, getDailyMetrics } from '../lib/supabase'
import { DEMO_METRICS, DEMO_TODAY } from '../lib/demoData'

export default function Recovery() {
  const [metrics, setMetrics] = useState(DEMO_METRICS)
  const [today, setToday] = useState(DEMO_TODAY)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      getDailyMetrics(user.id, 30).then(({ data }) => {
        if (data?.length) { setMetrics(data); setToday(data[data.length - 1]) }
      })
    })
  }, [])

  const hrvData = metrics.slice(-14).map(m => ({ date: m.date?.slice(5), hrv: m.hrv_ms, baseline: 58 }))
  const sleepData = metrics.slice(-7).map(m => ({
    date: m.date?.slice(5),
    total: m.sleep_hours,
    score: m.sleep_score
  }))

  const sleepStages = [
    { name: 'Sueño profundo', hours: 1.4, color: '#5BB8FF', pct: 18 },
    { name: 'REM', hours: 1.8, color: '#b088ff', pct: 23 },
    { name: 'Sueño ligero', hours: 3.9, color: '#00E5A0', pct: 50 },
    { name: 'Despierto', hours: 0.7, color: '#FFB347', pct: 9 },
  ]

  const recovScore = today.readiness_score
  const scoreColor = recovScore >= 70 ? '#00E5A0' : recovScore >= 50 ? '#FFB347' : '#ff6b6b'
  const scoreLabel = recovScore >= 70 ? 'ÓPTIMO' : recovScore >= 50 ? 'MODERADO' : 'BAJO'

  return (
    <AppLayout>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#00E5A0', letterSpacing: 2, marginBottom: 4 }}>// RECUPERACIÓN</p>
        <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, letterSpacing: 1 }}>RECOVERY SCORE</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr 1fr', gap: 16, marginBottom: 20 }}>
        {/* Big score */}
        <div style={{ background: '#0D1316', border: `1px solid ${scoreColor}30`, borderRadius: 10, padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#7A8E88', letterSpacing: .5, marginBottom: 12 }}>HOY</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 72, lineHeight: 1, color: scoreColor }}>{recovScore}</div>
          <div style={{ fontSize: 12, fontFamily: "'JetBrains Mono',monospace", color: scoreColor, letterSpacing: 1, marginTop: 8 }}>{scoreLabel}</div>
        </div>

        {/* HRV trend */}
        <div style={{ background: '#0D1316', border: '1px solid rgba(0,229,160,0.1)', borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#7A8E88', letterSpacing: .5, marginBottom: 4 }}>HRV TREND — 14 DÍAS</div>
          <div style={{ display: 'flex', gap: 20, marginBottom: 12 }}>
            <div><span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: '#5BB8FF' }}>{today.hrv_ms}ms</span><span style={{ fontSize: 12, color: '#7A8E88', marginLeft: 6 }}>hoy</span></div>
            <div><span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: '#7A8E88' }}>{Math.round(metrics.slice(-7).reduce((s,m)=>s+m.hrv_ms,0)/7)}ms</span><span style={{ fontSize: 12, color: '#7A8E88', marginLeft: 6 }}>promedio 7d</span></div>
          </div>
          <ResponsiveContainer width="100%" height={100}>
            <AreaChart data={hrvData}>
              <defs>
                <linearGradient id="gHRV2" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#5BB8FF" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#5BB8FF" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#7A8E88' }} axisLine={false} tickLine={false} />
              <YAxis hide domain={['auto','auto']} />
              <Tooltip contentStyle={{ background: '#0D1316', border: '1px solid rgba(91,184,255,0.2)', borderRadius: 8, fontSize: 11 }} />
              <Area type="monotone" dataKey="hrv" stroke="#5BB8FF" strokeWidth={2} fill="url(#gHRV2)" name="HRV ms" />
              <Line type="monotone" dataKey="baseline" stroke="#FFB347" strokeWidth={1} strokeDasharray="4 4" dot={false} name="Baseline" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Body battery */}
        <div style={{ background: '#0D1316', border: '1px solid rgba(0,229,160,0.1)', borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#7A8E88', letterSpacing: .5, marginBottom: 12 }}>FACTORES DE RECUPERACIÓN</div>
          {[
            { label: 'SUEÑO', value: `${today.sleep_hours}h`, score: today.sleep_score, color: '#b088ff' },
            { label: 'HRV', value: `${today.hrv_ms}ms`, score: Math.min(100, Math.round(today.hrv_ms * 1.5)), color: '#5BB8FF' },
            { label: 'ESTRÉS', value: `${today.stress_score}`, score: 100 - today.stress_score, color: '#FFB347' },
            { label: 'BODY BATTERY', value: `${today.body_battery}%`, score: today.body_battery, color: '#00E5A0' },
          ].map(f => (
            <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <span style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: '#7A8E88', width: 90, letterSpacing: .5 }}>{f.label}</span>
              <div style={{ flex: 1, height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${f.score}%`, background: f.color, borderRadius: 3, opacity: .8 }} />
              </div>
              <span style={{ fontSize: 12, fontFamily: "'JetBrains Mono',monospace", color: f.color, minWidth: 36, textAlign: 'right' }}>{f.value}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Sleep stages */}
        <div style={{ background: '#0D1316', border: '1px solid rgba(0,229,160,0.1)', borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#7A8E88', letterSpacing: .5, marginBottom: 6 }}>FASES DE SUEÑO — ÚLTIMA NOCHE</div>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, color: '#b088ff', marginBottom: 16 }}>{today.sleep_hours}h <span style={{ fontSize: 16, color: '#7A8E88' }}>Score {today.sleep_score}</span></div>
          <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', marginBottom: 16, gap: 2 }}>
            {sleepStages.map(s => (
              <div key={s.name} style={{ flex: s.pct, background: s.color, opacity: .75 }} />
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sleepStages.map(s => (
              <div key={s.name} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ width: 10, height: 10, borderRadius: 2, background: s.color, opacity: .75, flexShrink: 0 }}></span>
                <span style={{ fontSize: 13, color: '#c8dcd5', flex: 1 }}>{s.name}</span>
                <span style={{ fontSize: 13, fontFamily: "'JetBrains Mono',monospace", color: s.color }}>{s.hours}h</span>
                <span style={{ fontSize: 11, color: '#7A8E88' }}>{s.pct}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recommendations */}
        <div style={{ background: '#0D1316', border: '1px solid rgba(0,229,160,0.15)', borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#00E5A0', letterSpacing: .5, marginBottom: 16 }}>// RECOMENDACIONES AI</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { icon: '😴', title: 'Sueño', text: 'Tu sueño profundo está en 18% — dentro del rango óptimo (15-25%). Mantén horario consistente.', color: '#b088ff' },
              { icon: '💧', title: 'Hidratación', text: 'Bebe 500ml extra hoy. Tu sudoración media en sesiones recientes fue alta.', color: '#5BB8FF' },
              { icon: '🏃', title: 'Mañana', text: recovScore >= 70 ? 'Readiness alto — buena ventana para intensidad. Aprovecha la mañana.' : 'Readiness moderado — sesión de recuperación activa o descanso recomendado.', color: scoreColor },
            ].map(r => (
              <div key={r.title} style={{ display: 'flex', gap: 12, padding: '12px 14px', background: '#111820', borderRadius: 8, borderLeft: `3px solid ${r.color}40` }}>
                <span style={{ fontSize: 18, flexShrink: 0 }}>{r.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: r.color, marginBottom: 4 }}>{r.title}</div>
                  <div style={{ fontSize: 13, color: '#7A8E88', lineHeight: 1.6, fontWeight: 300 }}>{r.text}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
