import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { Card, Spinner } from '../../components/ui'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, LineChart, Line, CartesianGrid,
} from 'recharts'
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns'
import { es } from 'date-fns/locale'

const ESTADO_COLORS = { pendiente:'#d97706', en_revision:'#2563eb', atendido:'#16a34a', rechazado:'#C41E3A' }
const ESTADO_LABELS = { pendiente:'Pendiente', en_revision:'En revisión', atendido:'Atendido', rechazado:'Rechazado' }
const TIPO_COLORS   = { ARBITRAJE:'#2563eb', JPRD:'#16a34a', OTRAS:'#6b7280' }
const TIPO_LABELS   = { ARBITRAJE:'Arbitraje', JPRD:'JPRD', OTRAS:'Otras' }

async function fetchStats() {
  const { data, error } = await supabase
    .from('mesa_partes')
    .select('estado, tipo_solicitud, created_at')
  if (error) throw error
  return data || []
}

export default function Dashboard() {
  const [rows,    setRows]    = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchStats()
      .then(setRows)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div style={{ display:'flex', justifyContent:'center', padding:'4rem' }}>
      <Spinner size={32} />
    </div>
  )

  // ── Totales ──────────────────────────────────────────────
  const total       = rows.length
  const pendientes  = rows.filter(r => r.estado === 'pendiente').length
  const enRevision  = rows.filter(r => r.estado === 'en_revision').length
  const atendidos   = rows.filter(r => r.estado === 'atendido').length
  const rechazados  = rows.filter(r => r.estado === 'rechazado').length

  // ── Por estado (pie) ─────────────────────────────────────
  const porEstado = Object.entries(ESTADO_LABELS).map(([key, label]) => ({
    name:  label,
    value: rows.filter(r => r.estado === key).length,
    color: ESTADO_COLORS[key],
  })).filter(d => d.value > 0)

  // ── Por tipo (bar) ───────────────────────────────────────
  const porTipo = Object.entries(TIPO_LABELS).map(([key, label]) => ({
    name:  label,
    total: rows.filter(r => r.tipo_solicitud === key).length,
    color: TIPO_COLORS[key],
  }))

  // ── Por mes (últimos 6 meses, line) ──────────────────────
  const meses = Array.from({ length: 6 }, (_, i) => {
    const d     = subMonths(new Date(), 5 - i)
    const inicio = startOfMonth(d)
    const fin    = endOfMonth(d)
    return {
      mes:   format(d, 'MMM', { locale: es }),
      total: rows.filter(r => {
        const f = new Date(r.created_at)
        return f >= inicio && f <= fin
      }).length,
    }
  })

  // ── Por tipo × mes (últimos 3 meses detalle) ─────────────
  const meses3 = Array.from({ length: 3 }, (_, i) => {
    const d      = subMonths(new Date(), 2 - i)
    const inicio = startOfMonth(d)
    const fin    = endOfMonth(d)
    const mes    = format(d, 'MMM yy', { locale: es })
    const obj    = { mes }
    Object.keys(TIPO_LABELS).forEach(tipo => {
      obj[tipo] = rows.filter(r => {
        const f = new Date(r.created_at)
        return r.tipo_solicitud === tipo && f >= inicio && f <= fin
      }).length
    })
    return obj
  })

  const tasaAtencion = total > 0 ? Math.round((atendidos / total) * 100) : 0

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

      {/* ── KPIs ─────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:12 }}>
        {[
          { label:'Total',       value:total,      color:'var(--text)',  bg:'white' },
          { label:'Pendientes',  value:pendientes,  color:'var(--amber)', bg:'var(--amber-light)' },
          { label:'En revisión', value:enRevision,  color:'var(--blue)',  bg:'var(--blue-light)' },
          { label:'Atendidos',   value:atendidos,   color:'var(--green)', bg:'var(--green-light)' },
          { label:'Rechazados',  value:rechazados,  color:'var(--red)',   bg:'var(--red-light)' },
        ].map(k => (
          <Card key={k.label} style={{ padding:'14px 16px', background:k.bg }}>
            <p style={{ fontSize:10, fontWeight:600, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:6 }}>{k.label}</p>
            <p style={{ fontSize:28, fontWeight:700, color:k.color, fontFamily:'var(--mono)', lineHeight:1 }}>{k.value}</p>
          </Card>
        ))}
      </div>

      {/* ── Tasa de atención ─────────────────────────────── */}
      <Card style={{ padding:'16px 20px', display:'flex', alignItems:'center', gap:20 }}>
        <div style={{ flex:1 }}>
          <p style={{ fontSize:11, fontWeight:600, color:'var(--text-3)', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>Tasa de atención</p>
          <p style={{ fontSize:32, fontWeight:700, color:'var(--green)', fontFamily:'var(--mono)' }}>{tasaAtencion}%</p>
          <p style={{ fontSize:12, color:'var(--text-3)', marginTop:2 }}>{atendidos} de {total} expedientes resueltos</p>
        </div>
        <div style={{ flex:2, height:12, background:'#f4f4f5', borderRadius:99, overflow:'hidden' }}>
          <div style={{ height:'100%', width:`${tasaAtencion}%`, background:'var(--green)', borderRadius:99, transition:'width .6s ease' }} />
        </div>
      </Card>

      {/* ── Fila 2: Tendencia mensual + Por tipo ─────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1.4fr 1fr', gap:16 }}>

        {/* Tendencia mensual */}
        <Card style={{ padding:'18px 20px' }}>
          <ChartTitle>Expedientes por mes (últimos 6 meses)</ChartTitle>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={meses} margin={{ top:4, right:8, bottom:0, left:-20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize:11, fill:'var(--text-3)' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize:11, fill:'var(--text-3)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize:12, borderRadius:8, border:'1px solid var(--border)' }} />
              <Line type="monotone" dataKey="total" stroke="#C41E3A" strokeWidth={2.5} dot={{ r:4, fill:'#C41E3A' }} activeDot={{ r:6 }} name="Expedientes" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        {/* Por tipo */}
        <Card style={{ padding:'18px 20px' }}>
          <ChartTitle>Por tipo de solicitud</ChartTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={porTipo} margin={{ top:4, right:8, bottom:0, left:-20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="name" tick={{ fontSize:11, fill:'var(--text-3)' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize:11, fill:'var(--text-3)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize:12, borderRadius:8, border:'1px solid var(--border)' }} />
              <Bar dataKey="total" radius={[4,4,0,0]} name="Total">
                {porTipo.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ── Fila 3: Estado (pie) + Por tipo × mes ────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1.4fr', gap:16 }}>

        {/* Distribución por estado */}
        <Card style={{ padding:'18px 20px' }}>
          <ChartTitle>Distribución por estado</ChartTitle>
          {porEstado.length === 0 ? (
            <p style={{ fontSize:13, color:'var(--text-3)', textAlign:'center', padding:'2rem' }}>Sin datos</p>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={porEstado} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                  {porEstado.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize:12, borderRadius:8, border:'1px solid var(--border)' }} formatter={(v, n) => [v, n]} />
                <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Por tipo × mes */}
        <Card style={{ padding:'18px 20px' }}>
          <ChartTitle>Tipos de solicitud — últimos 3 meses</ChartTitle>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={meses3} margin={{ top:4, right:8, bottom:0, left:-20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize:11, fill:'var(--text-3)' }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize:11, fill:'var(--text-3)' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ fontSize:12, borderRadius:8, border:'1px solid var(--border)' }} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize:11 }} />
              {Object.entries(TIPO_LABELS).map(([key, label]) => (
                <Bar key={key} dataKey={key} name={label} fill={TIPO_COLORS[key]} radius={[3,3,0,0]} stackId="tipo" />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </Card>
      </div>

    </div>
  )
}

function ChartTitle({ children }) {
  return <p style={{ fontSize:12, fontWeight:600, color:'var(--text-2)', marginBottom:14 }}>{children}</p>
}
