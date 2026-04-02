import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Button, Input, Card } from '../../components/ui'
import { toast } from '../../components/ui'

export default function LoginAdmin() {
  const { loginAdmin } = useAuth()
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [errors,   setErrors]   = useState({})

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!username.trim()) errs.username = 'Ingrese el usuario'
    if (!password)        errs.password = 'Ingrese la contraseña'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      await loginAdmin(username.trim(), password)
      navigate('/admin')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0f0f10', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>

      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ width: 52, height: 52, background: 'var(--red)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h1 style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>Panel de Administración</h1>
        <p style={{ fontSize: 12, color: '#666', marginTop: 4 }}>Mesa de Partes Virtual</p>
      </div>

      <div style={{ width: '100%', maxWidth: 380, background: '#1a1a1c', border: '1px solid #2a2a2c', borderRadius: 'var(--radius-lg)', padding: '2rem' }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 20 }}>Acceso restringido</h2>

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '.04em' }}>Usuario</label>
            <input
              placeholder="username"
              value={username}
              onChange={e => { setUsername(e.target.value); setErrors(x => ({...x, username: null})) }}
              style={{ padding: '10px 12px', background: '#111', border: `1px solid ${errors.username ? 'var(--red)' : '#333'}`, borderRadius: 'var(--radius)', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'var(--mono)' }}
            />
            {errors.username && <span style={{ fontSize: 12, color: 'var(--red)' }}>{errors.username}</span>}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            <label style={{ fontSize: 11, fontWeight: 600, color: '#888', textTransform: 'uppercase', letterSpacing: '.04em' }}>Contraseña</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => { setPassword(e.target.value); setErrors(x => ({...x, password: null})) }}
              style={{ padding: '10px 12px', background: '#111', border: `1px solid ${errors.password ? 'var(--red)' : '#333'}`, borderRadius: 'var(--radius)', color: '#fff', fontSize: 14, outline: 'none', fontFamily: 'var(--font)' }}
            />
            {errors.password && <span style={{ fontSize: 12, color: 'var(--red)' }}>{errors.password}</span>}
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{ marginTop: 6, padding: '11px', background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 600, cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? .7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {loading && <span style={{ width: 14, height: 14, border: '2px solid rgba(255,255,255,.3)', borderTop: '2px solid #fff', borderRadius: '50%', display: 'inline-block', animation: 'spin .6s linear infinite' }} />}
            Ingresar al sistema
          </button>
        </form>

        <p style={{ fontSize: 11, color: '#444', textAlign: 'center', marginTop: 20 }}>
          Acceso solo para personal autorizado
        </p>
      </div>
    </div>
  )
}
