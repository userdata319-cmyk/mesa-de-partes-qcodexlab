import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { Button, Input, Select, Card, RadioGroup } from '../../components/ui'
import { toast } from '../../components/ui'

const DOC_LIMITS = { DNI: 8, RUC: 11, CE: 12, PASAPORTE: 12 }

export default function RegistroCliente() {
  const { registrarCliente } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [errors,  setErrors]  = useState({})
  const [form, setForm] = useState({
    tipo_persona: 'natural',
    tipo_doc:     'DNI',
    documento:    '',
    nombres:      '',
    celular:      '',
    direccion:    '',
    correo:       '',
    password:     '',
    confirmar:    '',
  })

  function set(k, v) { setForm(f => ({...f, [k]: v})); setErrors(e => ({...e, [k]: null})) }

  function validate() {
    const e = {}
    const maxLen = DOC_LIMITS[form.tipo_doc] || 12
    if (!form.documento)                          e.documento = 'Ingrese su número de documento'
    else if (form.documento.length !== maxLen)    e.documento = `Debe tener exactamente ${maxLen} dígitos`
    if (!form.nombres.trim())                     e.nombres   = 'Este campo es obligatorio'
    if (!form.celular || form.celular.length !== 9) e.celular = 'El celular debe tener 9 dígitos'
    if (!form.direccion.trim())                   e.direccion = 'Ingrese su dirección'
    if (form.correo && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.correo)) e.correo = 'Correo inválido'
    if (!form.password || form.password.length < 6) e.password = 'Mínimo 6 caracteres'
    if (form.password !== form.confirmar)         e.confirmar = 'Las contraseñas no coinciden'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      await registrarCliente(form)
      toast('Cuenta creada correctamente', 'success')
      navigate('/dashboard')
    } catch (err) {
      toast(err.message, 'error')
    } finally {
      setLoading(false)
    }
  }

  const tipoDocOptions = form.tipo_persona === 'natural'
    ? [{ value: 'DNI', label: 'DNI' }, { value: 'CE', label: 'Carnet de Extranjería' }, { value: 'PASAPORTE', label: 'Pasaporte' }]
    : [{ value: 'RUC', label: 'RUC' }]

  // Si cambia tipo persona, resetear tipo_doc
  function setTipoPersona(v) {
    setForm(f => ({ ...f, tipo_persona: v, tipo_doc: v === 'natural' ? 'DNI' : 'RUC', documento: '' }))
    setErrors(e => ({ ...e, documento: null }))
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '1.5rem 1rem' }}>

      <div style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ width: 48, height: 48, background: 'var(--red)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 10px' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        </div>
        <h1 style={{ fontSize: 18, fontWeight: 700 }}>Mesa de Partes Virtual</h1>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 3 }}>Crear nueva cuenta</p>
      </div>

      <Card style={{ width: '100%', maxWidth: 520, padding: '2rem' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>Datos de registro</h2>

        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Tipo persona */}
          <div>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 8 }}>Tipo de persona</p>
            <RadioGroup
              name="tipo_persona_reg"
              value={form.tipo_persona}
              onChange={setTipoPersona}
              options={[{ value: 'natural', label: 'Persona Natural' }, { value: 'juridica', label: 'Persona Jurídica' }]}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Tipo doc */}
            <Select
              label="Tipo de documento"
              required
              value={form.tipo_doc}
              onChange={e => { set('tipo_doc', e.target.value); set('documento', '') }}
              error={errors.tipo_doc}
            >
              {tipoDocOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </Select>

            {/* Número */}
            <Input
              label="Número de documento"
              required
              placeholder={form.tipo_doc === 'RUC' ? '20123456789' : '12345678'}
              value={form.documento}
              maxLength={DOC_LIMITS[form.tipo_doc] || 12}
              counter
              onChange={e => set('documento', e.target.value.replace(/\D/g, ''))}
              error={errors.documento}
            />
          </div>

          {/* Nombres / Razón social */}
          <Input
            label={form.tipo_persona === 'natural' ? 'Nombres y apellidos' : 'Razón social'}
            required
            placeholder={form.tipo_persona === 'natural' ? 'Juan Pérez García' : 'Empresa S.A.C.'}
            value={form.nombres}
            onChange={e => set('nombres', e.target.value)}
            error={errors.nombres}
          />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {/* Celular */}
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
            {/* Correo */}
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="ejemplo@correo.com"
              value={form.correo}
              onChange={e => set('correo', e.target.value)}
              error={errors.correo}
            />
          </div>

          {/* Dirección */}
          <Input
            label="Dirección"
            required
            placeholder="Av. Ejemplo 123, Distrito, Provincia"
            value={form.direccion}
            onChange={e => set('direccion', e.target.value)}
            error={errors.direccion}
          />

          {/* Contraseñas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Input
              label="Contraseña"
              required
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={e => set('password', e.target.value)}
              error={errors.password}
            />
            <Input
              label="Confirmar contraseña"
              required
              type="password"
              placeholder="Repita su contraseña"
              value={form.confirmar}
              onChange={e => set('confirmar', e.target.value)}
              error={errors.confirmar}
            />
          </div>

          <Button type="submit" loading={loading} style={{ marginTop: 6, width: '100%', justifyContent: 'center', padding: '11px' }}>
            Crear cuenta
          </Button>
        </form>

        <div style={{ marginTop: 18, paddingTop: 14, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>
            ¿Ya tienes cuenta?{' '}
            <Link to="/login" style={{ color: 'var(--red)', fontWeight: 600, textDecoration: 'none' }}>Iniciar sesión</Link>
          </p>
        </div>
      </Card>
    </div>
  )
}
