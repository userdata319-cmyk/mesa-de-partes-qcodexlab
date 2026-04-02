import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Button, Input, Card } from '../../components/ui'
import { toast } from '../../components/ui'

export default function LoginCliente() {
  const { loginCliente } = useAuth()
  const navigate = useNavigate()
  const [documento, setDocumento] = useState('')
  const [password,  setPassword]  = useState('')
  const [loading,   setLoading]   = useState(false)
  const [errors,    setErrors]    = useState({})

  async function handleSubmit(e) {
    e.preventDefault()
    const errs = {}
    if (!documento.trim()) errs.documento = 'Ingrese su DNI o RUC'
    if (!password)         errs.password  = 'Ingrese su contraseña'
    if (Object.keys(errs).length) { setErrors(errs); return }

    setLoading(true)
    try {
      await loginCliente(documento.trim(), password)
      navigate('/dashboard')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>

      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: 28 }}>
        <div style={{ width: 52, height: 52, background: 'var(--red)', borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
          </svg>
        </div>
        <h1 style={{ fontSize: 24, fontWeight: 700 }}>Mesa de Partes Virtual</h1>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginTop: 4 }}>Cámara de comercio Apurímac</h2>
        <a href='http://www.camara-apurimac.com.pe' target='_blank' rel='noopener noreferrer' style={{ fontSize: 13, color: 'var(--blue)', marginTop: 4 }}>www.camara-apurimac.com.pe</a>
        <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 4 }}>Acceso para ciudadanos</p>
      </div>

      <Card style={{ width: '100%', maxWidth: 400, padding: '2rem' }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, marginBottom: 20 }}>Iniciar sesión</h2>

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="DNI o RUC"
            placeholder="Ingrese su número de documento"
            value={documento}
            onChange={e => { setDocumento(e.target.value.replace(/\D/g,'')); setErrors(x => ({...x, documento: null})) }}
            maxLength={11}
            error={errors.documento}
          />
          <Input
            label="Contraseña"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => { setPassword(e.target.value); setErrors(x => ({...x, password: null})) }}
            error={errors.password}
          />

          <Button type="submit" loading={loading} style={{ marginTop: 4, width: '100%', justifyContent: 'center', padding: '11px' }}>
            Ingresar
          </Button>
        </form>

        <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
            ¿No tienes cuenta?{' '}
            <Link to="/registro" style={{ color: 'var(--red)', fontWeight: 600, textDecoration: 'none' }}>
              Regístrate aquí
            </Link>
          </p>
        </div>
      </Card>

      <div style={{ marginTop: 16 }}>
        <Link to="/admin/login" style={{ fontSize: 12, color: 'var(--text-3)', textDecoration: 'none' }}>
          Acceso administradores →
        </Link>
      </div>
    </div>
  )
}
