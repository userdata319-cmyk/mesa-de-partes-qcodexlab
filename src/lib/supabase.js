import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://TU-PROYECTO.supabase.co'
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_KEY || 'TU-ANON-KEY'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// ── NÚMERO CORRELATIVO ───────────────────────────────────────────────────────
// Llama a la función SQL que genera el siguiente correlativo: MP-2026-00001
export async function obtenerNumeroExpediente() {
  const { data, error } = await supabase.rpc('siguiente_numero_expediente')
  if (error) throw new Error('Error al generar número de expediente: ' + error.message)
  return data // ej: "MP-2026-00001"
}

// ── STORAGE ──────────────────────────────────────────────────────────────────
export async function subirArchivo(expediente, index, file) {
  const ext      = file.name.split('.').pop()
  const fileName = `${expediente}/${index}_${Date.now()}.${ext}`
  const { data, error } = await supabase.storage
    .from('anexos')
    .upload(fileName, file, { upsert: false })
  if (error) throw error
  return data.path
}

export async function getArchivoUrl(path) {
  const { data } = await supabase.storage
    .from('anexos')
    .createSignedUrl(path, 3600)
  return data?.signedUrl || null
}

// ── SOLICITUDES ──────────────────────────────────────────────────────────────
export async function insertarSolicitud(payload) {
  const { data, error } = await supabase
    .from('mesa_partes')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return data
}

export async function getExpedientesCliente(clienteId) {
  const { data, error } = await supabase
    .from('mesa_partes')
    .select('*')
    .eq('cliente_id', clienteId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

// ── ADMIN: SOLICITUDES ───────────────────────────────────────────────────────
export async function getSolicitudes({ page = 1, limit = 15, search = '', estado = '', tipo = '' } = {}) {
  let query = supabase
    .from('mesa_partes')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)

  if (search) {
    query = query.or(
      `numero_expediente.ilike.%${search}%,dem_nombres.ilike.%${search}%,ddo_nombres.ilike.%${search}%`
    )
  }
  if (estado) query = query.eq('estado', estado)
  if (tipo)   query = query.eq('tipo_solicitud', tipo)

  const { data, error, count } = await query
  if (error) throw error
  return { data, count }
}

export async function updateEstado(id, estado, feedback = null) {
  const payload = { estado, updated_at: new Date().toISOString() }
  if (feedback !== null) payload.feedback = feedback
  const { error } = await supabase.from('mesa_partes').update(payload).eq('id', id)
  if (error) throw error
}

// ── ADMIN: USUARIOS ──────────────────────────────────────────────────────────
export async function getAdmins() {
  const { data, error } = await supabase
    .from('admins')
    .select('id, dni, nombres, username, activo, created_at, rol')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data || []
}

export async function crearAdmin(form) {
  const { data: exists } = await supabase.from('admins').select('id').eq('username', form.username).single()
  if (exists) throw new Error('El username ya está en uso')
  const { error } = await supabase.from('admins').insert({
    dni: form.dni, nombres: form.nombres, username: form.username,
    password_hash: btoa(form.password), rol: 'admin', activo: true,
  })
  if (error) throw new Error('Error al crear usuario: ' + error.message)
}

export async function toggleAdmin(id, activo) {
  const { error } = await supabase.from('admins').update({ activo }).eq('id', id)
  if (error) throw error
}
