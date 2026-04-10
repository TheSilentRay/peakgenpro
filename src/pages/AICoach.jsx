import { useState, useRef, useEffect } from 'react'
import AppLayout from '../components/AppLayout'
import { supabase, getDailyMetrics, getTrainingSessions } from '../lib/supabase'
import { DEMO_METRICS, DEMO_SESSIONS, DEMO_TODAY, DEMO_USER } from '../lib/demoData'

export default function AICoach() {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [athleteData, setAthleteData] = useState(null)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    const loadData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const u = user || DEMO_USER
      const metricsRes = await getDailyMetrics(u.id, 14)
      const sessionsRes = await getTrainingSessions(u.id, 10)
      const metrics = metricsRes.data?.length ? metricsRes.data : DEMO_METRICS.slice(-14)
      const sessions = sessionsRes.data?.length ? sessionsRes.data : DEMO_SESSIONS
      const today = metrics[metrics.length - 1]

      setAthleteData({
        profile: u.user_metadata || DEMO_USER.user_metadata,
        today_metrics: today,
        recent_metrics_14d: metrics,
        recent_sessions: sessions.slice(0, 5),
        weekly_tss: sessions.slice(0, 7).reduce((s, a) => s + (a.tss || 0), 0),
        avg_hrv_7d: Math.round(
          metrics.slice(-7).reduce((s, m) => s + (m.hrv_ms || 0), 0) /
          Math.max(1, metrics.slice(-7).filter(m => m.hrv_ms).length)
        ),
        avg_readiness_7d: Math.round(
          metrics.slice(-7).reduce((s, m) => s + (m.readiness_score || 0), 0) /
          Math.max(1, metrics.slice(-7).filter(m => m.readiness_score).length)
        ),
      })
    }
    loadData()
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading || !athleteData) return
    const userMsg = { role: 'user', content: input.trim() }
    const newMessages = [...messages, userMsg]
    setMessages(newMessages)
    setInput('')
    setLoading(true)

    try {
      // Call the Vercel API route proxy (never exposes API key to browser)
      const { data: { session } } = await supabase.auth.getSession()
      const coachRes = await fetch('/api/ai-coach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({ messages: newMessages, athleteData }),
      })
      const data = await coachRes.json()

      if (!coachRes.ok) throw new Error(data?.error || 'Error al contactar el coach')

      const assistantText =
        data?.content?.find(b => b.type === 'text')?.text ||
        'No se pudo obtener respuesta.'

      setMessages(prev => [...prev, { role: 'assistant', content: assistantText }])
    } catch (err) {
      setMessages(prev => [
        ...prev,
        { role: 'assistant', content: `Error de conexión: ${err.message}` },
      ])
    }

    setLoading(false)
  }

  const SUGGESTIONS = [
    '¿Debo entrenar fuerte mañana según mis métricas de hoy?',
    '¿Cómo está mi tendencia de HRV esta semana?',
    'Dame un plan de entrenamiento para los próximos 3 días',
    '¿Cuánto tiempo necesito para recuperarme completamente?',
  ]

  return (
    <AppLayout>
      <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
        <div style={{ marginBottom: 20 }}>
          <p style={{ fontSize: 11, fontFamily: "'JetBrains Mono',monospace", color: '#00E5A0', letterSpacing: 2, marginBottom: 4 }}>// AI COACH</p>
          <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 32, letterSpacing: 1 }}>COACH IA PERSONALIZADO</h1>
          {athleteData && (
            <p style={{ fontSize: 13, color: '#7A8E88', marginTop: 4 }}>
              Datos cargados: HRV hoy {athleteData.today_metrics?.hrv_ms ?? '—'}ms · Readiness {athleteData.today_metrics?.readiness_score ?? '—'} · TSS semanal {athleteData.weekly_tss}
            </p>
          )}
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflow: 'auto', display: 'flex', flexDirection: 'column', gap: 16, paddingBottom: 16 }}>

          {messages.length === 0 && (
            <div>
              <div style={{ background: '#0D1316', border: '1px solid rgba(0,229,160,0.15)', borderRadius: 12, padding: 20, marginBottom: 20, maxWidth: 600 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>🧠</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#00E5A0', marginBottom: 6 }}>Coach IA</div>
                    <div style={{ fontSize: 14, color: '#c8dcd5', lineHeight: 1.7, fontWeight: 300 }}>
                      Hola, soy tu coach personal. Tengo acceso completo a tus datos de Garmin: HRV, sueño, actividades y métricas de recuperación. Pregúntame cualquier cosa sobre tu entrenamiento.
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginBottom: 8, fontSize: 12, color: '#7A8E88', fontFamily: "'JetBrains Mono',monospace" }}>// SUGERENCIAS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {SUGGESTIONS.map((s, i) => (
                  <button key={i} onClick={() => setInput(s)}
                    style={{ textAlign: 'left', background: '#0D1316', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, padding: '11px 14px', color: '#c8dcd5', fontSize: 13, cursor: 'pointer', transition: 'border-color .15s, background .15s' }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(0,229,160,0.25)'; e.currentTarget.style.background = '#111820' }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.background = '#0D1316' }}>
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
              <div style={{
                maxWidth: '75%', padding: '12px 16px', borderRadius: 12, fontSize: 14, lineHeight: 1.7,
                background: m.role === 'user' ? 'rgba(0,229,160,0.12)' : '#0D1316',
                border: m.role === 'user' ? '1px solid rgba(0,229,160,0.2)' : '1px solid rgba(255,255,255,0.06)',
                color: m.role === 'user' ? '#e0f5ee' : '#c8dcd5',
                fontWeight: 300, whiteSpace: 'pre-wrap'
              }}>
                {m.content}
              </div>
            </div>
          ))}

          {loading && (
            <div style={{ display: 'flex', gap: 6, padding: '12px 16px', background: '#0D1316', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, width: 'fit-content' }}>
              {[0, 1, 2].map(i => (
                <span key={i} style={{ width: 6, height: 6, borderRadius: '50%', background: '#00E5A0', display: 'inline-block', animation: `bounce .9s ${i * 0.2}s infinite` }}></span>
              ))}
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div style={{ display: 'flex', gap: 10, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder={athleteData ? 'Pregunta sobre tu entrenamiento...' : 'Cargando datos...'}
            disabled={!athleteData}
            style={{ flex: 1, background: '#0D1316', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '12px 16px', color: '#F0F4F2', fontSize: 14, outline: 'none', fontFamily: "'DM Sans',sans-serif" }} />
          <button onClick={sendMessage} disabled={loading || !input.trim() || !athleteData}
            style={{ background: '#00E5A0', color: '#060a08', fontWeight: 500, fontSize: 14, padding: '12px 20px', border: 'none', borderRadius: 8, cursor: 'pointer', opacity: (!input.trim() || loading) ? .5 : 1, transition: 'opacity .2s' }}>
            Enviar
          </button>
        </div>
      </div>

      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-6px)} }
      `}</style>
    </AppLayout>
  )
}
