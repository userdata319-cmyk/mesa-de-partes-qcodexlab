import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Stepper } from '../components/Stepper'
import { PersonaForm } from '../components/PersonaForm'
import { AnexosForm } from '../components/AnexosForm'
import { SuccessScreen } from '../components/SuccessScreen'
import { Card, Button } from '../components/ui'
import { toast } from '../components/ui'
import { useAuth } from '../context/AuthContext'
import { demandadoSchema } from '../lib/schemas'
import { obtenerNumeroExpediente, insertarSolicitud, subirArchivo } from '../lib/supabase'

const TIPOS_SOLICITUD = [
  {
    value: 'ARBITRAJE',
    label: 'Solicitud de Arbitraje',
    descripcion: 'Resolución de conflictos mediante árbitro imparcial',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>
    ),
  },
  {
    value: 'JPRD',
    label: 'Solicitud de JPRD',
    descripcion: 'Junta de Prevención y Resolución de Disputas',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/>
        <path d="M12 8v4l3 3"/>
      </svg>
    ),
  },
  {
    value: 'OTRAS',
    label: 'Otras Solicitudes',
    descripcion: 'Cualquier otro tipo de solicitud o consulta',
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="16" y1="13" x2="8" y2="13"/>
        <line x1="16" y1="17" x2="8" y2="17"/>
      </svg>
    ),
  },
]

export default function FormPage() {
  const { cliente } = useAuth()
  const [step,          setStep]         = useState(0)
  const [completed,     setCompleted]    = useState([])
  const [loading,       setLoading]      = useState(false)
  const [expediente,    setExpediente]   = useState(null)
  const [tipoSolicitud, setTipoSolicitud]= useState('')
  const [tipoError,     setTipoError]    = useState(false)
  const [ddoData,       setDdoData]      = useState(null)

  function goNext(from) {
    setCompleted(c => [...new Set([...c, from])])
    setStep(from + 1)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Step 0: selección de tipo de solicitud
  function handleTipoSolicitud() {
    if (!tipoSolicitud) { setTipoError(true); return }
    setTipoError(false)
    goNext(0)
  }

  // Step 1: demandante — solo confirmar (datos del perfil)
  function handleDemandante() { goNext(1) }

  // Step 2: demandado
  function handleDemandado(data) {
    setDdoData(data)
    goNext(2)
  }

  // Step 3: anexos → enviar
  async function handleAnexos(data) {
    setLoading(true)
    try {
      // Número correlativo desde Supabase
      const numero = await obtenerNumeroExpediente()

      const pathsArchivos = []
      for (let i = 0; i < data.archivos.length; i++) {
        const path = await subirArchivo(numero, i + 1, data.archivos[i])
        pathsArchivos.push(path)
      }

      const urlsManuales = [data.url1, data.url2, data.url3, data.url4].filter(Boolean)

      await insertarSolicitud({
        numero_expediente: numero,
        tipo_solicitud:    tipoSolicitud,
        fecha_ingreso:     new Date().toISOString(),
        estado:            'pendiente',
        cliente_id:        cliente?.id || null,

        dem_tipo_persona: cliente.tipo_persona || 'natural',
        dem_tipo_doc:     cliente.tipo_doc     || 'DNI',
        dem_num_doc:      cliente.documento    || '',
        dem_nombres:      cliente.nombres      || '',
        dem_celular:      cliente.celular      || '',
        dem_domicilio:    cliente.direccion    || '',
        dem_correo:       cliente.correo       || '',

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
      setCompleted(c => [...new Set([...c, 3])])
      setStep(4)
    } catch (err) {
      console.error(err)
      toast('Error al enviar la solicitud. Intente nuevamente.', 'error')
    } finally {
      setLoading(false)
    }
  }

  function reset() {
    setStep(0); setCompleted([]); setDdoData(null)
    setExpediente(null); setTipoSolicitud(''); setTipoError(false)
  }

  const panelTitles = [
    { title: 'Tipo de solicitud',    sub: 'Seleccione el tipo de solicitud que desea presentar' },
    { title: 'Datos del Demandante', sub: 'Sus datos de perfil — verifique que estén correctos' },
    { title: 'Datos del Demandado',  sub: 'Ingrese los datos de la parte demandada' },
    { title: 'Anexos y Documentos',  sub: 'Adjunte los documentos requeridos' },
  ]

  return (
    <>
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

      {step < 4 && <Stepper current={step} completed={completed} />}

      <div style={{ maxWidth: 900, margin: '2rem auto', padding: '0 1rem' }}>
        {step === 4 ? (
          <Card>
            <SuccessScreen expediente={expediente} tipoSolicitud={tipoSolicitud} onNew={reset} />
          </Card>
        ) : (
          <Card style={{ padding: '2rem' }}>
            {/* Título panel */}
            <div style={{ marginBottom: 24, paddingBottom: 16, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 32, height: 32, borderRadius: 'var(--radius)', background: 'var(--red-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--red)' }}>
                {step === 0 && <DocIcon />}
                {step === 1 && <UserIcon />}
                {step === 2 && <UserIcon />}
                {step === 3 && <AttachIcon />}
              </div>
              <div>
                <h2 style={{ fontSize: 15, fontWeight: 700 }}>{panelTitles[step]?.title}</h2>
                <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>{panelTitles[step]?.sub}</p>
              </div>
            </div>

            {/* STEP 0 — Tipo de solicitud */}
            {step === 0 && (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                  {TIPOS_SOLICITUD.map(tipo => (
                    <button
                      key={tipo.value}
                      onClick={() => { setTipoSolicitud(tipo.value); setTipoError(false) }}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 16,
                        padding: '18px 20px',
                        border: `2px solid ${tipoSolicitud === tipo.value ? 'var(--red)' : 'var(--border)'}`,
                        borderRadius: 'var(--radius-lg)',
                        background: tipoSolicitud === tipo.value ? 'var(--red-light)' : 'var(--surface)',
                        cursor: 'pointer', textAlign: 'left', transition: 'all .15s',
                        color: tipoSolicitud === tipo.value ? 'var(--red)' : 'var(--text)',
                      }}
                    >
                      {/* Indicador selección */}
                      <div style={{
                        width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                        border: `2px solid ${tipoSolicitud === tipo.value ? 'var(--red)' : 'var(--border-2)'}`,
                        background: tipoSolicitud === tipo.value ? 'var(--red)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all .15s',
                      }}>
                        {tipoSolicitud === tipo.value && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                        )}
                      </div>
                      {/* Icono */}
                      <div style={{
                        width: 44, height: 44, borderRadius: 'var(--radius)',
                        background: tipoSolicitud === tipo.value ? 'rgba(196,30,58,.12)' : '#f4f4f5',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, transition: 'all .15s',
                        color: tipoSolicitud === tipo.value ? 'var(--red)' : 'var(--text-3)',
                      }}>
                        {tipo.icon}
                      </div>
                      {/* Texto */}
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>{tipo.label}</p>
                        <p style={{ fontSize: 12, color: tipoSolicitud === tipo.value ? 'var(--red)' : 'var(--text-3)', opacity: .85 }}>{tipo.descripcion}</p>
                      </div>
                    </button>
                  ))}
                </div>

                {tipoError && (
                  <div style={{ fontSize: 12, color: 'var(--red)', background: 'var(--red-light)', borderLeft: '2px solid var(--red)', padding: '8px 12px', borderRadius: '0 var(--radius) var(--radius) 0', marginBottom: 16 }}>
                    Debe seleccionar un tipo de solicitud para continuar
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                  <Button onClick={handleTipoSolicitud}>
                    Continuar
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                  </Button>
                </div>
              </>
            )}

            {/* STEP 1 — Demandante (solo lectura) */}
            {step === 1 && (
              <>
                {/* Tipo de solicitud seleccionado */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'var(--red-light)', border: '1px solid var(--red-border)', borderRadius: 'var(--radius)', marginBottom: 20 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--red)" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                  <span style={{ fontSize: 12, color: 'var(--red)', fontWeight: 600 }}>
                    {TIPOS_SOLICITUD.find(t => t.value === tipoSolicitud)?.label}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', background: 'var(--blue-light)', border: '1px solid #bfdbfe', borderRadius: 'var(--radius)', marginBottom: 20, fontSize: 13, color: 'var(--blue)' }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ flexShrink: 0, marginTop: 1 }}><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                  <span>Estos datos provienen de su perfil. Si desea actualizarlos, <Link to="/perfil" style={{ color: 'var(--blue)', fontWeight: 600 }}>edite su perfil</Link>.</span>
                </div>

                <DemandanteReadonly cliente={cliente} />

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 28, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                  <Button variant="secondary" onClick={() => setStep(0)}>← Anterior</Button>
                  <Button onClick={handleDemandante}>
                    Confirmar y continuar
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="9 18 15 12 9 6"/></svg>
                  </Button>
                </div>
              </>
            )}

            {/* STEP 2 — Demandado */}
            {step === 2 && (
              <PersonaForm
                title="ddo"
                schema={demandadoSchema}
                defaultValues={ddoData}
                onSubmit={handleDemandado}
                onBack={() => setStep(1)}
              />
            )}

            {/* STEP 3 — Anexos */}
            {step === 3 && (
              <AnexosForm
                onSubmit={handleAnexos}
                onBack={() => setStep(2)}
                loading={loading}
              />
            )}
          </Card>
        )}
      </div>
    </>
  )
}

function DemandanteReadonly({ cliente }) {
  if (!cliente) return null
  const fields = [
    { label: 'Tipo de persona',     value: cliente.tipo_persona === 'juridica' ? 'Persona Jurídica' : 'Persona Natural' },
    { label: 'Tipo de documento',   value: cliente.tipo_doc },
    { label: 'Número de documento', value: cliente.documento },
    { label: cliente.tipo_persona === 'juridica' ? 'Razón social' : 'Nombres y apellidos', value: cliente.nombres },
    { label: 'Celular',             value: cliente.celular },
    { label: 'Dirección',           value: cliente.direccion },
    { label: 'Correo',              value: cliente.correo || '—' },
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

function DocIcon()    { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg> }
function UserIcon()   { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> }
function AttachIcon() { return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg> }
