import { useEffect, useState } from 'react'
import AppLayout from '../components/AppLayout'
import { supabase, getDailyMetrics, getTrainingSessions } from '../lib/supabase'
import { DEMO_NUTRITION } from '../lib/demoData'

const DataBadge = ({ isReal, label }) => (
  <span style={{
    fontSize: 10, fontFamily: "'JetBrains Mono',monospace", letterSpacing: 1,
    padding: '3px 8px', borderRadius: 4,
    background: isReal ? 'rgba(0,229,160,0.1)' : 'rgba(255,179,71,0.1)',
    color: isReal ? '#00E5A0' : '#FFB347',
    border: `1px solid ${isReal ? 'rgba(0,229,160,0.25)' : 'rgba(255,179,71,0.25)'}`,
  }}>
    {label || (isReal ? '✓ DATOS REALES' : '⚠ DATOS DEMO')}
  </span>
)

export default function Nutrition() {
  const [today, setToday] = useState(null)
  const [recentSessions, setRecentSessions] = useState([])
  const [isRealData, setIsRealData] = useState(false)
  const n = DEMO_NUTRITION // meals are always demo — Garmin doesn't sync food logs

  useEffect(() => {
    let active = true
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!active || !user) return
      getDailyMetrics(user.id, 1).then(({ data }) => {
        if (!active) return
        if (data?.length) { setToday(data[data.length - 1]); setIsRealData(true) }
      })
      getTrainingSessions(user.id, 5).then(({ data }) => {
        if (!active) return
        if (data?.length) setRecentSessions(data)
      })
    })
    return () => { active = false }
  }, [])

  // Real calories burned today from Garmin (active + session calories)
  const caloriesActive = today?.calories_active ?? null
  const caloriesTodayFromSessions = recentSessions
    .filter(s => (s.start_time || s.date || '').slice(0, 10) === new Date().toISOString().slice(0, 10))
    .reduce((sum, s) => sum + (s.calories || 0), 0)
  const caloriesBurned = caloriesActive ?? (caloriesTodayFromSessions > 0 ? caloriesTodayFromSessions : null)

  const steps = today?.steps ?? null
  const stepsTarget = 10000
  const stepsPct = steps ? Math.min(100, Math.round((steps / stepsTarget) * 100)) : 0

  // Demo calories for the intake side (Garmin doesn't provide food data)
  const cPct = Math.round((n.calories_consumed / n.calories_target) * 100)
  const wPct = Math.round((n.water_ml / n.water_target_ml) * 100)

  const MacroRing = ({ value, total, color, label, unit }) => {
    const pct = Math.min(100, Math.round((value / total) * 100))
    const r = 38, cx = 44, cy = 44
    const circumference = 2 * Math.PI * r
    const offset = circumference - (pct / 100) * circumference
    return (
      <div style={{ textAlign: 'center' }}>
        <svg width="88" height="88" viewBox="0 0 88 88">
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={color} strokeWidth="7"
            strokeDasharray={circumference} strokeDashoffset={offset}
            strokeLinecap="round" transform="rotate(-90 44 44)" style={{ transition: 'stroke-dashoffset .5s ease' }} />
          <text x={cx} y={cy - 4} textAnchor="middle" fill={color} fontSize="16" fontFamily="'Bebas Neue',sans-serif" letterSpacing="1">{value}</text>
          <text x={cx} y={cy + 10} textAnchor="middle" fill="#7A8E88" fontSize="9" fontFamily="'JetBrains Mono',monospace">{unit}</text>
        </svg>
        <div style={{ fontSize: 11, color: '#7A8E88', fontFamily: "'JetBrains Mono',monospace", letterSpacing: .5 }}>{label}</div>
        <div style={{ fontSize: 10, color: '#5A6A62', marginTop: 2 }}>/ {total}{unit}</div>
      </div>
    )
  }

  return (
    <AppLayout>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#00E5A0', letterSpacing: 2, marginBottom: 4 }}>// NUTRICIÓN</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, letterSpacing: 1, margin: 0 }}>NUTRITION TRACKING</h1>
          <DataBadge isReal={isRealData} />
        </div>
      </div>

      {/* ── Real Garmin data row: calories burned + steps ── */}
      {isRealData && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
          {/* Calories burned */}
          <div style={{ background: '#0D1316', border: '1px solid rgba(0,229,160,0.1)', borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#7A8E88', letterSpacing: .5, marginBottom: 8 }}>
              CALORÍAS QUEMADAS HOY · <span style={{ color: '#00E5A0' }}>GARMIN</span>
            </div>
            {caloriesBurned !== null ? (
              <>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 48, color: '#ff6b6b' }}>
                  {caloriesBurned.toLocaleString()}
                  <span style={{ fontSize: 16, marginLeft: 6, fontFamily: "'DM Sans',sans-serif", fontWeight: 300, color: '#7A8E88' }}>kcal</span>
                </div>
                <div style={{ fontSize: 12, color: '#7A8E88', marginTop: 4 }}>
                  {caloriesActive ? 'Calorías activas del día' : `De ${caloriesTodayFromSessions > 0 ? 'actividades' : '—'} de hoy`}
                </div>
              </>
            ) : (
              <div style={{ fontSize: 14, color: '#7A8E88', paddingTop: 8 }}>Sin actividades registradas hoy</div>
            )}
          </div>

          {/* Steps */}
          <div style={{ background: '#0D1316', border: '1px solid rgba(0,229,160,0.1)', borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#7A8E88', letterSpacing: .5, marginBottom: 8 }}>
              PASOS HOY · <span style={{ color: '#00E5A0' }}>GARMIN</span>
            </div>
            {steps !== null ? (
              <>
                <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 48, color: '#5BB8FF' }}>
                  {steps.toLocaleString()}
                  <span style={{ fontSize: 13, marginLeft: 6, fontFamily: "'DM Sans',sans-serif", color: '#7A8E88' }}>/ {stepsTarget.toLocaleString()}</span>
                </div>
                <div style={{ height: 6, background: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden', marginTop: 10 }}>
                  <div style={{ height: '100%', width: `${stepsPct}%`, background: '#5BB8FF', borderRadius: 3, opacity: .8 }} />
                </div>
                <div style={{ fontSize: 12, color: '#7A8E88', marginTop: 4 }}>{stepsPct}% del objetivo diario</div>
              </>
            ) : (
              <div style={{ fontSize: 14, color: '#7A8E88', paddingTop: 8 }}>Sin datos de pasos hoy</div>
            )}
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Calories intake — demo */}
        <div style={{ background: '#0D1316', border: '1px solid rgba(0,229,160,0.1)', borderRadius: 10, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#7A8E88', letterSpacing: .5 }}>INGESTA CALÓRICA</div>
            <DataBadge isReal={false} label="⚠ PLANIFICACIÓN DEMO" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 48, color: '#00E5A0' }}>{n.calories_consumed.toLocaleString()}</span>
            <span style={{ fontSize: 14, color: '#7A8E88' }}>/ {n.calories_target.toLocaleString()} kcal</span>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ height: '100%', width: `${cPct}%`, background: '#00E5A0', borderRadius: 4, opacity: .8 }} />
          </div>
          <div style={{ fontSize: 12, color: '#7A8E88', marginBottom: 16 }}>Faltan {(n.calories_target - n.calories_consumed).toLocaleString()} kcal · {cPct}% completado</div>
          <div style={{ display: 'flex', justifyContent: 'space-around' }}>
            <MacroRing value={n.protein_g} total={180} color="#ff6b6b" label="PROTEÍNA" unit="g" />
            <MacroRing value={n.carbs_g} total={320} color="#FFB347" label="CARBOS" unit="g" />
            <MacroRing value={n.fat_g} total={90} color="#5BB8FF" label="GRASAS" unit="g" />
          </div>
        </div>

        {/* Hydration — demo */}
        <div style={{ background: '#0D1316', border: '1px solid rgba(0,229,160,0.1)', borderRadius: 10, padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#7A8E88', letterSpacing: .5 }}>HIDRATACIÓN</div>
            <DataBadge isReal={false} label="⚠ PLANIFICACIÓN DEMO" />
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 48, color: '#5BB8FF' }}>{(n.water_ml / 1000).toFixed(1)}</span>
            <span style={{ fontSize: 14, color: '#7A8E88' }}>/ {(n.water_target_ml / 1000).toFixed(1)} L</span>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ height: '100%', width: `${wPct}%`, background: '#5BB8FF', borderRadius: 4, opacity: .8 }} />
          </div>
          <div style={{ fontSize: 12, color: '#7A8E88', marginBottom: 20 }}>{wPct}% del objetivo · Faltan {((n.water_target_ml - n.water_ml) / 1000).toFixed(1)}L</div>
          <div style={{ background: 'rgba(91,184,255,0.06)', border: '1px solid rgba(91,184,255,0.15)', borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 12, color: '#5BB8FF', fontWeight: 500, marginBottom: 4 }}>💡 Recomendación</div>
            <div style={{ fontSize: 13, color: '#7A8E88', lineHeight: 1.6, fontWeight: 300 }}>
              {caloriesBurned
                ? `Quemaste ${caloriesBurned.toLocaleString()} kcal activas hoy. Tu déficit hídrico estimado es ~${Math.round(caloriesBurned * 0.6)}ml. Bebe agua regularmente.`
                : 'Bebe 500ml extra antes de entrenar. La hidratación óptima mejora el rendimiento hasta un 8%.'}
            </div>
          </div>
        </div>
      </div>

      {/* Meals — always demo with clear label */}
      <div style={{ background: '#0D1316', border: '1px solid rgba(0,229,160,0.1)', borderRadius: 10, padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#7A8E88', letterSpacing: .5 }}>LOG DE COMIDAS</div>
          <DataBadge isReal={false} label="⚠ EJEMPLO — Garmin no sincroniza alimentos" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {n.meals.map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: '#111820', borderRadius: 8 }}>
              <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#7A8E88', minWidth: 40 }}>{m.time}</span>
              <span style={{ flex: 1, fontSize: 13, color: '#c8dcd5' }}>{m.name}</span>
              <div style={{ display: 'flex', gap: 20 }}>
                {[
                  { val: m.calories, label: 'kcal', color: '#00E5A0' },
                  { val: `${m.protein}g`, label: 'prot', color: '#ff6b6b' },
                  { val: `${m.carbs}g`, label: 'carb', color: '#FFB347' },
                  { val: `${m.fat}g`, label: 'grasa', color: '#5BB8FF' },
                ].map(item => (
                  <div key={item.label} style={{ textAlign: 'center', minWidth: 44 }}>
                    <div style={{ fontSize: 13, fontFamily: "'JetBrains Mono',monospace", color: item.color }}>{item.val}</div>
                    <div style={{ fontSize: 9, color: '#7A8E88' }}>{item.label}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  )
}
