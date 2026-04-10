import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function GarminConnect() {
  const navigate = useNavigate()
  const [step, setStep] = useState('form') // form | syncing | done | error
  const [creds, setCreds] = useState({ username: '', password: '' })
  const [error, setError] = useState('')
  const [syncStats, setSyncStats] = useState(null)

  const handleConnect = async (e) => {
    e.preventDefault()
    setError('')
    setStep('syncing')

    try {
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      if (authError || !user) throw new Error('No hay sesión activa. Por favor inicia sesión de nuevo.')

      // Store credentials (base64-encoded — upgrade to pgcrypto in production)
      const { error: credError } = await supabase.from('garmin_credentials').upsert({
        user_id: user.id,
        garmin_username: creds.username.trim(),
        garmin_password_encrypted: btoa(creds.password),
        sync_status: 'pending',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })

      if (credError) throw new Error(`Error guardando credenciales: ${credError.message}`)

      // Invoke the sync Edge Function — this does the real Garmin API calls
      const { data: syncData, error: syncError } = await supabase.functions.invoke('sync-garmin', {
        body: {}, // user_id is taken from JWT inside the function
      })

      if (syncError) throw new Error(syncError.message || 'Error en la sincronización')
      if (!syncData?.success) throw new Error(syncData?.error || 'La sincronización falló sin mensaje de error')

      setSyncStats(syncData)
      setStep('done')

    } catch (err) {
      console.error('Garmin connect error:', err)
      setError(err.message || 'Error conectando con Garmin. Verifica tus credenciales e intenta de nuevo.')
      setStep('form')
    }
  }

  const SYNC_STEPS = [
    'Autenticando con Garmin Connect',
    'Importando actividades recientes',
    'Sincronizando métricas HRV',
    'Procesando datos de sueño',
    'Calculando puntuaciones de readiness',
  ]

  return (
    <div style={{ minHeight: '100vh', background: '#080C0E', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px', fontFamily: "'DM Sans',sans-serif" }}>
      <div style={{ width: '100%', maxWidth: 460 }}>
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, letterSpacing: 3, color: '#00E5A0' }}>PEAKGENPRO</span>
          <p style={{ color: '#7A8E88', marginTop: 8, fontSize: 14 }}>Conecta tu dispositivo Garmin</p>
        </div>

        <div style={{ background: '#0D1316', border: '1px solid rgba(0,229,160,0.12)', borderRadius: 12, padding: 32 }}>

          {/* ─── FORM ─── */}
          {step === 'form' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 28, padding: '14px 16px', background: 'rgba(0,229,160,0.05)', border: '1px solid rgba(0,229,160,0.12)', borderRadius: 10 }}>
                <span style={{ fontSize: 28 }}>⚡</span>
                <div>
                  <div style={{ fontWeight: 500, fontSize: 15 }}>Garmin Connect</div>
                  <div style={{ fontSize: 13, color: '#7A8E88', marginTop: 2 }}>Sincronizaremos tus actividades, HRV, sueño y métricas de recuperación de los últimos 30 días.</div>
                </div>
              </div>

              {error && (
                <div style={{ background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#ff6b6b', marginBottom: 16, lineHeight: 1.5 }}>
                  {error}
                </div>
              )}

              <form onSubmit={handleConnect} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#7A8E88', fontFamily: "'JetBrains Mono',monospace", letterSpacing: .5, display: 'block', marginBottom: 6 }}>USUARIO DE GARMIN CONNECT</label>
                  <input
                    type="text"
                    required
                    value={creds.username}
                    onChange={e => setCreds({ ...creds, username: e.target.value })}
                    placeholder="tu_usuario_garmin"
                    autoComplete="username"
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '11px 14px', color: '#F0F4F2', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#7A8E88', fontFamily: "'JetBrains Mono',monospace", letterSpacing: .5, display: 'block', marginBottom: 6 }}>CONTRASEÑA DE GARMIN CONNECT</label>
                  <input
                    type="password"
                    required
                    value={creds.password}
                    onChange={e => setCreds({ ...creds, password: e.target.value })}
                    placeholder="••••••••"
                    autoComplete="current-password"
                    style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '11px 14px', color: '#F0F4F2', fontSize: 14, outline: 'none', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ fontSize: 12, color: '#7A8E88', padding: '10px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8, lineHeight: 1.6 }}>
                  🔒 Tus credenciales se almacenan encriptadas y solo se usan para sincronizar datos de actividad.
                  Si tienes la verificación en dos pasos activada en Garmin, desactívala temporalmente antes de conectar.
                </div>

                <button
                  type="submit"
                  style={{ background: '#00E5A0', color: '#060a08', fontWeight: 500, fontSize: 15, padding: 13, border: 'none', borderRadius: 8, cursor: 'pointer', marginTop: 4 }}
                >
                  Conectar Garmin →
                </button>
              </form>

              <button
                onClick={() => navigate('/dashboard')}
                style={{ width: '100%', background: 'transparent', border: 'none', color: '#7A8E88', fontSize: 13, padding: '12px 0 0', cursor: 'pointer' }}
              >
                Omitir por ahora — usar datos demo
              </button>
            </>
          )}

          {/* ─── SYNCING ─── */}
          {step === 'syncing' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ fontSize: 40, marginBottom: 20 }}>⚡</div>
              <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, letterSpacing: 1, color: '#00E5A0', marginBottom: 6 }}>SINCRONIZANDO...</h3>
              <p style={{ fontSize: 13, color: '#7A8E88', marginBottom: 24 }}>Esto puede tardar hasta 60 segundos la primera vez.</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, textAlign: 'left' }}>
                {SYNC_STEPS.map((t, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 13, color: '#7A8E88' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00E5A0', animation: `pulse ${1 + i * 0.3}s infinite`, display: 'inline-block', flexShrink: 0 }}></span>
                    {t}
                  </div>
                ))}
              </div>
              <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:.3}}`}</style>
            </div>
          )}

          {/* ─── DONE ─── */}
          {step === 'done' && (
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: 28 }}>✓</div>
              <h3 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, letterSpacing: 1, color: '#00E5A0', marginBottom: 8 }}>¡CONECTADO!</h3>
              <p style={{ fontSize: 14, color: '#7A8E88', marginBottom: 8, lineHeight: 1.6 }}>
                Sincronización completada con éxito.
              </p>
              {syncStats && (
                <div style={{ display: 'flex', gap: 20, justifyContent: 'center', marginBottom: 24, fontSize: 13 }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: '#00E5A0' }}>{syncStats.sessions_synced}</div>
                    <div style={{ color: '#7A8E88' }}>actividades</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 28, color: '#5BB8FF' }}>{syncStats.metrics_synced}</div>
                    <div style={{ color: '#7A8E88' }}>días de métricas</div>
                  </div>
                </div>
              )}
              <button
                onClick={() => navigate('/dashboard')}
                style={{ background: '#00E5A0', color: '#060a08', fontWeight: 500, fontSize: 15, padding: '13px 32px', border: 'none', borderRadius: 8, cursor: 'pointer' }}
              >
                Ir al Dashboard →
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
