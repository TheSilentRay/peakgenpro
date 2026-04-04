import { NavLink, useNavigate } from 'react-router-dom'
import { signOut } from '../lib/supabase'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: '⚡' },
  { to: '/training', label: 'Training', icon: '🏃' },
  { to: '/recovery', label: 'Recovery', icon: '😴' },
  { to: '/nutrition', label: 'Nutrition', icon: '🍽️' },
  { to: '/coach', label: 'AI Coach', icon: '🧠' },
  { to: '/profile', label: 'Profile', icon: '👤' },
]

export default function Sidebar() {
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <aside style={{
      width: 220, minHeight: '100vh', background: '#0A0F12',
      borderRight: '1px solid rgba(0,229,160,0.08)',
      display: 'flex', flexDirection: 'column', padding: '0 0 24px'
    }}>
      <div style={{ padding: '24px 20px 20px', borderBottom: '1px solid rgba(0,229,160,0.08)' }}>
        <span style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 20, letterSpacing: 2, color: '#00E5A0' }}>
          PEAKGENPRO
        </span>
      </div>

      <nav style={{ flex: 1, padding: '16px 12px' }}>
        {links.map(({ to, label, icon }) => (
          <NavLink key={to} to={to} style={({ isActive }) => ({
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 12px', borderRadius: 8, marginBottom: 2,
            fontSize: 14, fontWeight: 400, textDecoration: 'none',
            background: isActive ? 'rgba(0,229,160,0.1)' : 'transparent',
            color: isActive ? '#00E5A0' : '#7A8E88',
            borderLeft: isActive ? '2px solid #00E5A0' : '2px solid transparent',
            transition: 'all .15s'
          })}>
            <span style={{ fontSize: 16 }}>{icon}</span>
            {label}
          </NavLink>
        ))}
      </nav>

      <div style={{ padding: '0 12px' }}>
        <div style={{
          background: 'rgba(0,229,160,0.06)', border: '1px solid rgba(0,229,160,0.15)',
          borderRadius: 8, padding: '12px', marginBottom: 12
        }}>
          <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: '#00E5A0', letterSpacing: 1, marginBottom: 4 }}>GARMIN SYNC</div>
          <div style={{ fontSize: 12, color: '#7A8E88' }}>Última sync: hace 2h</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#00E5A0', display: 'inline-block' }}></span>
            <span style={{ fontSize: 12, color: '#00E5A0' }}>Conectado</span>
          </div>
        </div>
        <button onClick={handleSignOut} style={{
          width: '100%', padding: '9px', background: 'transparent',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
          color: '#7A8E88', fontSize: 13, cursor: 'pointer',
          transition: 'border-color .2s, color .2s'
        }}
          onMouseOver={e => { e.target.style.borderColor = 'rgba(255,80,80,0.3)'; e.target.style.color = '#ff6b6b' }}
          onMouseOut={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.color = '#7A8E88' }}
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
