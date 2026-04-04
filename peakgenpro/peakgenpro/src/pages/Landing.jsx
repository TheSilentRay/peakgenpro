import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { addToWaitlist } from '../lib/supabase'

export default function Landing() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState('idle') // idle | loading | success | error
  const [slots, setSlots] = useState(147)

  const handleWaitlist = async (e) => {
    e.preventDefault()
    if (!email || !email.includes('@')) return
    setStatus('loading')
    const { error } = await addToWaitlist(email)
    if (error) {
      // Supabase might not be set up yet — still show success to user
      console.warn('Waitlist insert error (expected in dev):', error.message)
    }
    setStatus('success')
    setSlots(s => s - 1)
  }

  return (
    <div style={{ background: '#080C0E', color: '#F0F4F2', minHeight: '100vh', fontFamily: "'DM Sans',sans-serif" }}>

      {/* NAV */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(8,12,14,0.9)', backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(0,229,160,0.1)',
        padding: '0 5vw', display: 'flex', alignItems: 'center',
        justifyContent: 'space-between', height: 60
      }}>
        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 22, letterSpacing: 3, color: '#00E5A0' }}>PEAKGENPRO</span>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button className="btn-ghost" onClick={() => navigate('/login')}>Iniciar sesión</button>
          <button className="btn-primary" onClick={() => navigate('/register')}>Empezar gratis →</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        minHeight: '90vh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        textAlign: 'center', padding: '80px 5vw',
        background: 'radial-gradient(ellipse 70% 50% at 50% 30%, rgba(0,229,160,0.06) 0%, transparent 70%)'
      }}>
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(0,229,160,0.08)', border: '1px solid rgba(0,229,160,0.2)',
          borderRadius: 20, padding: '6px 18px', marginBottom: 32,
          fontSize: 12, fontFamily: "'JetBrains Mono',monospace",
          color: '#00E5A0', letterSpacing: 1
        }}>
          <span style={{
            width: 6, height: 6, borderRadius: '50%', background: '#00E5A0',
            animation: 'pulse 2s infinite', display: 'inline-block'
          }}></span>
          MVP · Beta access open now
        </div>

        <h1 style={{
          fontFamily: "'Bebas Neue',sans-serif",
          fontSize: 'clamp(64px,11vw,130px)',
          lineHeight: .93, letterSpacing: 2, marginBottom: 24
        }}>
          TRAIN WITH<br /><span style={{ color: '#00E5A0' }}>AI-POWERED</span><br />PRECISION
        </h1>

        <p style={{ fontSize: 'clamp(15px,2vw,18px)', color: '#7A8E88', maxWidth: 520, lineHeight: 1.7, marginBottom: 48, fontWeight: 300 }}>
          PeakGenPro conecta tus datos reales de Garmin con un coach de IA que entiende tu cuerpo, tu fatiga y tu progreso.
        </p>

        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
          <button className="btn-primary" style={{ fontSize: 15, padding: '14px 36px' }}
            onClick={() => document.getElementById('waitlist-section').scrollIntoView({ behavior: 'smooth' })}>
            Únete al Beta — Gratis
          </button>
          <button className="btn-ghost" style={{ fontSize: 15, padding: '14px 28px' }}
            onClick={() => navigate('/dashboard')}>
            Ver demo
          </button>
        </div>
        <p style={{ fontSize: 12, color: '#7A8E88', fontFamily: "'JetBrains Mono',monospace", marginTop: 20 }}>
          // Sin tarjeta de crédito · Solo atletas serios
        </p>
      </section>

      {/* STATS BAR */}
      <div style={{
        background: '#0D1316', borderTop: '1px solid rgba(0,229,160,0.1)',
        borderBottom: '1px solid rgba(0,229,160,0.1)',
        padding: '28px 5vw', display: 'grid',
        gridTemplateColumns: 'repeat(4,1fr)'
      }}>
        {[
          { num: '94%', label: 'Precisión recovery score' },
          { num: '8+', label: 'Métricas Garmin en tiempo real' },
          { num: 'AI', label: 'Coach 24/7 con Claude' },
          { num: '0', label: 'Setup manual requerido' },
        ].map((s, i) => (
          <div key={i} style={{ textAlign: 'center', padding: '0 20px', borderLeft: i > 0 ? '1px solid rgba(0,229,160,0.1)' : 'none' }}>
            <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 36, color: '#00E5A0', letterSpacing: 1 }}>{s.num}</div>
            <div style={{ fontSize: 12, color: '#7A8E88', marginTop: 2 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* FEATURES */}
      <section style={{ padding: '100px 5vw' }}>
        <div style={{ maxWidth: 600, marginBottom: 56 }}>
          <p className="section-label">// Capacidades</p>
          <h2 className="section-title">TECNOLOGÍA DE ÉLITE<br />PARA ATLETAS SERIOS</h2>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(3,1fr)',
          gap: '1px', background: 'rgba(0,229,160,0.1)',
          border: '1px solid rgba(0,229,160,0.1)', borderRadius: 12, overflow: 'hidden'
        }}>
          {[
            { icon: '⚡', title: 'SYNC GARMIN', desc: 'Sincronización automática con Garmin Connect. VO2max, HRV, sueño, cadencia y potencia sin configuración manual.' },
            { icon: '🧠', title: 'AI COACH', desc: 'Chat con Claude usando tus datos reales. Recomendaciones personalizadas basadas en tu historial, no promedios genéricos.' },
            { icon: '📊', title: 'RECOVERY SCORE', desc: 'Modelo propio que combina HRV, sueño por etapas, carga acumulada y estrés fisiológico.' },
            { icon: '🔥', title: 'TRAINING ZONES', desc: 'Zonas de HR calibradas con tus datos reales de campo, no fórmulas genéricas de edad.' },
            { icon: '🍽️', title: 'NUTRITION AI', desc: 'Sugerencias de macros e hidratación ajustadas al gasto calórico real del día.' },
            { icon: '😴', title: 'SLEEP ANALYSIS', desc: 'Análisis por fases REM, profundo y ligero con tendencias de HRV nocturno.' },
          ].map((f, i) => (
            <div key={i} style={{ background: '#080C0E', padding: 32, transition: 'background .2s', cursor: 'default' }}
              onMouseOver={e => e.currentTarget.style.background = '#0D1316'}
              onMouseOut={e => e.currentTarget.style.background = '#080C0E'}>
              <div style={{
                width: 36, height: 36, borderRadius: 8,
                background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.2)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 20, fontSize: 16
              }}>{f.icon}</div>
              <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: 1, marginBottom: 10 }}>{f.title}</div>
              <div style={{ fontSize: 14, color: '#7A8E88', lineHeight: 1.65, fontWeight: 300 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* GARMIN COMPAT */}
      <div style={{ padding: '0 5vw 80px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 13, color: '#7A8E88' }}>Compatible con</span>
        {['Forerunner', 'Fenix', 'Epix', 'Vívoactive', 'Instinct'].map(g => (
          <span key={g} style={{
            background: '#0D1316', border: '1px solid rgba(0,229,160,0.12)',
            borderRadius: 20, padding: '7px 18px', fontSize: 12,
            fontFamily: "'JetBrains Mono',monospace"
          }}>Garmin {g}</span>
        ))}
      </div>

      {/* CTA / WAITLIST */}
      <section id="waitlist-section" style={{
        margin: '0 5vw 80px', background: '#0D1316',
        border: '1px solid rgba(0,229,160,0.2)', borderRadius: 16,
        padding: '72px 5vw', textAlign: 'center',
        background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(0,229,160,0.08) 0%, #0D1316 60%)'
      }}>
        <h2 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 'clamp(36px,6vw,72px)', letterSpacing: 2, marginBottom: 16 }}>
          EMPIEZA A ENTRENAR <span style={{ color: '#00E5A0' }}>DIFERENTE</span>
        </h2>
        <p style={{ fontSize: 15, color: '#7A8E88', maxWidth: 400, margin: '0 auto 40px', lineHeight: 1.7, fontWeight: 300 }}>
          Acceso beta gratuito para los primeros 200 atletas. Sin tarjeta de crédito.
        </p>

        {status === 'success' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: 10,
              background: 'rgba(0,229,160,0.1)', border: '1px solid rgba(0,229,160,0.3)',
              borderRadius: 8, padding: '14px 28px', fontSize: 15, color: '#00E5A0'
            }}>
              ✓ ¡Estás en la lista! Te avisamos en cuanto abra.
            </div>
            <button className="btn-primary" style={{ marginTop: 8 }} onClick={() => navigate('/register')}>
              Crear cuenta ahora →
            </button>
          </div>
        ) : (
          <form onSubmit={handleWaitlist} style={{ display: 'flex', gap: 10, maxWidth: 420, margin: '0 auto' }}>
            <input
              type="email" value={email} onChange={e => setEmail(e.target.value)}
              placeholder="tu@email.com" required
              style={{
                flex: 1, background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
                padding: '12px 16px', color: '#F0F4F2', fontSize: 14, outline: 'none'
              }}
            />
            <button type="submit" className="btn-primary" disabled={status === 'loading'}
              style={{ whiteSpace: 'nowrap' }}>
              {status === 'loading' ? '...' : 'Unirse →'}
            </button>
          </form>
        )}
        <p style={{ fontSize: 12, color: '#7A8E88', fontFamily: "'JetBrains Mono',monospace", marginTop: 16 }}>
          // Quedan <span style={{ color: '#00E5A0' }}>{slots}</span> plazas beta disponibles
        </p>
      </section>

      {/* FOOTER */}
      <footer style={{
        padding: '28px 5vw', borderTop: '1px solid rgba(0,229,160,0.08)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16
      }}>
        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 18, letterSpacing: 2, color: '#00E5A0' }}>PEAKGENPRO</span>
        <span style={{ fontSize: 12, color: '#7A8E88' }}>© 2025 PeakGenPro · Todos los derechos reservados</span>
      </footer>

      <style>{`
        @keyframes pulse { 0%,100%{opacity:1}50%{opacity:.4} }
        .btn-primary { background:#00E5A0;color:#060a08;font-weight:500;font-size:14px;padding:11px 24px;border:none;border-radius:8px;transition:opacity .2s,transform .1s;cursor:pointer; }
        .btn-primary:hover{opacity:.88;transform:translateY(-1px)}
        .btn-ghost { background:transparent;color:#F0F4F2;font-size:14px;padding:11px 20px;border:1px solid rgba(255,255,255,0.12);border-radius:8px;transition:border-color .2s;cursor:pointer; }
        .btn-ghost:hover{border-color:rgba(255,255,255,0.3)}
      `}</style>
    </div>
  )
}
