import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Stepper } from '../components/Stepper'
import { PersonaForm } from '../components/PersonaForm'
import { AnexosForm } from '../components/AnexosForm'
import { SuccessScreen } from '../components/SuccessScreen'
import { Card } from '../components/ui'
import { toast } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { demandanteSchema, demandadoSchema } from '../lib/schemas'
import { generarExpediente, insertarSolicitud, subirArchivo } from '../lib/supabase'

export default function FormPage() {
  const { cliente } = useAuth()
  const [step,       setStep]       = useState(0)
  const [completed,  setCompleted]  = useState([])
  const [loading,    setLoading]    = useState(false)
  const [expediente, setExpediente] = useState(null)
  const [ddoData,    setDdoData]    = useState(null)

  // Prellenar demandante con datos del cliente logueado — solo lectura
  const demDefaultValues = useMemo(() => {
    if (!cliente) return null
    return {
      tipo_persona: cliente.tipo_persona || 'natural',
      tipo_doc:     cliente.tipo_doc     || 'DNI',
      num_doc:      cliente.documento    || '',
      nombres:      cliente.tipo_persona === 'juridica' ? '' : (cliente.nombres || ''),
      razon_social: cliente.tipo_persona === 'juridica' ? (cliente.nombres || '') : '',
      celular:      cliente.celular      || '',
      domicilio:    cliente.direccion    || '',
      correo:       cliente.correo       || '',
    }
  }, [cliente])

  function goNext(from) {
    setCompleted(c => [...new Set([...c, from])])
    setStep(from + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Step 0: demandante — datos vienen del cliente, solo confirmamos y avanzamos
  function handleDemandante(data) {
    goNext(0)
  }

  function handleDemandado(data) {
    setDdoData(data)
    goNext(1)
  }

  async function handleAnexos(data) {
    setLoading(true)
    try {
      const numero = generarExpediente()

      const pathsArchivos = []
      for (let i = 0; i < data.archivos.length; i++) {
        const path = await subirArchivo(numero, i + 1, data.archivos[i])
        pathsArchivos.push(path)
      }

      const urlsManuales = [data.url1, data.url2, data.url3, data.url4].filter(Boolean)

      await insertarSolicitud({
        numero_expediente: numero,
        fecha_ingreso:     new Date().toISOString(),
        estado:            'pendiente',
        cliente_id:        cliente?.id || null,  // ← vincula el expediente al cliente

        // Demandante: datos directos del perfil del cliente logueado
        dem_tipo_persona: cliente.tipo_persona || 'natural',
        dem_tipo_doc:     cliente.tipo_doc     || 'DNI',
        dem_num_doc:      cliente.documento    || '',
        dem_nombres:      cliente.nombres      || '',
        dem_celular:      cliente.celular      || '',
        dem_domicilio:    cliente.direccion    || '',
        dem_correo:       cliente.correo       || '',

        // Demandado: datos del step 2
        ddo_tipo_persona: ddoData.tipo_persona,
        ddo_tipo_doc:     ddoData.tipo_doc,
        ddo_num_doc:      ddoData.num_doc,
        ddo_nombres:      ddoData.tipo_persona === 'natural' ? ddoData.nombres : ddoData.razon_social,
        ddo_celular:      ddoData.celular,
        ddo_domicilio:    ddoData.domicilio || '',
        ddo_correo:       ddoData.correo    || '',

        archivos:         pathsArchivos,
        urls_externos:    urlsManuales,
      })

      setExpediente(numero)
      setCompleted(c => [...new Set([...c, 2])])
      setStep(3)
    } catch (err) {
      console.error(err)
      toast('Error al enviar la solicitud. Intente nuevamente.', 'error')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setStep(0); setCompleted([]); setDdoData(null); setExpediente(null)
  }

  return (
    <>
      {/* Mini header con link de regreso */}
      <header style={{ background: 'var(--red)', color: '#fff', height: 54, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
          <span style={{ fontSize: 14, fontWeight: 700 }}>Nueva Solicitud</span>
        </div>
        <Link to="/dashboard" style={{ fontSize: 12, color: 'rgba(255,255,255,.8)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 5 }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
          Mis expedientes
        </Link>
      </header>

      {step < 3 && <Stepper current={step} completed={completed} />}

      <div style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1rem' }}>
        {step === 3 ? (
          <Card>
            <SuccessScreen expediente={expediente} onNew={reset} />
          </Card>
        ) : (
          <Card style={{ padding: '2rem' }}>
            {/* Título del panel */}
            <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 'var(--radius)', background: 'var(--red-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {step === 0 && <UserIcon />}
                {step === 1 && <UserIcon />}
                {step === 2 && <AttachIcon />}
              </div>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700 }}>
                  {step === 0 && 'Datos del Demandante'}
                  {step === 1 && 'Datos del Demandado'}
                  {step === 2 && 'Anexos y Documentos'}
                </h2>
                <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>
                  {step === 0 && 'Sus datos de perfil — verifique que estén correctos'}
                  {step === 1 && 'Ingrese los datos de la parte demandada'}
                  {step === 2 && 'Adjunte los documentos requeridos'}
                </p>
              </div>
            </div>

            {step === 0 && (
              <>
                {/* Banner informativo */}
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', background: 'var(--blue-light)', border: '1px solid #bfdbfe', borderRadius: 'var(--radius)', marginBottom: 20, fontSize: 13, color: 'var(--blue)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span>Estos datos provienen de su perfil registrado. Si necesita actualizarlos, <Link to="/dashboard" style={{ color: 'var(--blue)', fontWeight: 600 }}>vaya a su cuenta</Link>.</span>
                </div>

                {/* Datos del demandante en modo solo lectura */}
                <DemandanteReadonly cliente={cliente} />

                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                  <button
                    onClick={() => handleDemandante(demDefaultValues)}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'var(--red)', color: '#fff', border: 'none', borderRadius: 'var(--radius)', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Confirmar y continuar
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </div>
              </>
            )}

            {step === 1 && (
              <PersonaForm
                title="ddo"
                schema={demandadoSchema}
                defaultValues={ddoData}
                onSubmit={handleDemandado}
                onBack={() => setStep(0)}
              />
            )}
            {step === 2 && (
              <AnexosForm
                onSubmit={handleAnexos}
                onBack={() => setStep(1)}
                loading={loading}
              />
            )}
          </Card>
        )}
      </div>
    </>
  )
}

// Muestra los datos del cliente en modo lectura — limpio, sin inputs
function DemandanteReadonly({ cliente }) {
  if (!cliente) return null
  const fields = [
    { label: 'Tipo de persona',   value: cliente.tipo_persona === 'juridica' ? 'Persona Jurídica' : 'Persona Natural' },
    { label: 'Tipo de documento', value: cliente.tipo_doc },
    { label: 'Número de documento', value: cliente.documento },
    { label: cliente.tipo_persona === 'juridica' ? 'Razón social' : 'Nombres y apellidos', value: cliente.nombres },
    { label: 'Celular',           value: cliente.celular },
    { label: 'Dirección',         value: cliente.direccion },
    { label: 'Correo',            value: cliente.correo || '—' },
  ]
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
      {fields.map(f => (
        <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{f.label}</span>
          <div style={{ padding: '9px 12px', background: '#f9f9f9', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 14, color: 'var(--text)', fontFamily: f.label.includes('documento') ? 'var(--mono)' : 'var(--font)' }}>
            {f.value || '—'}
          </div>
        </div>
      ))}
    </div>
  )
}

function UserIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
}
function AttachIcon() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
}

