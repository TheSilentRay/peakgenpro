import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AppLayout from '../components/AppLayout'
import { supabase, saveProfile } from '../lib/supabase'
import { DEMO_USER } from '../lib/demoData'

function timeAgo(dateStr) {
  if (!dateStr) return '—'
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'justo ahora'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)} h`
  return `hace ${Math.floor(diff / 86400)} días`
}

export default function Profile() {
  const navigate = useNavigate()
  const [user, setUser] = useState(DEMO_USER)
  const [form, setForm] = useState({ full_name: 'Carlos Demo', sport: 'triathlon', age: '28', weight_kg: '72', height_cm: '178', goal: 'performance', sessions_per_week: '4' })
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(false)

  // Garmin connection state
  const [garmin, setGarmin] = useState(null) // null=loading, false=none, object=connected
  const [garminAction, setGarminAction] = useState('') // 'syncing' | 'disconnecting' | ''
  const [garminMsg, setGarminMsg] = useState('')

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
      loadGarmin(u.id)
    })
  }, [])

  const loadGarmin = async (userId) => {
    const { data } = await supabase
      .from('garmin_credentials')
      .select('garmin_username, last_sync_at, sync_status, created_at')
      .eq('user_id', userId)
      .single()
    setGarmin(data || false)
  }

  const handleResync = async () => {
    setGarminAction('syncing')
    setGarminMsg('')
    const { data: { user: u } } = await supabase.auth.getUser()
    const { data, error } = await supabase.functions.invoke('sync-garmin', { body: {} })

    if (error) {
      // Extract the real error message from the response body when available
      let msg = error.message || 'Error al sincronizar'
      try {
        if (error.context && typeof error.context.json === 'function') {
          const body = await error.context.json()
          if (body?.error) msg = body.error
        }
      } catch { /* keep original msg */ }
      setGarminMsg(msg)
    } else if (!data?.success) {
      setGarminMsg(data?.error || 'La sincronización falló')
    } else {
      setGarminMsg(`✓ Sincronizado: ${data.sessions_synced} actividades, ${data.metrics_synced} días`)
      if (u) await loadGarmin(u.id)
    }
    setGarminAction('')
  }

  const handleDisconnect = async () => {
    if (!confirm('¿Desconectar tu cuenta de Garmin? Se eliminarán las credenciales almacenadas.')) return
    setGarminAction('disconnecting')
    const { data: { user: u } } = await supabase.auth.getUser()
    await supabase.from('garmin_credentials').delete().eq('user_id', u.id)
    setGarmin(false)
    setGarminMsg('')
    setGarminAction('')
  }

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

  const inputStyle = { width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '10px 14px', color: '#F0F4F2', fontSize: 14, outline: 'none', fontFamily: "'DM Sans',sans-serif", boxSizing: 'border-box' }
  const labelStyle = { fontSize: 11, color: '#7A8E88', fontFamily: "'JetBrains Mono',monospace", letterSpacing: .5, display: 'block', marginBottom: 6 }
  const initials = (form.full_name || 'AT').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()

  const isConnected = garmin?.sync_status === 'success'
  const statusColor = isConnected ? '#00E5A0' : garmin?.sync_status === 'error' ? '#ff6b6b' : '#FFB347'

  return (
    <AppLayout>
      <div style={{ marginBottom: 28 }}>
        <p style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#00E5A0', letterSpacing: 2, marginBottom: 4 }}>// PERFIL</p>
        <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, letterSpacing: 1 }}>ATHLETE PROFILE</h1>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, marginBottom: 20 }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Avatar */}
          <div style={{ background: '#0D1316', border: '1px solid rgba(0,229,160,0.1)', borderRadius: 10, padding: 24, textAlign: 'center' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(0,229,160,0.12)', border: '2px solid rgba(0,229,160,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, letterSpacing: 2, color: '#00E5A0' }}>
              {initials}
            </div>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: 1, marginBottom: 4 }}>{form.full_name || 'ATLETA'}</div>
            <div style={{ fontSize: 12, color: '#7A8E88', marginBottom: 16, textTransform: 'capitalize' }}>{form.sport} · {form.level || 'Avanzado'}</div>
            <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#7A8E88', wordBreak: 'break-all' }}>{user?.email}</div>
          </div>

          {/* Body metrics */}
          <div style={{ background: '#0D1316', border: '1px solid rgba(0,229,160,0.1)', borderRadius: 10, padding: 20 }}>
            <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#7A8E88', letterSpacing: .5, marginBottom: 12 }}>MÉTRICAS CORPORALES</div>
            {[
              { label: 'EDAD', value: `${form.age || '—'} años` },
              { label: 'PESO', value: `${form.weight_kg || '—'} kg` },
              { label: 'ALTURA', value: `${form.height_cm || '—'} cm` },
              { label: 'IMC', value: form.weight_kg && form.height_cm ? (form.weight_kg / ((form.height_cm / 100) ** 2)).toFixed(1) : '—' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                <span style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#7A8E88' }}>{item.label}</span>
                <span style={{ fontSize: 14, fontFamily: "'Bebas Neue',sans-serif", letterSpacing: 1, color: '#00E5A0' }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Right column — edit form */}
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

      {/* ── Garmin connection card ── */}
      <div style={{ background: '#0D1316', border: `1px solid ${garmin ? statusColor + '30' : 'rgba(255,255,255,0.08)'}`, borderRadius: 10, padding: 24 }}>
        <div style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#00E5A0', letterSpacing: .5, marginBottom: 16 }}>
          CONEXIÓN GARMIN CONNECT
        </div>

        {garmin === null ? (
          <div style={{ fontSize: 14, color: '#7A8E88' }}>Cargando estado de conexión...</div>
        ) : garmin === false ? (
          /* Not connected */
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#FFB347', display: 'inline-block' }}></span>
                <span style={{ fontSize: 14, color: '#FFB347', fontWeight: 500 }}>Sin conectar</span>
              </div>
              <div style={{ fontSize: 13, color: '#7A8E88' }}>
                Los dashboards muestran datos de demostración. Conecta Garmin para ver tus datos reales.
              </div>
            </div>
            <button
              onClick={() => navigate('/connect-garmin')}
              style={{ background: '#00E5A0', color: '#060a08', fontWeight: 500, fontSize: 14, padding: '10px 24px', border: 'none', borderRadius: 8, cursor: 'pointer', whiteSpace: 'nowrap' }}
            >
              Conectar Garmin →
            </button>
          </div>
        ) : (
          /* Connected */
          <div>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                {/* Status badge */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusColor, display: 'inline-block' }}></span>
                  <span style={{ fontSize: 14, color: statusColor, fontWeight: 500 }}>
                    {isConnected ? 'Datos reales activos' : garmin.sync_status === 'error' ? 'Error en última sincronización' : 'Pendiente de sincronización'}
                  </span>
                </div>

                {/* Details */}
                <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '6px 16px', fontSize: 13 }}>
                  <span style={{ color: '#7A8E88', fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>USUARIO</span>
                  <span style={{ color: '#F0F4F2', fontWeight: 500 }}>{garmin.garmin_username}</span>

                  <span style={{ color: '#7A8E88', fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>ÚLTIMA SYNC</span>
                  <span style={{ color: '#c8dcd5' }}>{timeAgo(garmin.last_sync_at)}</span>

                  <span style={{ color: '#7A8E88', fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>FUENTE DE DATOS</span>
                  <span style={{ color: isConnected ? '#00E5A0' : '#FFB347' }}>
                    {isConnected ? '✓ Garmin Connect (datos reales)' : '⚠ Demo (sync pendiente)'}
                  </span>

                  <span style={{ color: '#7A8E88', fontFamily: "'JetBrains Mono',monospace", fontSize: 11 }}>CONECTADO</span>
                  <span style={{ color: '#c8dcd5' }}>{timeAgo(garmin.created_at)}</span>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 160 }}>
                <button
                  onClick={handleResync}
                  disabled={garminAction === 'syncing'}
                  style={{ background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.3)', color: '#00E5A0', fontSize: 13, fontWeight: 500, padding: '10px 16px', borderRadius: 8, cursor: garminAction === 'syncing' ? 'not-allowed' : 'pointer', opacity: garminAction === 'syncing' ? .6 : 1 }}
                >
                  {garminAction === 'syncing' ? 'Sincronizando...' : '🔄 Sincronizar ahora'}
                </button>
                <button
                  onClick={() => navigate('/connect-garmin')}
                  style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#7A8E88', fontSize: 13, padding: '10px 16px', borderRadius: 8, cursor: 'pointer' }}
                >
                  ✏️ Cambiar cuenta
                </button>
                <button
                  onClick={handleDisconnect}
                  disabled={garminAction === 'disconnecting'}
                  style={{ background: 'transparent', border: '1px solid rgba(255,80,80,0.2)', color: '#ff6b6b', fontSize: 13, padding: '10px 16px', borderRadius: 8, cursor: garminAction === 'disconnecting' ? 'not-allowed' : 'pointer', opacity: garminAction === 'disconnecting' ? .6 : 1 }}
                >
                  {garminAction === 'disconnecting' ? 'Desconectando...' : '🔌 Desconectar'}
                </button>
              </div>
            </div>

            {garminMsg && (
              <div style={{ marginTop: 14, padding: '10px 14px', background: garminMsg.startsWith('✓') ? 'rgba(0,229,160,0.08)' : 'rgba(255,80,80,0.08)', border: `1px solid ${garminMsg.startsWith('✓') ? 'rgba(0,229,160,0.2)' : 'rgba(255,80,80,0.2)'}`, borderRadius: 8, fontSize: 13, color: garminMsg.startsWith('✓') ? '#00E5A0' : '#ff6b6b' }}>
                {garminMsg}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
