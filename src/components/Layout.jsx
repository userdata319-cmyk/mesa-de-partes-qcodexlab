import { Link, useLocation } from 'react-router-dom'

export function Layout({ children }) {
  const loc = useLocation()
  const isAdmin = loc.pathname === '/admin'

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        background: 'var(--red)',
        color: '#fff',
        height: 58,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        position: 'sticky', top: 0, zIndex: 50,
        boxShadow: '0 2px 12px rgba(196,30,58,.25)',
      }}>
        <Link to="/" style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
          <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '.01em' }}>Mesa de Partes Virtual</span>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 11, fontFamily: 'var(--mono)', background: 'rgba(255,255,255,.18)', padding: '3px 10px', borderRadius: 4, letterSpacing: '.05em' }}>
            SISTEMA ELECTRÓNICO
          </span>
          <Link to={isAdmin ? '/' : '/admin'} style={{
            textDecoration: 'none',
            color: 'rgba(255,255,255,.85)',
            fontSize: 12,
            fontWeight: 500,
            padding: '5px 12px',
            borderRadius: 6,
            border: '1px solid rgba(255,255,255,.3)',
            transition: 'all .15s',
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            {isAdmin ? (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                Inicio
              </>
            ) : (
              <>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
                Admin
              </>
            )}
          </Link>
        </div>
      </header>

      <main style={{ flex: 1 }}>
        {children}
      </main>

      <footer style={{ padding: '16px', textAlign: 'center', fontSize: 11, color: 'var(--text-3)', borderTop: '1px solid var(--border)' }}>
        Sistema de Mesa de Partes Virtual · {new Date().getFullYear()}
      </footer>
    </div>
  )
}
