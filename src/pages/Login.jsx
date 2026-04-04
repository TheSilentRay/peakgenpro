import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { signIn } from '../lib/supabase'

export default function Login() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error } = await signIn(form.email, form.password)
    setLoading(false)
    if (error) {
      setError(error.message)
    } else {
      navigate('/dashboard')
    }
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#080C0E', display: 'flex',
      alignItems: 'center', justifyContent: 'center', padding: '40px 20px',
      fontFamily: "'DM Sans',sans-serif"
    }}>
      <div style={{ width: '100%', maxWidth: 400 }}>
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <Link to="/" style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 24, letterSpacing: 3, color: '#00E5A0' }}>
            PEAKGENPRO
          </Link>
          <p style={{ color: '#7A8E88', marginTop: 8, fontSize: 14 }}>Bienvenido de vuelta, atleta</p>
        </div>

        <form onSubmit={handleSubmit} style={{
          background: '#0D1316', border: '1px solid rgba(0,229,160,0.12)',
          borderRadius: 12, padding: 32, display: 'flex', flexDirection: 'column', gap: 16
        }}>
          {error && (
            <div style={{ background: 'rgba(255,80,80,0.08)', border: '1px solid rgba(255,80,80,0.2)', borderRadius: 8, padding: '10px 14px', fontSize: 13, color: '#ff6b6b' }}>
              {error}
            </div>
          )}

          <div>
            <label style={{ fontSize: 12, color: '#7A8E88', fontFamily: "'JetBrains Mono',monospace", letterSpacing: .5, display: 'block', marginBottom: 6 }}>EMAIL</label>
            <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })}
              placeholder="tu@email.com"
              style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '11px 14px', color: '#F0F4F2', fontSize: 14, outline: 'none' }} />
          </div>

          <div>
            <label style={{ fontSize: 12, color: '#7A8E88', fontFamily: "'JetBrains Mono',monospace", letterSpacing: .5, display: 'block', marginBottom: 6 }}>CONTRASEÑA</label>
            <input type="password" required value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
              placeholder="••••••••"
              style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '11px 14px', color: '#F0F4F2', fontSize: 14, outline: 'none' }} />
          </div>

          <button type="submit" disabled={loading}
            style={{ background: '#00E5A0', color: '#060a08', fontWeight: 500, fontSize: 15, padding: '13px', border: 'none', borderRadius: 8, cursor: 'pointer', marginTop: 8, opacity: loading ? .7 : 1 }}>
            {loading ? 'Iniciando...' : 'Iniciar sesión →'}
          </button>

          <div style={{ textAlign: 'center', fontSize: 13, color: '#7A8E88' }}>
            ¿No tienes cuenta? <Link to="/register" style={{ color: '#00E5A0' }}>Regístrate gratis</Link>
          </div>

          {/* Demo access */}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 16, textAlign: 'center' }}>
            <button type="button" onClick={() => navigate('/dashboard')}
              style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: '9px 20px', color: '#7A8E88', fontSize: 13, cursor: 'pointer' }}>
              Ver demo sin login →
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
