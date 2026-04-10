import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { supabase, signOut } from '../lib/supabase'

const links = [
  { to: '/dashboard', label: 'Dashboard', icon: '⚡' },
  { to: '/training', label: 'Training', icon: '🏃' },
  { to: '/recovery', label: 'Recovery', icon: '😴' },
  { to: '/nutrition', label: 'Nutrition', icon: '🍽️' },
  { to: '/coach', label: 'AI Coach', icon: '🧠' },
  { to: '/profile', label: 'Profile', icon: '👤' },
]

function timeAgo(dateStr) {
  if (!dateStr) return null
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'justo ahora'
  if (diff < 3600) return `hace ${Math.floor(diff / 60)}min`
  if (diff < 86400) return `hace ${Math.floor(diff / 3600)}h`
  return `hace ${Math.floor(diff / 86400)}d`
}

export default function Sidebar() {
  const navigate = useNavigate()
  const [garmin, setGarmin] = useState(null) // null = loading, false = not connected

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('garmin_credentials')
        .select('garmin_username, last_sync_at, sync_status')
        .eq('user_id', user.id)
        .single()
        .then(({ data }) => setGarmin(data || false))
    })
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const isConnected = garmin?.sync_status === 'success'
  const statusColor = isConnected ? '#00E5A0' : garmin?.sync_status === 'error' ? '#ff6b6b' : '#FFB347'
  const statusLabel = isConnected ? 'Conectado' : garmin?.sync_status === 'error' ? 'Error de sync' : garmin === false ? 'Sin conectar' : '...'

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
        {/* Garmin status — clicking navigates to Profile to manage the connection */}
        <div
          onClick={() => navigate('/profile')}
          style={{
            background: 'rgba(0,229,160,0.06)', border: `1px solid ${statusColor}30`,
            borderRadius: 8, padding: '12px', marginBottom: 12, cursor: 'pointer',
          }}
        >
          <div style={{ fontSize: 10, fontFamily: "'JetBrains Mono',monospace", color: '#00E5A0', letterSpacing: 1, marginBottom: 6 }}>
            GARMIN SYNC
          </div>

          {garmin === null ? (
            <div style={{ fontSize: 12, color: '#7A8E88' }}>Cargando...</div>
          ) : garmin === false ? (
            <div style={{ fontSize: 12, color: '#FFB347' }}>No conectado · <u>Conectar →</u></div>
          ) : (
            <>
              <div style={{ fontSize: 12, color: '#c8dcd5', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                {garmin.garmin_username}
              </div>
              {garmin.last_sync_at && (
                <div style={{ fontSize: 11, color: '#7A8E88', marginBottom: 6 }}>
                  Sync: {timeAgo(garmin.last_sync_at)}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: statusColor, display: 'inline-block', flexShrink: 0 }}></span>
                <span style={{ fontSize: 11, color: statusColor }}>{statusLabel}</span>
                {isConnected && (
                  <span style={{ fontSize: 10, color: '#00E5A0', marginLeft: 'auto', opacity: .6 }}>datos reales ✓</span>
                )}
              </div>
            </>
          )}
        </div>

        <button onClick={handleSignOut} style={{
          width: '100%', padding: '9px', background: 'transparent',
          border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8,
          color: '#7A8E88', fontSize: 13, cursor: 'pointer',
          transition: 'border-color .2s, color .2s'
        }}
          onMouseOver={e => { e.currentTarget.style.borderColor = 'rgba(255,80,80,0.3)'; e.currentTarget.style.color = '#ff6b6b' }}
          onMouseOut={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#7A8E88' }}
        >
          Cerrar sesión
        </button>
      </div>
    </aside>
  )
}
