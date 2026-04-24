import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Input, Button, Card } from '../../components/ui'
import { toast } from '../../components/ui'

export default function EditarPerfil() {
  const { cliente, actualizarCliente } = useAuth()
  const navigate = useNavigate()

  const [form, setForm] = useState({
    nombres:   cliente?.nombres   || '',
    celular:   cliente?.celular   || '',
    direccion: cliente?.direccion || '',
  })
  const [pwForm, setPwForm] = useState({ actual: '', nueva: '', confirmar: '' })
  const [errors,   setErrors]   = useState({})
  const [pwErrors, setPwErrors] = useState({})
  const [saving,   setSaving]   = useState(false)
  const [savingPw, setSavingPw] = useState(false)

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: null })) }
  function setPw(k, v) { setPwForm(f => ({ ...f, [k]: v })); setPwErrors(e => ({ ...e, [k]: null })) }

  function validatePerfil() {
    const e = {}
    if (!form.nombres.trim())                         e.nombres   = 'El nombre es obligatorio'
    if (!form.celular || form.celular.length !== 9)   e.celular   = 'El celular debe tener 9 dígitos'
    if (!form.direccion.trim())                       e.direccion = 'La dirección es obligatoria'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function validatePassword() {
    const e = {}
    if (!pwForm.actual)                               e.actual    = 'Ingrese su contraseña actual'
    if (!pwForm.nueva || pwForm.nueva.length < 6)    e.nueva     = 'Mínimo 6 caracteres'
    if (pwForm.nueva !== pwForm.confirmar)            e.confirmar = 'Las contraseñas no coinciden'
    setPwErrors(e)
    return Object.keys(e).length === 0
  }

  async function guardarPerfil(e) {
    e.preventDefault()
    if (!validatePerfil()) return
    setSaving(true)
    try {
      await actualizarCliente({
        nombres:   form.nombres,
        celular:   form.celular,
        direccion: form.direccion,
      })
      toast('Perfil actualizado correctamente', 'success')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  async function cambiarPassword(e) {
    e.preventDefault()
    if (!validatePassword()) return
    // Verificar contraseña actual
    if (btoa(pwForm.actual) !== cliente.password_hash) {
      setPwErrors({ actual: 'Contraseña actual incorrecta' })
      return
    }
    setSavingPw(true)
    try {
      await actualizarCliente({ password_hash: btoa(pwForm.nueva) })
      toast('Contraseña actualizada correctamente', 'success')
      setPwForm({ actual: '', nueva: '', confirmar: '' })
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setSavingPw(false)
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <header style={{ background: 'var(--red)', color: '#fff', height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem' }}>
        <span style={{ fontSize: 14, fontWeight: 700 }}>Editar Perfil</span>
        <Link to="/dashboard" style={{ fontSize: 12, color: 'rgba(255,255,255,.8)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Volver
        </Link>
      </header>

      <div style={{ maxWidth: 640, margin: '2rem auto', padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Datos no editables */}
        <Card style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Información de cuenta</h2>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>Estos datos no pueden modificarse</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {[
              { label: 'Tipo de documento', value: `${cliente?.tipo_doc}` },
              { label: 'Número de documento', value: cliente?.documento },
              { label: 'Correo electrónico', value: cliente?.correo || '—' },
              { label: 'Tipo de persona', value: cliente?.tipo_persona === 'juridica' ? 'Persona Jurídica' : 'Persona Natural' },
            ].map(f => (
              <div key={f.label}>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 5 }}>{f.label}</p>
                <div style={{ padding: '9px 12px', background: '#f4f4f5', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--text-2)', fontFamily: f.label.includes('Número') ? 'var(--mono)' : 'inherit' }}>
                  {f.value}
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Datos editables */}
        <Card style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Datos personales</h2>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>Puede modificar estos campos</p>
          <form onSubmit={guardarPerfil} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input
              label={cliente?.tipo_persona === 'juridica' ? 'Razón social' : 'Nombres y apellidos'}
              required
              value={form.nombres}
              onChange={e => set('nombres', e.target.value)}
              error={errors.nombres}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input
                label="Celular"
                required
                type="tel"
                placeholder="999888777"
                value={form.celular}
                maxLength={9}
                onChange={e => set('celular', e.target.value.replace(/\D/g, ''))}
                error={errors.celular}
              />
            </div>
            <Input
              label="Dirección"
              required
              placeholder="Av. Ejemplo 123, Distrito"
              value={form.direccion}
              onChange={e => set('direccion', e.target.value)}
              error={errors.direccion}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
              <Button type="submit" loading={saving}>Guardar cambios</Button>
            </div>
          </form>
        </Card>

        {/* Cambiar contraseña */}
        <Card style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>Cambiar contraseña</h2>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>Ingrese su contraseña actual para confirmar</p>
          <form onSubmit={cambiarPassword} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input
              label="Contraseña actual"
              required
              type="password"
              placeholder="••••••••"
              value={pwForm.actual}
              onChange={e => setPw('actual', e.target.value)}
              error={pwErrors.actual}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Input
                label="Nueva contraseña"
                required
                type="password"
                placeholder="Mínimo 6 caracteres"
                value={pwForm.nueva}
                onChange={e => setPw('nueva', e.target.value)}
                error={pwErrors.nueva}
              />
              <Input
                label="Confirmar contraseña"
                required
                type="password"
                placeholder="Repita la nueva"
                value={pwForm.confirmar}
                onChange={e => setPw('confirmar', e.target.value)}
                error={pwErrors.confirmar}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
              <Button type="submit" loading={savingPw} variant="ghost">Cambiar contraseña</Button>
            </div>
          </form>
        </Card>

      </div>
    </div>
  )
}
