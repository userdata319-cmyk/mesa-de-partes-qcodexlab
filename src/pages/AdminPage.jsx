import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { getSolicitudes, updateEstado } from '../lib/supabase'
import { Badge, Button, Card, Spinner } from '../components/ui'
import { toast } from '../components/ui'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'

const ESTADOS = ['pendiente', 'en_revision', 'atendido', 'rechazado']
const ESTADO_COLORS = { pendiente: 'amber', en_revision: 'blue', atendido: 'green', rechazado: 'red' }
const ESTADO_LABELS = { pendiente: 'Pendiente', en_revision: 'En revisión', atendido: 'Atendido', rechazado: 'Rechazado' }

export default function AdminPage() {
  const [data,     setData]     = useState([])
  const [count,    setCount]    = useState(0)
  const [page,     setPage]     = useState(1)
  const [search,   setSearch]   = useState('')
  const [estado,   setEstado]   = useState('')
  const [loading,  setLoading]  = useState(true)
  const [selected, setSelected] = useState(null)
  const [updating, setUpdating] = useState(null)

  const LIMIT = 15

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getSolicitudes({ page, limit: LIMIT, search, estado })
      setData(res.data || [])
      setCount(res.count || 0)
    } catch (e) {
      toast('Error al cargar solicitudes', 'error')
    } finally {
      setLoading(false)
    }
  }, [page, search, estado])

  useEffect(() => { load() }, [load])

  // Debounce search
  useEffect(() => { setPage(1) }, [search, estado])

  async function cambiarEstado(id, nuevoEstado) {
    setUpdating(id)
    try {
      await updateEstado(id, nuevoEstado)
      setData(d => d.map(row => row.id === id ? { ...row, estado: nuevoEstado } : row))
      if (selected?.id === id) setSelected(s => ({ ...s, estado: nuevoEstado }))
      toast('Estado actualizado', 'success')
    } catch (e) {
      toast('Error al actualizar estado', 'error')
    } finally {
      setUpdating(null)
    }
  }

  const totalPages = Math.ceil(count / LIMIT)

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1rem' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700 }}>Panel de Administración</h1>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 2 }}>Mesa de Partes Virtual — Gestión de expedientes</p>
        </div>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <Button variant="secondary">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>
            Nueva solicitud
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Total', value: count, color: 'var(--text)' },
          { label: 'Pendientes',  value: data.filter(d => d.estado === 'pendiente').length,   color: 'var(--amber)' },
          { label: 'En revisión', value: data.filter(d => d.estado === 'en_revision').length, color: 'var(--blue)' },
          { label: 'Atendidos',   value: data.filter(d => d.estado === 'atendido').length,    color: 'var(--green)' },
        ].map(s => (
          <Card key={s.label} style={{ padding: '14px 18px' }}>
            <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.04em', marginBottom: 6 }}>{s.label}</p>
            <p style={{ fontSize: 26, fontWeight: 700, color: s.color, fontFamily: 'var(--mono)' }}>{s.value}</p>
          </Card>
        ))}
      </div>

      {/* Filtros */}
      <Card style={{ padding: '14px 18px', marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <svg style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }}
            width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            placeholder="Buscar por expediente, nombre…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: '100%', padding: '8px 12px 8px 32px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13, outline: 'none', fontFamily: 'var(--font)' }}
          />
        </div>
        <select
          value={estado}
          onChange={e => setEstado(e.target.value)}
          style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', fontSize: 13, color: 'var(--text-2)', outline: 'none', fontFamily: 'var(--font)', background: 'white' }}
        >
          <option value="">Todos los estados</option>
          {ESTADOS.map(e => <option key={e} value={e}>{ESTADO_LABELS[e]}</option>)}
        </select>
        <Button variant="secondary" onClick={load} style={{ padding: '8px 14px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
          Actualizar
        </Button>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: selected ? '1fr 380px' : '1fr', gap: 16, alignItems: 'start' }}>

        {/* Tabla */}
        <Card style={{ overflow: 'hidden' }}>
          {loading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
              <Spinner size={28} />
            </div>
          ) : data.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-3)' }}>
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ marginBottom: 12 }}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
              <p style={{ fontSize: 14 }}>No se encontraron solicitudes</p>
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)', background: '#fafafa' }}>
                  {['Expediente', 'Demandante', 'Demandado', 'Fecha', 'Estado', 'Acción'].map(h => (
                    <th key={h} style={{ padding: '11px 14px', textAlign: 'left', fontWeight: 600, fontSize: 11, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.04em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.map((row, i) => (
                  <tr
                    key={row.id}
                    onClick={() => setSelected(selected?.id === row.id ? null : row)}
                    style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer', background: selected?.id === row.id ? 'var(--red-light)' : i % 2 === 0 ? 'white' : '#fafafa', transition: 'background .1s' }}
                    onMouseEnter={e => { if (selected?.id !== row.id) e.currentTarget.style.background = '#f5f5f5' }}
                    onMouseLeave={e => { if (selected?.id !== row.id) e.currentTarget.style.background = i % 2 === 0 ? 'white' : '#fafafa' }}
                  >
                    <td style={{ padding: '11px 14px', fontFamily: 'var(--mono)', fontWeight: 500, color: 'var(--red)', fontSize: 12, whiteSpace: 'nowrap' }}>{row.numero_expediente}</td>
                    <td style={{ padding: '11px 14px', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{row.dem_nombres}</td>
                    <td style={{ padding: '11px 14px', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--text-2)' }}>{row.ddo_nombres}</td>
                    <td style={{ padding: '11px 14px', color: 'var(--text-3)', fontSize: 12, whiteSpace: 'nowrap' }}>
                      {row.created_at ? format(new Date(row.created_at), 'dd/MM/yyyy', { locale: es }) : '—'}
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      <Badge color={ESTADO_COLORS[row.estado] || 'gray'}>{ESTADO_LABELS[row.estado] || row.estado}</Badge>
                    </td>
                    <td style={{ padding: '11px 14px' }}>
                      {updating === row.id ? <Spinner size={14} /> : (
                        <select
                          value={row.estado}
                          onChange={e => { e.stopPropagation(); cambiarEstado(row.id, e.target.value) }}
                          onClick={e => e.stopPropagation()}
                          style={{ padding: '4px 8px', fontSize: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', background: 'white', cursor: 'pointer', fontFamily: 'var(--font)' }}
                        >
                          {ESTADOS.map(e => <option key={e} value={e}>{ESTADO_LABELS[e]}</option>)}
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Paginación */}
          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-3)' }}>
              <span>Mostrando {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, count)} de {count}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <Button variant="secondary" style={{ padding: '5px 10px', fontSize: 12 }} disabled={page === 1} onClick={() => setPage(p => p - 1)}>←</Button>
                <span style={{ padding: '5px 10px', fontFamily: 'var(--mono)' }}>{page} / {totalPages}</span>
                <Button variant="secondary" style={{ padding: '5px 10px', fontSize: 12 }} disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>→</Button>
              </div>
            </div>
          )}
        </Card>

        {/* Panel de detalle */}
        {selected && (
          <Card style={{ padding: '20px', fontSize: 13 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 700 }}>Detalle del Expediente</h3>
              <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', fontSize: 18, lineHeight: 1 }}>×</button>
            </div>

            <div style={{ fontFamily: 'var(--mono)', fontSize: 18, fontWeight: 600, color: 'var(--red)', marginBottom: 12 }}>{selected.numero_expediente}</div>

            <Badge color={ESTADO_COLORS[selected.estado]}>{ESTADO_LABELS[selected.estado]}</Badge>

            <Divider label="Demandante" />
            <DetailRow label="Tipo" value={selected.dem_tipo_persona} />
            <DetailRow label="Documento" value={`${selected.dem_tipo_doc} · ${selected.dem_num_doc}`} />
            <DetailRow label="Nombre" value={selected.dem_nombres} />
            <DetailRow label="Celular" value={selected.dem_celular} />
            {selected.dem_domicilio && <DetailRow label="Domicilio" value={selected.dem_domicilio} />}
            {selected.dem_correo && <DetailRow label="Correo" value={selected.dem_correo} />}

            <Divider label="Demandado" />
            <DetailRow label="Tipo" value={selected.ddo_tipo_persona} />
            <DetailRow label="Documento" value={`${selected.ddo_tipo_doc} · ${selected.ddo_num_doc}`} />
            <DetailRow label="Nombre" value={selected.ddo_nombres} />
            <DetailRow label="Celular" value={selected.ddo_celular} />
            {selected.ddo_domicilio && <DetailRow label="Domicilio" value={selected.ddo_domicilio} />}
            {selected.ddo_correo && <DetailRow label="Correo" value={selected.ddo_correo} />}

            {selected.archivos?.length > 0 && (
              <>
                <Divider label="Archivos adjuntos" />
                {selected.archivos.map((a, i) => (
                  <div key={i} style={{ fontSize: 12, color: 'var(--blue)', fontFamily: 'var(--mono)', padding: '3px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a}</div>
                ))}
              </>
            )}

            {selected.urls_externos?.length > 0 && (
              <>
                <Divider label="URLs externas" />
                {selected.urls_externos.map((u, i) => (
                  <a key={i} href={u} target="_blank" rel="noreferrer" style={{ display: 'block', fontSize: 12, color: 'var(--blue)', padding: '2px 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u}</a>
                ))}
              </>
            )}

            <Divider label="Registro" />
            <DetailRow label="Ingresado" value={selected.created_at ? format(new Date(selected.created_at), "dd/MM/yyyy 'a las' HH:mm", { locale: es }) : '—'} />
          </Card>
        )}
      </div>
    </div>
  )
}

function Divider({ label }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '14px 0 8px' }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '.06em', whiteSpace: 'nowrap' }}>{label}</span>
      <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
    </div>
  )
}

function DetailRow({ label, value }) {
  return value ? (
    <div style={{ display: 'flex', gap: 8, padding: '4px 0', borderBottom: '1px solid #f4f4f5' }}>
      <span style={{ fontSize: 11, color: 'var(--text-3)', width: 72, flexShrink: 0, paddingTop: 1 }}>{label}</span>
      <span style={{ fontSize: 12, color: 'var(--text)', wordBreak: 'break-word' }}>{value}</span>
    </div>
  ) : null
}
