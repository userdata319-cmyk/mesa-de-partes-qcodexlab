import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Input, Button, Card } from '../../components/ui'
import { toast } from '../../components/ui'

export default function OlvidePassword() {
  const { solicitarResetPassword } = useAuth()
  const [correo,  setCorreo]  = useState('')
  const [loading, setLoading] = useState(false)
  const [enviado, setEnviado] = useState(false)
  const [link,    setLink]    = useState('')  // solo en desarrollo
  const [error,   setError]   = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    if (!correo || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)) {
      setError('Ingrese un correo válido')
      return
    }
    setLoading(true)
    setError('')
    try {
      const result = await solicitarResetPassword(correo)
      setLink(result.link)
      setEnviado(true)
      toast('Enlace de recuperación generado', 'success')
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>

      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ width: 48, height: 48, background: 'var(--red)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
        </div>
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>Recuperar contraseña</h1>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>Mesa de Partes Virtual</p>
      </div>

      <Card style={{ width: '100%', maxWidth: 400, padding: '1.75rem' }}>
        {!enviado ? (
          <>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20, lineHeight: 1.6 }}>
              Ingrese el correo electrónico asociado a su cuenta. Le enviaremos un enlace para restablecer su contraseña.
            </p>
            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Input
                label="Correo electrónico"
                type="email"
                required
                placeholder="ejemplo@correo.com"
                value={correo}
                onChange={e => { setCorreo(e.target.value); setError('') }}
                error={error}
              />
              <Button type="submit" loading={loading} style={{ width: '100%', justifyContent: 'center', padding: '11px' }}>
                Enviar enlace de recuperación
              </Button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, background: 'var(--green-light)', border: '2px solid #bbf7d0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>¡Enlace generado!</h3>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 16, lineHeight: 1.6 }}>
              En producción, el enlace se enviaría al correo <strong>{correo}</strong>.
            </p>

            {/* Mostrar link en desarrollo */}
            <div style={{ background: '#f4f4f5', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '12px', marginBottom: 16, textAlign: 'left' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>
                Enlace de recuperación (solo visible en desarrollo)
              </p>
              <a href={link} style={{ fontSize: 11, color: 'var(--blue)', wordBreak: 'break-all', fontFamily: 'var(--mono)' }}>{link}</a>
            </div>

            <Link to={link} style={{ textDecoration: 'none' }}>
              <Button style={{ width: '100%', justifyContent: 'center', marginBottom: 10 }}>
                Ir a restablecer contraseña →
              </Button>
            </Link>
          </div>
        )}

        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          <Link to="/login" style={{ fontSize: 13, color: 'var(--text-3)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Volver al inicio de sesión
          </Link>
        </div>
      </Card>
    </div>
  )
}
