import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { getSolicitudes, updateEstado, getArchivoUrl, getAdmins, crearAdmin, toggleAdmin } from '../../lib/supabase'
import { Badge, Button, Card, Spinner } from '../../components/ui'
import { toast } from '../../components/ui'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import Dashboard from './Dashboard'

const ESTADOS       = ['pendiente','en_revision','atendido','rechazado']
const ESTADO_COLORS = { pendiente:'amber', en_revision:'blue', atendido:'green', rechazado:'red' }
const ESTADO_LABELS = { pendiente:'Pendiente', en_revision:'En revisión', atendido:'Atendido', rechazado:'Rechazado' }

export default function AdminPage() {
  const { admin, logoutAdmin, actualizarAdmin } = useAuth()
  const navigate = useNavigate()
  const [tab,       setTab]       = useState('expedientes') // 'expedientes' | 'usuarios'
  const [data,      setData]      = useState([])
  const [count,     setCount]     = useState(0)
  const [page,      setPage]      = useState(1)
  const [search,    setSearch]    = useState('')
  const [estado,    setEstado]    = useState('')
  const [tipo,      setTipo]      = useState('')
  const [loading,   setLoading]   = useState(true)
  const [selected,  setSelected]  = useState(null)
  const [fileUrls,  setFileUrls]  = useState([])
  const [pdfUrl,    setPdfUrl]    = useState(null)
  // Feedback modal
  const [fbModal,   setFbModal]   = useState(null) // { id, estado_actual }
  const [fbEstado,  setFbEstado]  = useState('')
  const [fbTexto,   setFbTexto]   = useState('')
  const [fbLoading, setFbLoading] = useState(false)
  // Usuarios admin
  const [admins,    setAdmins]    = useState([])
  const [admLoading,setAdmLoading]= useState(false)
  const [newAdmin,  setNewAdmin]  = useState({ dni:'', nombres:'', username:'', password:'' })
  const [newErrs,   setNewErrs]   = useState({})
  const [creating,  setCreating]  = useState(false)
  // Editar admin
  const [editAdmin,    setEditAdmin]    = useState(null)
  const [editForm,     setEditForm]     = useState({ dni:'', nombres:'' })
  const [editErrs,     setEditErrs]     = useState({})
  const [editSaving,   setEditSaving]   = useState(false)
  const [pwAdminForm,  setPwAdminForm]  = useState({ nueva:'', confirmar:'' })
  const [pwAdminErrs,  setPwAdminErrs]  = useState({})
  const [pwAdminSaving,setPwAdminSaving]= useState(false)

  const LIMIT = 15

  useEffect(() => { if (!admin) navigate('/admin/login') }, [admin])

  const loadExpedientes = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getSolicitudes({ page, limit: LIMIT, search, estado, tipo })
      setData(res.data || [])
      setCount(res.count || 0)
    } catch { toast('Error al cargar solicitudes', 'error') }
    finally  { setLoading(false) }
  }, [page, search, estado, tipo])

  useEffect(() => { if (tab === 'expedientes') loadExpedientes() }, [loadExpedientes, tab])
  useEffect(() => { setPage(1) }, [search, estado, tipo])

  async function loadAdmins() {
    setAdmLoading(true)
    try { setAdmins(await getAdmins()) }
    catch { toast('Error al cargar usuarios', 'error') }
    finally { setAdmLoading(false) }
  }
  useEffect(() => { if (tab === 'usuarios') loadAdmins() }, [tab])
  useEffect(() => {
    if (editAdmin) setEditForm({ dni: editAdmin.dni || '', nombres: editAdmin.nombres || '' })
  }, [editAdmin])

  // Abrir detalle + cargar URLs firmadas
  async function verDetalle(row) {
    setSelected(row); setFileUrls([]); setPdfUrl(null)
    if (row.archivos?.length) {
      const urls = await Promise.all(row.archivos.map(p => getArchivoUrl(p)))
      setFileUrls(urls.filter(Boolean))
    }
  }

  // Abrir PDF en visor
  function abrirPdf(url) { setPdfUrl(url) }

  // Modal feedback
  function abrirFeedback(row) {
    setFbModal(row); setFbEstado(row.estado); setFbTexto(row.feedback || '')
  }

  async function guardarFeedback() {
    if (!fbEstado) { toast('Seleccione un estado', 'error'); return }
    setFbLoading(true)
    try {
      await updateEstado(fbModal.id, fbEstado, fbTexto || null)
      setData(d => d.map(r => r.id === fbModal.id ? { ...r, estado: fbEstado, feedback: fbTexto } : r))
      if (selected?.id === fbModal.id) setSelected(s => ({ ...s, estado: fbEstado, feedback: fbTexto }))
      toast('Expediente actualizado', 'success')
      setFbModal(null)
    } catch { toast('Error al actualizar', 'error') }
    finally { setFbLoading(false) }
  }

  // Crear admin
  async function handleCrearAdmin(e) {
    e.preventDefault()
    const errs = {}
    if (!newAdmin.dni    || newAdmin.dni.length < 8)  errs.dni      = 'DNI inválido'
    if (!newAdmin.nombres.trim())                      errs.nombres  = 'Obligatorio'
    if (!newAdmin.username.trim())                     errs.username = 'Obligatorio'
    if (!newAdmin.password || newAdmin.password.length < 6) errs.password = 'Mínimo 6 caracteres'
    setNewErrs(errs)
    if (Object.keys(errs).length) return
    setCreating(true)
    try {
      await crearAdmin(newAdmin)
      toast('Usuario creado', 'success')
      setNewAdmin({ dni:'', nombres:'', username:'', password:'' })
      loadAdmins()
    } catch (err) { toast(err.message, 'error') }
    finally { setCreating(false) }
  }

  const totalPages = Math.ceil(count / LIMIT)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* Header */}
      <header style={{ background: '#111', color: '#fff', height: 58, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1.5rem', position: 'sticky', top: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 28, height: 28, background: 'var(--red)', borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            </div>
            <span style={{ fontSize: 14, fontWeight: 700 }}>Admin Panel</span>
          </div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 2 }}>
            {[{ key:'dashboard', label:'Dashboard' }, { key:'expedientes', label:'Expedientes' }, { key:'usuarios', label:'Usuarios' }].map(t => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{ padding: '5px 14px', borderRadius: 6, border: 'none', fontSize: 12, fontWeight: 500, cursor: 'pointer', background: tab === t.key ? 'rgba(255,255,255,.12)' : 'transparent', color: tab === t.key ? '#fff' : '#888', transition: 'all .15s' }}>
                {t.label}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: '#888' }}>{admin?.nombres}</span>
          <button onClick={() => { logoutAdmin(); navigate('/admin/login') }}
            style={{ background: 'rgba(255,255,255,.1)', border: '1px solid #333', color: '#ccc', padding: '4px 12px', borderRadius: 6, fontSize: 11, cursor: 'pointer' }}>
            Salir
          </button>
        </div>
      </header>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '1.5rem 1rem' }}>

        {/* ── TAB DASHBOARD ───────────────────────────────────── */}
        {tab === 'dashboard' && <Dashboard />}

        {/* ── TAB EXPEDIENTES ─────────────────────────────────── */}
        {tab === 'expedientes' && (
          <>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 16 }}>
              {[
                { label:'Total',       value: count,                                                   color:'var(--text)' },
                { label:'Pendientes',  value: data.filter(d=>d.estado==='pendiente').length,            color:'var(--amber)' },
                { label:'En revisión', value: data.filter(d=>d.estado==='en_revision').length,          color:'var(--blue)' },
                { label:'Atendidos',   value: data.filter(d=>d.estado==='atendido').length,             color:'var(--green)' },
              ].map(s => (
                <Card key={s.label} style={{ padding:'12px 16px' }}>
                  <p style={{ fontSize:10, fontWeight:600, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:4 }}>{s.label}</p>
                  <p style={{ fontSize:24, fontWeight:700, color:s.color, fontFamily:'var(--mono)' }}>{s.value}</p>
                </Card>
              ))}
            </div>

            {/* Filtros */}
            <Card style={{ padding:'12px 16px', marginBottom:14, display:'flex', gap:10, flexWrap:'wrap', alignItems:'center' }}>
              <div style={{ position:'relative', flex:1, minWidth:180 }}>
                <svg style={{ position:'absolute', left:9, top:'50%', transform:'translateY(-50%)', color:'var(--text-3)', pointerEvents:'none' }} width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input placeholder="Buscar expediente, nombre…" value={search} onChange={e=>setSearch(e.target.value)}
                  style={{ width:'100%', padding:'7px 10px 7px 30px', border:'1px solid var(--border)', borderRadius:'var(--radius)', fontSize:13, outline:'none', fontFamily:'var(--font)' }}/>
              </div>
              <select value={estado} onChange={e=>setEstado(e.target.value)}
                style={{ padding:'7px 10px', border:'1px solid var(--border)', borderRadius:'var(--radius)', fontSize:13, color:'var(--text-2)', outline:'none', fontFamily:'var(--font)', background:'white' }}>
                <option value="">Todos los estados</option>
                {ESTADOS.map(e=><option key={e} value={e}>{ESTADO_LABELS[e]}</option>)}
              </select>
              <select value={tipo} onChange={e=>setTipo(e.target.value)}
                style={{ padding:'7px 10px', border:'1px solid var(--border)', borderRadius:'var(--radius)', fontSize:13, color:'var(--text-2)', outline:'none', fontFamily:'var(--font)', background:'white' }}>
                <option value="">Todos los tipos</option>
                <option value="ARBITRAJE">Arbitraje</option>
                <option value="JPRD">JPRD</option>
                <option value="OTRAS">Otras</option>
              </select>
              <Button variant="secondary" onClick={loadExpedientes} style={{ padding:'7px 12px' }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>
                Actualizar
              </Button>
            </Card>

            <div style={{ display:'grid', gridTemplateColumns: pdfUrl ? '1fr' : selected ? '1fr 400px' : '1fr', gap:14, alignItems:'start' }}>

              {/* Visor PDF pantalla completa */}
              {pdfUrl ? (
                <Card style={{ overflow:'hidden' }}>
                  <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderBottom:'1px solid var(--border)' }}>
                    <span style={{ fontSize:13, fontWeight:600 }}>Visor de documento</span>
                    <div style={{ display:'flex', gap:8 }}>
                      <a href={pdfUrl} target="_blank" rel="noreferrer">
                        <Button variant="ghost" style={{ padding:'5px 12px', fontSize:12 }}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                          Abrir en nueva pestaña
                        </Button>
                      </a>
                      <Button variant="secondary" onClick={() => setPdfUrl(null)} style={{ padding:'5px 12px', fontSize:12 }}>
                        × Cerrar visor
                      </Button>
                    </div>
                  </div>
                  <iframe src={pdfUrl} style={{ width:'100%', height:'75vh', border:'none', display:'block' }} title="Documento PDF" />
                </Card>
              ) : (
                <>
                  {/* Tabla */}
                  <Card style={{ overflow:'hidden' }}>
                    {loading ? (
                      <div style={{ display:'flex', justifyContent:'center', padding:'3rem' }}><Spinner size={26}/></div>
                    ) : data.length === 0 ? (
                      <div style={{ textAlign:'center', padding:'3rem', color:'var(--text-3)', fontSize:14 }}>No se encontraron expedientes</div>
                    ) : (
                      <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                        <thead>
                          <tr style={{ borderBottom:'1px solid var(--border)', background:'#fafafa' }}>
                            {['Expediente','Tipo','Demandante','Demandado','Fecha','Estado','Acción'].map(h=>(
                              <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontSize:11, fontWeight:600, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.04em', whiteSpace:'nowrap' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {data.map((row,i) => (
                            <tr key={row.id} onClick={() => verDetalle(row)}
                              style={{ borderBottom:'1px solid var(--border)', cursor:'pointer', background: selected?.id===row.id ? 'var(--red-light)' : i%2===0?'white':'#fafafa', transition:'background .1s' }}
                              onMouseEnter={e => { if(selected?.id!==row.id) e.currentTarget.style.background='#f0f0f0' }}
                              onMouseLeave={e => { if(selected?.id!==row.id) e.currentTarget.style.background=i%2===0?'white':'#fafafa' }}>
                              <td style={{ padding:'10px 12px', fontFamily:'var(--mono)', fontSize:11, fontWeight:600, color:'var(--red)', whiteSpace:'nowrap' }}>{row.numero_expediente}</td>
                              <td style={{ padding:'10px 12px' }}>
                                {row.tipo_solicitud ? (
                                  <span style={{ fontSize:10, fontWeight:700, padding:'3px 8px', borderRadius:99, whiteSpace:'nowrap',
                                    background: row.tipo_solicitud==='ARBITRAJE' ? '#eff6ff' : row.tipo_solicitud==='JPRD' ? '#f0fdf4' : '#fafafa',
                                    color:      row.tipo_solicitud==='ARBITRAJE' ? 'var(--blue)' : row.tipo_solicitud==='JPRD' ? 'var(--green)' : 'var(--text-3)',
                                  }}>
                                    {row.tipo_solicitud}
                                  </span>
                                ) : '—'}
                              </td>
                              <td style={{ padding:'10px 12px', maxWidth:130, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{row.dem_nombres}</td>
                              <td style={{ padding:'10px 12px', maxWidth:130, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--text-2)' }}>{row.ddo_nombres}</td>
                              <td style={{ padding:'10px 12px', color:'var(--text-3)', fontSize:11, whiteSpace:'nowrap' }}>
                                {row.created_at ? format(new Date(row.created_at),'dd/MM/yyyy',{locale:es}) : '—'}
                              </td>
                              <td style={{ padding:'10px 12px' }}>
                                <Badge color={ESTADO_COLORS[row.estado]||'gray'}>{ESTADO_LABELS[row.estado]||row.estado}</Badge>
                              </td>
                              <td style={{ padding:'10px 12px' }} onClick={e=>e.stopPropagation()}>
                                <Button onClick={() => abrirFeedback(row)} variant="secondary" style={{ padding:'4px 10px', fontSize:11 }}>
                                  Revisar
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    {/* Paginación */}
                    {totalPages > 1 && (
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', borderTop:'1px solid var(--border)', fontSize:12, color:'var(--text-3)' }}>
                        <span>Mostrando {(page-1)*LIMIT+1}–{Math.min(page*LIMIT,count)} de {count}</span>
                        <div style={{ display:'flex', gap:6 }}>
                          <Button variant="secondary" style={{ padding:'4px 10px',fontSize:12 }} disabled={page===1} onClick={()=>setPage(p=>p-1)}>←</Button>
                          <span style={{ padding:'4px 10px', fontFamily:'var(--mono)' }}>{page}/{totalPages}</span>
                          <Button variant="secondary" style={{ padding:'4px 10px',fontSize:12 }} disabled={page===totalPages} onClick={()=>setPage(p=>p+1)}>→</Button>
                        </div>
                      </div>
                    )}
                  </Card>

                  {/* Panel detalle */}
                  {selected && (
                    <Card style={{ padding:'18px', fontSize:13 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                        <h3 style={{ fontSize:14, fontWeight:700 }}>Detalle</h3>
                        <button onClick={()=>setSelected(null)} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--text-3)',fontSize:20,lineHeight:1 }}>×</button>
                      </div>

                      <div style={{ fontFamily:'var(--mono)', fontSize:16, fontWeight:700, color:'var(--red)', marginBottom:8 }}>{selected.numero_expediente}</div>
                      <div style={{ display:'flex', gap:8, flexWrap:'wrap', marginBottom:8 }}>
                        <Badge color={ESTADO_COLORS[selected.estado]}>{ESTADO_LABELS[selected.estado]}</Badge>
                        {selected.tipo_solicitud && (
                          <span style={{ fontSize:10, fontWeight:700, padding:'3px 10px', borderRadius:99,
                            background: selected.tipo_solicitud==='ARBITRAJE'?'#eff6ff':selected.tipo_solicitud==='JPRD'?'#f0fdf4':'#fafafa',
                            color:      selected.tipo_solicitud==='ARBITRAJE'?'var(--blue)':selected.tipo_solicitud==='JPRD'?'var(--green)':'var(--text-3)',
                          }}>{selected.tipo_solicitud}</span>
                        )}
                      </div>

                      {selected.feedback && (
                        <div style={{ marginTop:12, padding:'10px 12px', background:'#f8fafc', border:'1px solid var(--border)', borderLeft:'3px solid var(--blue)', borderRadius:'0 var(--radius) var(--radius) 0', fontSize:12 }}>
                          <p style={{ fontSize:10, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.04em', marginBottom:4 }}>Observación enviada</p>
                          <p style={{ color:'var(--text)', lineHeight:1.5 }}>{selected.feedback}</p>
                        </div>
                      )}

                      <Sep label="Demandante" />
                      <Row label="Nombre"  value={selected.dem_nombres}/>
                      <Row label="Doc"     value={`${selected.dem_tipo_doc} ${selected.dem_num_doc}`}/>
                      <Row label="Celular" value={selected.dem_celular}/>
                      <Row label="Correo"  value={selected.dem_correo}/>

                      <Sep label="Demandado" />
                      <Row label="Nombre"  value={selected.ddo_nombres}/>
                      <Row label="Doc"     value={`${selected.ddo_tipo_doc} ${selected.ddo_num_doc}`}/>
                      <Row label="Celular" value={selected.ddo_celular}/>

                      {/* Archivos */}
                      {fileUrls.length > 0 && (
                        <>
                          <Sep label="Documentos adjuntos" />
                          {fileUrls.map((url, i) => {
                            const isPdf = url.toLowerCase().includes('.pdf') || selected.archivos?.[i]?.endsWith('.pdf')
                            return (
                              <div key={i} style={{ marginBottom:6, display:'flex', gap:6 }}>
                                {isPdf && (
                                  <button onClick={() => abrirPdf(url)}
                                    style={{ flex:1, display:'flex', alignItems:'center', gap:8, padding:'8px 10px', background:'var(--red-light)', border:'1px solid var(--red-border)', borderRadius:'var(--radius)', cursor:'pointer', fontSize:12, fontWeight:500, color:'var(--red)', textAlign:'left' }}>
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                    Ver PDF {i+1}
                                  </button>
                                )}
                                <a href={url} target="_blank" rel="noreferrer"
                                  style={{ flex: isPdf ? 0 : 1, display:'flex', alignItems:'center', gap:8, padding:'8px 10px', background:'var(--blue-light)', border:'1px solid #bfdbfe', borderRadius:'var(--radius)', textDecoration:'none', fontSize:12, fontWeight:500, color:'var(--blue)', whiteSpace:'nowrap' }}>
                                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                                  {isPdf ? 'Descargar' : `Archivo ${i+1}`}
                                </a>
                              </div>
                            )
                          })}
                        </>
                      )}

                      {selected.urls_externos?.length > 0 && (
                        <>
                          <Sep label="URLs externas" />
                          {selected.urls_externos.map((u,i)=>(
                            <a key={i} href={u} target="_blank" rel="noreferrer"
                              style={{ display:'block', fontSize:12, color:'var(--blue)', padding:'2px 0', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{u}</a>
                          ))}
                        </>
                      )}

                      <div style={{ marginTop:16 }}>
                        <Button onClick={()=>abrirFeedback(selected)} style={{ width:'100%', justifyContent:'center', padding:'9px' }}>
                          Cambiar estado / Agregar observación
                        </Button>
                      </div>
                    </Card>
                  )}
                </>
              )}
            </div>
          </>
        )}

        {/* ── TAB USUARIOS ────────────────────────────────────── */}
        {tab === 'usuarios' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 380px', gap:16, alignItems:'start' }}>

            {/* Lista admins */}
            <Card style={{ overflow:'hidden' }}>
              <div style={{ padding:'14px 18px', borderBottom:'1px solid var(--border)', fontSize:14, fontWeight:700 }}>Usuarios administradores</div>
              {admLoading ? (
                <div style={{ display:'flex', justifyContent:'center', padding:'2rem' }}><Spinner size={22}/></div>
              ) : (
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr style={{ borderBottom:'1px solid var(--border)', background:'#fafafa' }}>
                      {['DNI','Nombres','Username','Rol','Estado','Acciones'].map(h=>(
                        <th key={h} style={{ padding:'10px 12px', textAlign:'left', fontSize:11, fontWeight:600, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.04em' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {admins.map((a, i) => (
                      <tr key={a.id} onClick={()=>setEditAdmin(editAdmin?.id===a.id?null:a)}
                        style={{ borderBottom:'1px solid var(--border)', background: editAdmin?.id===a.id?'var(--red-light)':i%2===0?'white':'#fafafa', cursor:'pointer', transition:'background .1s' }}
                        onMouseEnter={e=>{ if(editAdmin?.id!==a.id) e.currentTarget.style.background='#f0f0f0' }}
                        onMouseLeave={e=>{ if(editAdmin?.id!==a.id) e.currentTarget.style.background=i%2===0?'white':'#fafafa' }}>
                        <td style={{ padding:'10px 12px', fontFamily:'var(--mono)', fontSize:12 }}>{a.dni}</td>
                        <td style={{ padding:'10px 12px', fontWeight:500, maxWidth:140, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{a.nombres}</td>
                        <td style={{ padding:'10px 12px', fontFamily:'var(--mono)', fontSize:12, color:'var(--text-2)' }}>{a.username}</td>
                        <td style={{ padding:'10px 12px' }}><Badge color={a.rol==='master'?'red':'blue'}>{a.rol}</Badge></td>
                        <td style={{ padding:'10px 12px' }}><Badge color={a.activo?'green':'red'}>{a.activo?'Activo':'Inactivo'}</Badge></td>
                        <td style={{ padding:'10px 12px' }} onClick={e=>e.stopPropagation()}>
                          <div style={{ display:'flex', gap:4 }}>
                            <button onClick={()=>setEditAdmin(editAdmin?.id===a.id?null:a)}
                              style={{ fontSize:11, padding:'3px 8px', border:'1px solid var(--border)', borderRadius:4, cursor:'pointer', background:'white', color:'var(--text-2)' }}>
                              Editar
                            </button>
                            {a.rol !== 'master' && admin?.rol === 'master' && (
                              <button onClick={async()=>{ await toggleAdmin(a.id,!a.activo); loadAdmins() }}
                                style={{ fontSize:11, padding:'3px 8px', border:`1px solid ${a.activo?'#fca5a5':'#bbf7d0'}`, borderRadius:4, cursor:'pointer', background: a.activo?'#fee2e2':'var(--green-light)', color: a.activo?'#b91c1c':'var(--green)' }}>
                                {a.activo?'Desactivar':'Activar'}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>

            {/* Panel derecho: editar o crear */}
            <div style={{ display:'flex', flexDirection:'column', gap:14 }}>

              {/* Panel editar admin seleccionado */}
              {editAdmin && (
                <Card style={{ padding:'18px' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:14 }}>
                    <h3 style={{ fontSize:14, fontWeight:700 }}>Editar usuario</h3>
                    <button onClick={()=>setEditAdmin(null)} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--text-3)',fontSize:18 }}>×</button>
                  </div>

                  {/* Editar datos */}
                  <form onSubmit={async(e)=>{
                    e.preventDefault()
                    const errs = {}
                    if (!editForm.nombres.trim()) errs.nombres = 'Obligatorio'
                    if (admin?.rol==='master' && (!editForm.dni || editForm.dni.length < 8)) errs.dni = 'DNI inválido'
                    setEditErrs(errs)
                    if (Object.keys(errs).length) return
                    setEditSaving(true)
                    try {
                      const campos = { nombres: editForm.nombres }
                      if (admin?.rol === 'master') campos.dni = editForm.dni
                      await actualizarAdmin(editAdmin.id, campos)
                      toast('Usuario actualizado', 'success')
                      loadAdmins()
                      setEditAdmin(a => ({ ...a, ...campos }))
                    } catch(err){ toast(err.message,'error') }
                    finally { setEditSaving(false) }
                  }} noValidate style={{ display:'flex', flexDirection:'column', gap:10, marginBottom:14, paddingBottom:14, borderBottom:'1px solid var(--border)' }}>
                    <p style={{ fontSize:11, fontWeight:600, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.04em' }}>Datos personales</p>

                    {/* DNI — solo master puede editar */}
                    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                      <label style={{ fontSize:11, fontWeight:600, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'.04em' }}>
                        DNI {admin?.rol !== 'master' && <span style={{ color:'var(--text-3)', fontWeight:400 }}>(solo master)</span>}
                      </label>
                      {admin?.rol === 'master' ? (
                        <input value={editForm.dni} maxLength={8}
                          onChange={e=>{ setEditForm(f=>({...f,dni:e.target.value.replace(/\D/g,'')})); setEditErrs(x=>({...x,dni:null})) }}
                          style={{ padding:'8px 12px', border:`1px solid ${editErrs.dni?'var(--red)':'var(--border)'}`, borderRadius:'var(--radius)', fontSize:13, outline:'none', fontFamily:'var(--mono)' }}/>
                      ) : (
                        <div style={{ padding:'8px 12px', background:'#f4f4f5', border:'1px solid var(--border)', borderRadius:'var(--radius)', fontSize:13, fontFamily:'var(--mono)', color:'var(--text-2)' }}>{editAdmin.dni}</div>
                      )}
                      {editErrs.dni && <span style={{ fontSize:11, color:'var(--red)' }}>{editErrs.dni}</span>}
                    </div>

                    <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
                      <label style={{ fontSize:11, fontWeight:600, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'.04em' }}>Nombres completos</label>
                      <input value={editForm.nombres}
                        onChange={e=>{ setEditForm(f=>({...f,nombres:e.target.value})); setEditErrs(x=>({...x,nombres:null})) }}
                        style={{ padding:'8px 12px', border:`1px solid ${editErrs.nombres?'var(--red)':'var(--border)'}`, borderRadius:'var(--radius)', fontSize:13, outline:'none', fontFamily:'var(--font)' }}/>
                      {editErrs.nombres && <span style={{ fontSize:11, color:'var(--red)' }}>{editErrs.nombres}</span>}
                    </div>

                    <Button type="submit" loading={editSaving} style={{ width:'100%', justifyContent:'center', padding:'8px' }}>
                      Guardar datos
                    </Button>
                  </form>

                  {/* Cambiar contraseña — solo master */}
                  {admin?.rol === 'master' && editAdmin.rol !== 'master' && (
                    <form onSubmit={async(e)=>{
                      e.preventDefault()
                      const errs = {}
                      if (!pwAdminForm.nueva || pwAdminForm.nueva.length < 6) errs.nueva = 'Mínimo 6 caracteres'
                      if (pwAdminForm.nueva !== pwAdminForm.confirmar) errs.confirmar = 'No coinciden'
                      setPwAdminErrs(errs)
                      if (Object.keys(errs).length) return
                      setPwAdminSaving(true)
                      try {
                        await actualizarAdmin(editAdmin.id, { password_hash: btoa(pwAdminForm.nueva) })
                        toast('Contraseña cambiada correctamente', 'success')
                        setPwAdminForm({ nueva:'', confirmar:'' })
                      } catch(err){ toast(err.message,'error') }
                      finally { setPwAdminSaving(false) }
                    }} noValidate style={{ display:'flex', flexDirection:'column', gap:10 }}>
                      <p style={{ fontSize:11, fontWeight:600, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.04em' }}>Cambiar contraseña</p>
                      {[
                        { key:'nueva',    label:'Nueva contraseña',   ph:'Mínimo 6 caracteres' },
                        { key:'confirmar',label:'Confirmar contraseña',ph:'Repita la contraseña' },
                      ].map(f=>(
                        <div key={f.key} style={{ display:'flex', flexDirection:'column', gap:4 }}>
                          <label style={{ fontSize:11, fontWeight:600, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'.04em' }}>{f.label}</label>
                          <input type="password" placeholder={f.ph} value={pwAdminForm[f.key]}
                            onChange={e=>{ setPwAdminForm(x=>({...x,[f.key]:e.target.value})); setPwAdminErrs(x=>({...x,[f.key]:null})) }}
                            style={{ padding:'8px 12px', border:`1px solid ${pwAdminErrs[f.key]?'var(--red)':'var(--border)'}`, borderRadius:'var(--radius)', fontSize:13, outline:'none' }}/>
                          {pwAdminErrs[f.key] && <span style={{ fontSize:11, color:'var(--red)' }}>{pwAdminErrs[f.key]}</span>}
                        </div>
                      ))}
                      <Button type="submit" loading={pwAdminSaving} variant="ghost" style={{ width:'100%', justifyContent:'center', padding:'8px' }}>
                        Cambiar contraseña
                      </Button>
                    </form>
                  )}
                </Card>
              )}

              {/* Crear nuevo admin — solo master */}
              {admin?.rol === 'master' && (
                <Card style={{ padding:'18px' }}>
                  <h3 style={{ fontSize:14, fontWeight:700, marginBottom:14 }}>Nuevo usuario admin</h3>
                  <form onSubmit={handleCrearAdmin} noValidate style={{ display:'flex', flexDirection:'column', gap:10 }}>
                    {[
                      { key:'dni',      label:'DNI',              placeholder:'12345678', max:8 },
                      { key:'nombres',  label:'Nombres completos', placeholder:'Juan Pérez García' },
                      { key:'username', label:'Username',          placeholder:'jperez' },
                      { key:'password', label:'Contraseña',        placeholder:'Mínimo 6 caracteres', type:'password' },
                    ].map(f => (
                      <div key={f.key} style={{ display:'flex', flexDirection:'column', gap:4 }}>
                        <label style={{ fontSize:11, fontWeight:600, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'.04em' }}>{f.label}</label>
                        <input type={f.type||'text'} placeholder={f.placeholder} maxLength={f.max} value={newAdmin[f.key]}
                          onChange={e => { setNewAdmin(x=>({...x,[f.key]:e.target.value})); setNewErrs(x=>({...x,[f.key]:null})) }}
                          style={{ padding:'8px 12px', border:`1px solid ${newErrs[f.key]?'var(--red)':'var(--border)'}`, borderRadius:'var(--radius)', fontSize:13, outline:'none', fontFamily:f.key==='username'?'var(--mono)':'var(--font)' }}/>
                        {newErrs[f.key] && <span style={{ fontSize:11, color:'var(--red)' }}>{newErrs[f.key]}</span>}
                      </div>
                    ))}
                    <Button type="submit" loading={creating} style={{ marginTop:4, width:'100%', justifyContent:'center' }}>
                      Crear usuario
                    </Button>
                  </form>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── MODAL FEEDBACK ─────────────────────────────────── */}
      {fbModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.5)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:999, padding:'1rem' }}>
          <div style={{ background:'white', borderRadius:'var(--radius-lg)', padding:'1.5rem', width:'100%', maxWidth:460, boxShadow:'var(--shadow-lg)' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
              <h3 style={{ fontSize:15, fontWeight:700 }}>Revisar expediente</h3>
              <button onClick={()=>setFbModal(null)} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--text-3)',fontSize:22,lineHeight:1 }}>×</button>
            </div>
            <div style={{ fontFamily:'var(--mono)', fontSize:14, fontWeight:600, color:'var(--red)', marginBottom:16 }}>{fbModal.numero_expediente}</div>

            {/* Estado */}
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:11, fontWeight:600, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'.04em', display:'block', marginBottom:6 }}>Nuevo estado</label>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {ESTADOS.map(e => (
                  <button key={e} onClick={()=>setFbEstado(e)}
                    style={{ padding:'9px', border:`1.5px solid ${fbEstado===e ? (e==='rechazado'?'var(--red)':e==='atendido'?'var(--green)':'var(--blue)') : 'var(--border)'}`, borderRadius:'var(--radius)', fontSize:12, fontWeight:500, cursor:'pointer', background: fbEstado===e ? (e==='rechazado'?'var(--red-light)':e==='atendido'?'var(--green-light)':'var(--blue-light)') : 'white', color: fbEstado===e ? (e==='rechazado'?'var(--red)':e==='atendido'?'var(--green)':'var(--blue)') : 'var(--text-2)', transition:'all .15s' }}>
                    {ESTADO_LABELS[e]}
                  </button>
                ))}
              </div>
            </div>

            {/* Feedback texto */}
            <div style={{ marginBottom:16 }}>
              <label style={{ fontSize:11, fontWeight:600, color:'var(--text-2)', textTransform:'uppercase', letterSpacing:'.04em', display:'block', marginBottom:6 }}>
                Observación para el ciudadano
                {fbEstado==='rechazado' && <span style={{ color:'var(--red)' }}> *</span>}
              </label>
              <textarea
                value={fbTexto}
                onChange={e=>setFbTexto(e.target.value)}
                placeholder={fbEstado==='rechazado' ? 'Ej: Se rechaza porque no adjuntó el DNI del demandante...' : 'Ej: Su solicitud está siendo procesada. Tiempo estimado: 3 días hábiles.'}
                rows={4}
                style={{ width:'100%', padding:'10px 12px', border:'1px solid var(--border)', borderRadius:'var(--radius)', fontSize:13, outline:'none', resize:'vertical', fontFamily:'var(--font)', lineHeight:1.5 }}
              />
            </div>

            <div style={{ display:'flex', gap:10, justifyContent:'flex-end' }}>
              <Button variant="secondary" onClick={()=>setFbModal(null)}>Cancelar</Button>
              <Button loading={fbLoading} onClick={guardarFeedback}>Guardar cambios</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Sep({ label }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8, margin:'12px 0 7px' }}>
      <span style={{ fontSize:10, fontWeight:700, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.06em', whiteSpace:'nowrap' }}>{label}</span>
      <div style={{ flex:1, height:1, background:'var(--border)' }}/>
    </div>
  )
}
function Row({ label, value }) {
  return value ? (
    <div style={{ display:'flex', gap:8, padding:'3px 0', borderBottom:'1px solid #f4f4f5' }}>
      <span style={{ fontSize:11, color:'var(--text-3)', width:60, flexShrink:0 }}>{label}</span>
      <span style={{ fontSize:12, color:'var(--text)', wordBreak:'break-word' }}>{value}</span>
    </div>
  ) : null
}
