import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Input, Button, Card } from '../../components/ui'
import { toast } from '../../components/ui'

export default function ResetPassword() {
  const { resetPassword } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token')

  const [form,    setForm]    = useState({ nueva: '', confirmar: '' })
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)
  const [listo,   setListo]   = useState(false)

  useEffect(() => {
    if (!token) navigate('/login')
  }, [token])

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: null })) }

  function validate() {
    const e = {}
    if (!form.nueva || form.nueva.length < 6) e.nueva     = 'Mínimo 6 caracteres'
    if (form.nueva !== form.confirmar)         e.confirmar = 'Las contraseñas no coinciden'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await resetPassword(token, form.nueva)
      setListo(true)
      toast('Contraseña restablecida correctamente', 'success')
    } catch (err) {
      toast(err.message, 'error')
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
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>Nueva contraseña</h1>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>Mesa de Partes Virtual</p>
      </div>

      <Card style={{ width: '100%', maxWidth: 400, padding: '1.75rem' }}>
        {!listo ? (
          <>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20 }}>Ingrese su nueva contraseña.</p>
            <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Input
                label="Nueva contraseña"
                required
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={form.nueva}
                onChange={e => set('nueva', e.target.value)}
                error={errors.nueva}
              />
              <Input
                label="Confirmar contraseña"
                required
                type="password"
                placeholder="Repita la contraseña"
                value={form.confirmar}
                onChange={e => set('confirmar', e.target.value)}
                error={errors.confirmar}
              />
              <Button type="submit" loading={loading} style={{ width: '100%', justifyContent: 'center', padding: '11px', marginTop: 4 }}>
                Restablecer contraseña
              </Button>
            </form>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 56, height: 56, background: 'var(--green-light)', border: '2px solid #bbf7d0', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 8 }}>¡Contraseña actualizada!</h3>
            <p style={{ fontSize: 13, color: 'var(--text-2)', marginBottom: 20 }}>Ya puede iniciar sesión con su nueva contraseña.</p>
            <Button onClick={() => navigate('/login')} style={{ width: '100%', justifyContent: 'center' }}>
              Ir al inicio de sesión
            </Button>
          </div>
        )}

        {!listo && (
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
            <Link to="/login" style={{ fontSize: 13, color: 'var(--text-3)', textDecoration: 'none' }}>
              ← Volver al inicio de sesión
            </Link>
          </div>
        )}
      </Card>
    </div>
  )
}
