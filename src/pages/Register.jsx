import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signUp } from '../lib/supabase'

const STEPS = ['Cuenta', 'Deporte', 'Cuerpo', 'Objetivos']

const SPORTS = ['Triatlón', 'Running', 'Ciclismo', 'Natación', 'CrossFit', 'Fútbol', 'Tenis', 'Otro']
const GOALS = ['Mejorar rendimiento', 'Perder peso', 'Ganar masa muscular', 'Reducir lesiones', 'Preparar competición', 'Salud general', 'Otro']

export default function Register() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    email: '', password: '',
    sport: '', sportCustom: '', level: 'intermedio',
    age: '', weight: '', height: '',
    goal: '', goalCustom: '', sessions_per_week: '4'
  })

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const next = () => setStep(s => Math.min(s + 1, 3))
  const back = () => setStep(s => Math.max(s - 1, 0))

  const handleSubmit = async () => {
    setLoading(true)
    setError('')
    const sportValue = form.sport === 'Otro' ? (form.sportCustom.trim() || 'Otro') : form.sport
    const goalValue = form.goal === 'Otro' ? (form.goalCustom.trim() || 'Otro') : form.goal
    const { error } = await signUp(form.email, form.password, {
      sport: sportValue, level: form.level, age: form.age,
      weight_kg: form.weight, height_cm: form.height,
      goal: goalValue, sessions_per_week: form.sessions_per_week
    })
    setLoading(false)
    if (error) { setError(error.message); return }
    navigate('/connect-garmin')
  }

  const inputStyle = {
    width: '100%', background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
    padding: '11px 14px', color: '#F0F4F2', fontSize: 14, outline: 'none',
    fontFamily: "'DM Sans',sans-serif"
  }
  const labelStyle = { fontSize: 12, color: '#7A8E88', fontFamily: "'JetBrains Mono',monospace", letterSpacing: .5, display: 'block', marginBottom: 6 }

  return (
    <div style={{ minHeight: '100vh', background: '#080C0E', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link to="/" style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, letterSpacing: 3, color: '#00E5A0' }}>PEAKGENPRO</Link>
          <p style={{ color: '#7A8E88', marginTop: 8, fontSize: 14 }}>Crea tu perfil de atleta</p>
        </div>

        {/* Step indicators */}
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 32, gap: 0 }}>
          {STEPS.map((s, i) => (
            <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, position: 'relative' }}>
              {i > 0 && <div style={{ position: 'absolute', top: 12, right: '50%', width: '100%', height: 1, background: i <= step ? '#00E5A0' : 'rgba(255,255,255,0.08)', zIndex: 0 }} />}
              <div style={{
                width: 24, height: 24, borderRadius: '50%', zIndex: 1,
                background: i < step ? '#00E5A0' : i === step ? 'rgba(0,229,160,0.15)' : 'rgba(255,255,255,0.05)',
                border: i === step ? '2px solid #00E5A0' : i < step ? 'none' : '1px solid rgba(255,255,255,0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 500, color: i < step ? '#060a08' : i === step ? '#00E5A0' : '#7A8E88'
              }}>
                {i < step ? '✓' : i + 1}
              </div>
              <span style={{ fontSize: 11, color: i === step ? '#00E5A0' : '#7A8E88' }}>{s}</span>
            </div>
          ))}
        </div>

        <div style={{ background: '#0D1316', border: '1px solid rgba(0,229,160,0.12)', borderRadius: 12, padding: 32 }}>
          {error && <div style={{ background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#ff6b6b', marginBottom: 16 }}>{error}</div>}

          {/* Step 0: Account */}
          {step === 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, letterSpacing: 1, marginBottom: 4 }}>CREA TU CUENTA</h3>
              <div><label style={labelStyle}>EMAIL</label><input style={inputStyle} type="email" placeholder="tu@email.com" value={form.email} onChange={e => update('email', e.target.value)} /></div>
              <div><label style={labelStyle}>CONTRASEÑA</label><input style={inputStyle} type="password" placeholder="Mínimo 8 caracteres" value={form.password} onChange={e => update('password', e.target.value)} /></div>
              <button onClick={next} disabled={!form.email || form.password.length < 8}
                style={{ background: '#00E5A0', color: '#060a08', fontWeight: 500, fontSize: 15, padding: 13, border: 'none', borderRadius: 8, cursor: 'pointer', marginTop: 8, opacity: (!form.email || form.password.length < 8) ? .5 : 1 }}>
                Continuar →
              </button>
              <div style={{ textAlign: 'center', fontSize: 13, color: '#7A8E88' }}>
                ¿Ya tienes cuenta? <Link to="/login" style={{ color: '#00E5A0' }}>Iniciar sesión</Link>
              </div>
            </div>
          )}

          {/* Step 1: Sport */}
          {step === 1 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, letterSpacing: 1, marginBottom: 4 }}>TU DEPORTE</h3>
              <div>
                <label style={labelStyle}>DISCIPLINA PRINCIPAL</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  {SPORTS.map(s => (
                    <button key={s} onClick={() => update('sport', s)}
                      style={{ padding: '10px 14px', borderRadius: 8, border: form.sport === s ? '1px solid #00E5A0' : '1px solid rgba(255,255,255,0.08)', background: form.sport === s ? 'rgba(0,229,160,0.1)' : 'transparent', color: form.sport === s ? '#00E5A0' : '#7A8E88', fontSize: 13, cursor: 'pointer', transition: 'all .15s' }}>
                      {s}
                    </button>
                  ))}
                </div>
                {form.sport === 'Otro' && (
                  <input
                    type="text"
                    placeholder="Escribe tu deporte..."
                    value={form.sportCustom}
                    onChange={e => update('sportCustom', e.target.value)}
                    autoFocus
                    style={{ ...inputStyle, marginTop: 10 }}
                  />
                )}
              </div>
              <div>
                <label style={labelStyle}>NIVEL</label>
                <select value={form.level} onChange={e => update('level', e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}>
                  <option value="principiante">Principiante</option>
                  <option value="intermedio">Intermedio</option>
                  <option value="avanzado">Avanzado</option>
                  <option value="elite">Élite / Competición</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={back} style={{ flex: 1, padding: 12, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#7A8E88', cursor: 'pointer' }}>← Atrás</button>
                <button onClick={next} disabled={!form.sport || (form.sport === 'Otro' && !form.sportCustom.trim())}
                  style={{ flex: 2, background: '#00E5A0', color: '#060a08', fontWeight: 500, fontSize: 15, padding: 12, border: 'none', borderRadius: 8, cursor: 'pointer', opacity: (!form.sport || (form.sport === 'Otro' && !form.sportCustom.trim())) ? .5 : 1 }}>
                  Continuar →
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Body */}
          {step === 2 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, letterSpacing: 1, marginBottom: 4 }}>DATOS CORPORALES</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
                <div><label style={labelStyle}>EDAD</label><input style={inputStyle} type="number" placeholder="28" min="15" max="80" value={form.age} onChange={e => update('age', e.target.value)} /></div>
                <div><label style={labelStyle}>PESO (kg)</label><input style={inputStyle} type="number" placeholder="72" min="40" max="200" value={form.weight} onChange={e => update('weight', e.target.value)} /></div>
                <div><label style={labelStyle}>TALLA (cm)</label><input style={inputStyle} type="number" placeholder="178" min="140" max="220" value={form.height} onChange={e => update('height', e.target.value)} /></div>
              </div>
              <div style={{ background: 'rgba(0,229,160,0.05)', border: '1px solid rgba(0,229,160,0.12)', borderRadius: 8, padding: '12px 14px', fontSize: 12, color: '#7A8E88', lineHeight: 1.6 }}>
                Estos datos se usan para calibrar tus zonas de entrenamiento, calcular gasto calórico real y personalizar las recomendaciones del AI Coach.
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={back} style={{ flex: 1, padding: 12, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#7A8E88', cursor: 'pointer' }}>← Atrás</button>
                <button onClick={next}
                  style={{ flex: 2, background: '#00E5A0', color: '#060a08', fontWeight: 500, fontSize: 15, padding: 12, border: 'none', borderRadius: 8, cursor: 'pointer' }}>
                  Continuar →
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Goals */}
          {step === 3 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, letterSpacing: 1, marginBottom: 4 }}>TUS OBJETIVOS</h3>
              <div>
                <label style={labelStyle}>OBJETIVO PRINCIPAL</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {GOALS.map(g => (
                    <button key={g} onClick={() => update('goal', g)}
                      style={{ padding: '10px 14px', borderRadius: 8, border: form.goal === g ? '1px solid #00E5A0' : '1px solid rgba(255,255,255,0.08)', background: form.goal === g ? 'rgba(0,229,160,0.1)' : 'transparent', color: form.goal === g ? '#00E5A0' : '#F0F4F2', fontSize: 14, cursor: 'pointer', textAlign: 'left', transition: 'all .15s' }}>
                      {g}
                    </button>
                  ))}
                </div>
                {form.goal === 'Otro' && (
                  <input
                    type="text"
                    placeholder="Escribe tu objetivo..."
                    value={form.goalCustom}
                    onChange={e => update('goalCustom', e.target.value)}
                    autoFocus
                    style={{ ...inputStyle, marginTop: 6 }}
                  />
                )}
              </div>
              <div>
                <label style={labelStyle}>SESIONES POR SEMANA</label>
                <select value={form.sessions_per_week} onChange={e => update('sessions_per_week', e.target.value)}
                  style={{ ...inputStyle, cursor: 'pointer' }}>
                  {[2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n} sesiones / semana</option>)}
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={back} style={{ flex: 1, padding: 12, background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, color: '#7A8E88', cursor: 'pointer' }}>← Atrás</button>
                <button onClick={handleSubmit} disabled={!form.goal || (form.goal === 'Otro' && !form.goalCustom.trim()) || loading}
                  style={{ flex: 2, background: '#00E5A0', color: '#060a08', fontWeight: 500, fontSize: 15, padding: 12, border: 'none', borderRadius: 8, cursor: 'pointer', opacity: (!form.goal || (form.goal === 'Otro' && !form.goalCustom.trim()) || loading) ? .6 : 1 }}>
                  {loading ? 'Creando cuenta...' : 'Crear cuenta →'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
