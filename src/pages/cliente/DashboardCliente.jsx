import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getExpedientesCliente, getArchivoUrl } from '../../lib/supabase'
import { Badge, Card, Button, Spinner } from '../../components/ui'
import { toast } from '../../components/ui'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const ESTADO_COLORS = { pendiente: 'amber', en_revision: 'blue', atendido: 'green', rechazado: 'red' }
const ESTADO_LABELS = { pendiente: 'Pendiente', en_revision: 'En revisión', atendido: 'Atendido', rechazado: 'Rechazado' }

export default function DashboardCliente() {
  const { cliente, logoutCliente } = useAuth()
  const navigate = useNavigate()
  const [expedientes, setExpedientes] = useState([])
  const [loading,     setLoading]     = useState(true)
  const [selected,    setSelected]    = useState(null)
  const [loadingUrls, setLoadingUrls] = useState(false)
  const [fileUrls,    setFileUrls]    = useState([])

  useEffect(() => {
    if (!cliente) { navigate('/login'); return }
    load()
  }, [cliente])

  async function load() {
    setLoading(true)
    try {
      const data = await getExpedientesCliente(cliente.id)
      setExpedientes(data)
    } catch {
      toast('Error al cargar expedientes', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function verDetalle(exp) {
    setSelected(exp)
    setFileUrls([])
    if (exp.archivos?.length) {
      setLoadingUrls(true)
      try {
        const urls = await Promise.all(exp.archivos.map(p => getArchivoUrl(p)))
        setFileUrls(urls.filter(Boolean))
      } catch {
        toast('No se pudieron cargar los archivos', 'error')
      } finally {
        setLoadingUrls(false)
      }
    }
  }

  function logout() { logoutCliente(); navigate('/login') }

  const stats = {
    total:       expedientes.length,
    pendiente:   expedientes.filter(e => e.estado === 'pendiente').length,
    en_revision: expedientes.filter(e => e.estado === 'en_revision').length,
    atendido:    expedientes.filter(e => e.estado === 'atendido').length,
    rechazado:   expedientes.filter(e => e.estado === 'rechazado').length,
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Header */}
      <header style={{ background: 'var(--red)', color: '#fff', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', boxShadow: '0 2px 12px rgba(196,30,58,.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
          <span style={{ fontSize: 15, fontWeight: 700 }}>Mesa de Partes Virtual</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ textAlign: 'right' }}>
            <p style={{ fontSize: 13, fontWeight: 600 }}>{cliente?.nombres}</p>
            <p style={{ fontSize: 11, opacity: .75 }}>{cliente?.tipo_doc} {cliente?.documento}</p>
          </div>
          <Link to="/perfil" style={{ background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.3)', color: '#fff', padding: '5px 12px', borderRadius: 6, fontSize: 12, textDecoration: 'none' }}>
            Editar perfil
          </Link>
          <button onClick={logout} style={{ background: 'rgba(255,255,255,.15)', border: '1px solid rgba(255,255,255,.3)', color: '#fff', padding: '5px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>
            Salir
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 1rem' }}>

        {/* Acciones */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 18, fontWeight: 700 }}>Mis expedientes</h2>
            <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>Seguimiento de sus solicitudes</p>
          </div>
          <Link to="/nueva-solicitud" style={{ textDecoration: 'none' }}>
            <Button>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Nueva solicitud
            </Button>
          </Link>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: 'Total',       value: stats.total,       color: 'var(--text)' },
            { label: 'Pendientes',  value: stats.pendiente,   color: 'var(--amber)' },
            { label: 'En revisión', value: stats.en_revision, color: 'var(--blue)' },
            { label: 'Atendidos',   value: stats.atendido,    color: 'var(--green)' },
            { label: 'Rechazados',  value: stats.rechazado,   color: 'var(--red)' },
          ].map(s => (
            <Card key={s.label} style={{ padding: '12px 14px' }}>
              <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 4 }}>{s.label}</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: s.color, fontFamily: 'var(--mono)' }}>{s.value}</p>
            </Card>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 16, alignItems: 'start' }}>

          {/* Lista */}
          <Card style={{ overflow: 'hidden' }}>
            {loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Spinner size={28} /></div>
            ) : expedientes.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-3)' }}>
                <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 12 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                <p style={{ fontSize: 14, marginBottom: 12 }}>Aún no tiene expedientes registrados</p>
                <Link to="/nueva-solicitud" style={{ textDecoration: 'none' }}>
                  <Button>Enviar primera solicitud</Button>
                </Link>
              </div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)', background: '#fafafa' }}>
                    {['Expediente', 'Demandado', 'Fecha', 'Estado', ''].map(h => (
                      <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.04em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {expedientes.map((exp, i) => (
                    <tr key={exp.id}
                      style={{ borderBottom: '1px solid var(--border)', background: selected?.id === exp.id ? 'var(--red-light)' : i % 2 === 0 ? 'white' : '#fafafa', cursor: 'pointer', transition: 'background .1s' }}
                      onMouseEnter={e => { if (selected?.id !== exp.id) e.currentTarget.style.background = '#f0f0f0' }}
                      onMouseLeave={e => { if (selected?.id !== exp.id) e.currentTarget.style.background = i % 2 === 0 ? 'white' : '#fafafa' }}
                      onClick={() => verDetalle(exp)}
                    >
                      <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 600, color: 'var(--red)', whiteSpace: 'nowrap' }}>{exp.numero_expediente}</td>
                      <td style={{ padding: '11px 14px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{exp.ddo_nombres || '—'}</td>
                      <td style={{ padding: '11px 14px', color: 'var(--text-3)', fontSize: 12, whiteSpace: 'nowrap' }}>
                        {exp.created_at ? format(new Date(exp.created_at), 'dd/MM/yyyy', { locale: es }) : '—'}
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <Badge color={ESTADO_COLORS[exp.estado] || 'gray'}>{ESTADO_LABELS[exp.estado] || exp.estado}</Badge>
                      </td>
                      <td style={{ padding: '11px 14px' }}>
                        <span style={{ fontSize: 12, color: 'var(--red)', fontWeight: 500 }}>Ver →</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Card>

          {/* Detalle */}
          {selected && (
            <Card style={{ padding: '20px', fontSize: 13 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ fontSize: 14, fontWeight: 700 }}>Detalle</h3>
                <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 20, lineHeight: 1 }}>×</button>
              </div>

              <div style={{ fontFamily: 'var(--mono)', fontSize: 17, fontWeight: 700, color: 'var(--red)', marginBottom: 10 }}>{selected.numero_expediente}</div>
              <Badge color={ESTADO_COLORS[selected.estado]}>{ESTADO_LABELS[selected.estado]}</Badge>

              {/* Feedback del admin */}
              {selected.feedback && (
                <div style={{ marginTop: 14, padding: '12px 14px', background: selected.estado === 'rechazado' ? 'var(--red-light)' : 'var(--green-light)', border: `1px solid ${selected.estado === 'rechazado' ? 'var(--red-border)' : '#bbf7d0'}`, borderRadius: 'var(--radius)', borderLeft: `3px solid ${selected.estado === 'rechazado' ? 'var(--red)' : 'var(--green)'}` }}>
                  <p style={{ fontSize: 11, fontWeight: 600, color: selected.estado === 'rechazado' ? 'var(--red)' : 'var(--green)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 5 }}>
                    Observación del revisor
                  </p>
                  <p style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{selected.feedback}</p>
                </div>
              )}

              <Sep label="Demandado" />
              <Row label="Nombre"    value={selected.ddo_nombres} />
              <Row label="Documento" value={`${selected.ddo_tipo_doc} ${selected.ddo_num_doc}`} />
              <Row label="Celular"   value={selected.ddo_celular} />

              <Sep label="Registro" />
              <Row label="Fecha" value={selected.created_at ? format(new Date(selected.created_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es }) : '—'} />

              {/* Archivos */}
              {selected.archivos?.length > 0 && (
                <>
                  <Sep label="Documentos adjuntos" />
                  {loadingUrls ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '12px' }}><Spinner size={18} /></div>
                  ) : (
                    fileUrls.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noreferrer"
                        style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', marginBottom: 6, background: 'var(--blue-light)', border: '1px solid #bfdbfe', borderRadius: 'var(--radius)', textDecoration: 'none', color: 'var(--blue)', fontSize: 12, fontWeight: 500 }}>
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        Documento {i + 1} — Ver / Descargar
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 'auto' }}><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                      </a>
                    ))
                  )}
                </>
              )}

              {/* URLs externas */}
              {selected.urls_externos?.length > 0 && (
                <>
                  <Sep label="Enlaces externos" />
                  {selected.urls_externos.map((u, i) => (
                    <a key={i} href={u} target="_blank" rel="noreferrer"
                      style={{ display: 'block', fontSize: 12, color: 'var(--blue)', padding: '3px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {u}
                    </a>
                  ))}
                </>
              )}
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

function Sep({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '14px 0 8px' }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.06em', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  )
}

function Row({ label, value }) {
  return value ? (
    <div style={{ display: 'flex', gap: 8, padding: '4px 0', borderBottom: '1px solid #f4f4f5' }}>
      <span style={{ fontSize: 11, color: 'var(--text-3)', width: 72, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: 12, color: 'var(--text)', wordBreak: 'break-word' }}>{value}</span>
    </div>
  ) : null
}
