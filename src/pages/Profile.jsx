import { useEffect, useState } from 'react'
import AppLayout from '../components/AppLayout'
import { supabase, saveProfile } from '../lib/supabase'
import { DEMO_USER } from '../lib/demoData'

export default function Profile() {
  const [user, setUser] = useState(DEMO_USER)
  const [form, setForm] = useState({ full_name: 'Carlos Demo', sport: 'triathlon', age: '28', weight_kg: '72', height_cm: '178', goal: 'performance', sessions_per_week: '4' })
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user: u } }) => {
      if (!u) return
      setUser(u)
      const m = u.user_metadata || {}
      setForm({
        full_name: m.full_name || '',
        sport: m.sport || '',
        age: m.age || '',
        weight_kg: m.weight_kg || '',
        height_cm: m.height_cm || '',
        goal: m.goal || '',
        sessions_per_week: m.sessions_per_week || '4'
      })
    })
  }, [])

  const handleSave = async () => {
    setLoading(true)
    const { data: { user: u } } = await supabase.auth.getUser()
    if (u) {
      await saveProfile(u.id, form)
      await supabase.auth.updateUser({ data: form })
    }
    setLoading(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px', color: '#F0F4F2', fontSize: 14, outline: 'none', fontFamily: "'DM Sans',sans-serif" }
  const labelStyle = { fontSize: 11, color: '#7A8E88', fontFamily: "'JetBrains Mono',monospace", letterSpacing: .5, display: 'block', marginBottom: 6 }

  const initials = (form.full_name || 'AT').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  return (
    <AppLayout>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#00E5A0', letterSpacing: 2, marginBottom: 4 }}>// PERFIL</p>
        <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, letterSpacing: 1 }}>ATHLETE PROFILE</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20 }}>
        {/* Avatar card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: '#0D1316', border: '1px solid rgba(0,229,160,0.1)', borderRadius: 10, padding: 24, textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(0,229,160,0.12)', border: '2px solid rgba(0,229,160,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, letterSpacing: 2, color: '#00E5A0' }}>
              {initials}
            </div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: 1, marginBottom: 4 }}>{form.full_name || 'ATLETA'}</div>
            <div style={{ fontSize: 12, color: '#7A8E88', marginBottom: 16, textTransform: 'capitalize' }}>{form.sport} · {form.level || 'Avanzado'}</div>
            <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#7A8E88', wordBreak: 'break-all' }}>{user?.email}</div>
          </div>

          <div style={{ background: '#0D1316', border: '1px solid rgba(0,229,160,0.1)', borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#7A8E88', letterSpacing: .5, marginBottom: 12 }}>MÉTRICAS CORPORALES</div>
            {[
              { label: 'EDAD', value: `${form.age} años` },
              { label: 'PESO', value: `${form.weight_kg} kg` },
              { label: 'ALTURA', value: `${form.height_cm} cm` },
              { label: 'IMC', value: form.weight_kg && form.height_cm ? (form.weight_kg / ((form.height_cm / 100) ** 2)).toFixed(1) : '—' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#7A8E88' }}>{item.label}</span>
                <span style={{ fontSize: 14, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 1, color: '#00E5A0' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Form */}
        <div style={{ background: '#0D1316', border: '1px solid rgba(0,229,160,0.1)', borderRadius: 10, padding: 28 }}>
          <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#7A8E88', letterSpacing: .5, marginBottom: 24 }}>EDITAR PERFIL</div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div style={{ gridColumn: 'span 2' }}>
              <label style={labelStyle}>NOMBRE COMPLETO</label>
              <input style={inputStyle} value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="Tu nombre" />
            </div>
            <div>
              <label style={labelStyle}>DEPORTE PRINCIPAL</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.sport} onChange={e => setForm({ ...form, sport: e.target.value })}>
                {['triatlón', 'running', 'ciclismo', 'natación', 'crossfit', 'fútbol', 'tenis', 'otro'].map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>SESIONES / SEMANA</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.sessions_per_week} onChange={e => setForm({ ...form, sessions_per_week: e.target.value })}>
                {[2,3,4,5,6,7,8,9,10].map(n => <option key={n} value={n}>{n} sesiones</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>EDAD</label>
              <input style={inputStyle} type="number" value={form.age} onChange={e => setForm({ ...form, age: e.target.value })} placeholder="28" />
            </div>
            <div>
              <label style={labelStyle}>OBJETIVO</label>
              <select style={{ ...inputStyle, cursor: 'pointer' }} value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })}>
                {['performance', 'weight_loss', 'muscle_gain', 'endurance', 'competition', 'health'].map(g => <option key={g} value={g}>{g.replace('_', ' ')}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>PESO (kg)</label>
              <input style={inputStyle} type="number" value={form.weight_kg} onChange={e => setForm({ ...form, weight_kg: e.target.value })} placeholder="72" />
            </div>
            <div>
              <label style={labelStyle}>ALTURA (cm)</label>
              <input style={inputStyle} type="number" value={form.height_cm} onChange={e => setForm({ ...form, height_cm: e.target.value })} placeholder="178" />
            </div>
          </div>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <button onClick={handleSave} disabled={loading}
              style={{ background: '#00E5A0', color: '#060a08', fontWeight: 500, fontSize: 14, padding: '11px 28px', border: 'none', borderRadius: 8, cursor: 'pointer', opacity: loading ? .7 : 1 }}>
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
            {saved && <span style={{ fontSize: 13, color: '#00E5A0', fontFamily: "'JetBrains Mono',monospace" }}>✓ Guardado</span>}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
