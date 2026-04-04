import AppLayout from '../components/AppLayout'
import { DEMO_NUTRITION } from '../lib/demoData'

export default function Nutrition() {
  const n = DEMO_NUTRITION
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
        <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, letterSpacing: 1 }}>NUTRITION TRACKING</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Calories */}
        <div style={{ background: '#0D1316', border: '1px solid rgba(0,229,160,0.1)', borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#7A8E88', letterSpacing: .5, marginBottom: 16 }}>CALORÍAS DEL DÍA</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 48, color: '#00E5A0' }}>{n.calories_consumed.toLocaleString()}</span>
            <span style={{ fontSize: 14, color: '#7A8E88' }}>/ {n.calories_target.toLocaleString()} kcal</span>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ height: '100%', width: `${cPct}%`, background: '#00E5A0', borderRadius: 4, opacity: .8, transition: 'width .5s' }} />
          </div>
          <div style={{ fontSize: 12, color: '#7A8E88' }}>Faltan {(n.calories_target - n.calories_consumed).toLocaleString()} kcal · {cPct}% completado</div>

          <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 24 }}>
            <MacroRing value={n.protein_g} total={180} color="#ff6b6b" label="PROTEÍNA" unit="g" />
            <MacroRing value={n.carbs_g} total={320} color="#FFB347" label="CARBOS" unit="g" />
            <MacroRing value={n.fat_g} total={90} color="#5BB8FF" label="GRASAS" unit="g" />
          </div>
        </div>

        {/* Hydration */}
        <div style={{ background: '#0D1316', border: '1px solid rgba(0,229,160,0.1)', borderRadius: 10, padding: 20 }}>
          <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#7A8E88', letterSpacing: .5, marginBottom: 16 }}>HIDRATACIÓN</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 12 }}>
            <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 48, color: '#5BB8FF' }}>{(n.water_ml / 1000).toFixed(1)}</span>
            <span style={{ fontSize: 14, color: '#7A8E88' }}>/ {(n.water_target_ml / 1000).toFixed(1)} L</span>
          </div>
          <div style={{ height: 8, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ height: '100%', width: `${wPct}%`, background: '#5BB8FF', borderRadius: 4, opacity: .8 }} />
          </div>
          <div style={{ fontSize: 12, color: '#7A8E88', marginBottom: 20 }}>{wPct}% del objetivo · Faltan {((n.water_target_ml - n.water_ml) / 1000).toFixed(1)}L</div>

          <div style={{ background: 'rgba(91,184,255,0.06)', border: '1px solid rgba(91,184,255,0.15)', borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 12, color: '#5BB8FF', fontWeight: 500, marginBottom: 4 }}>💡 AI Sugerencia</div>
            <div style={{ fontSize: 13, color: '#7A8E88', lineHeight: 1.6, fontWeight: 300 }}>
              Basado en tu sesión de esta mañana (720 kcal, 58min), tu déficit hídrico estimado es ~800ml. Bebe 250ml antes de cada comida.
            </div>
          </div>
        </div>
      </div>

      {/* Meals */}
      <div style={{ background: '#0D1316', border: '1px solid rgba(0,229,160,0.1)', borderRadius: 10, padding: 20 }}>
        <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#7A8E88', letterSpacing: .5, marginBottom: 16 }}>LOG DE COMIDAS</div>
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
