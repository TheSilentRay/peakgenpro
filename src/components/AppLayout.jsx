import Sidebar from './Sidebar'

export default function AppLayout({ children }) {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#080C0E' }}>
      <Sidebar />
      <main style={{ flex: 1, overflow: 'auto', padding: '32px 40px' }}>
        {children}
      </main>
    </div>
  )
}
