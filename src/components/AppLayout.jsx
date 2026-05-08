import { useState } from 'react'
import Sidebar from './Sidebar'

export default function AppLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080C0E' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      {sidebarOpen && <div className="sidebar-backdrop" onClick={() => setSidebarOpen(false)} />}
      <main className="app-main">
        <button className="hamburger-btn" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú">☰</button>
        {children}
      </main>
    </div>
  )
}
