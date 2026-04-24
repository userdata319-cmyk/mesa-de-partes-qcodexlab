import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [cliente, setCliente] = useState(null)
  const [admin,   setAdmin]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const savedCliente = localStorage.getItem('mp_cliente')
    const savedAdmin   = localStorage.getItem('mp_admin')
    if (savedCliente) setCliente(JSON.parse(savedCliente))
    if (savedAdmin)   setAdmin(JSON.parse(savedAdmin))
    setLoading(false)
  }, [])

  // ── CLIENTE ──────────────────────────────────────────────
  async function loginCliente(documento, password) {
    const { data, error } = await supabase
      .from('clientes').select('*')
      .eq('documento', documento)
      .eq('password_hash', btoa(password))
      .single()
    if (error || !data) throw new Error('DNI/RUC o contraseña incorrectos')
    setCliente(data)
    localStorage.setItem('mp_cliente', JSON.stringify(data))
    return data
  }

  async function registrarCliente(form) {
    const { data: exists } = await supabase.from('clientes').select('id').eq('documento', form.documento).single()
    if (exists) throw new Error('Ya existe una cuenta con ese DNI/RUC')
    const { data, error } = await supabase.from('clientes').insert({
      tipo_persona:  form.tipo_persona,
      tipo_doc:      form.tipo_doc,
      documento:     form.documento,
      nombres:       form.nombres,
      celular:       form.celular,
      direccion:     form.direccion,
      correo:        form.correo || null,
      password_hash: btoa(form.password),
    }).select().single()
    if (error) throw new Error('Error al registrar: ' + error.message)
    setCliente(data)
    localStorage.setItem('mp_cliente', JSON.stringify(data))
    return data
  }

  async function actualizarCliente(campos) {
    const { data, error } = await supabase
      .from('clientes').update(campos).eq('id', cliente.id).select().single()
    if (error) throw new Error('Error al actualizar: ' + error.message)
    const updated = { ...cliente, ...data }
    setCliente(updated)
    localStorage.setItem('mp_cliente', JSON.stringify(updated))
    return updated
  }

  // Olvidé contraseña — guarda token en tabla password_resets
  async function solicitarResetPassword(correo) {
    const { data: cli } = await supabase.from('clientes').select('id').eq('correo', correo).single()
    if (!cli) throw new Error('No existe una cuenta con ese correo')
    const token   = crypto.randomUUID()
    const expira  = new Date(Date.now() + 1000 * 60 * 60).toISOString() // 1 hora
    await supabase.from('password_resets').insert({ cliente_id: cli.id, token, expira_at: expira, usado: false })
    // Enviar email via Supabase Edge Function o simplemente retornar el link
    // En desarrollo: retorna el link directamente
    const link = `${window.location.origin}/reset-password?token=${token}`
    return { link, token }
  }

  async function resetPassword(token, nuevaPassword) {
    const { data: reset, error } = await supabase
      .from('password_resets')
      .select('*, clientes(id)')
      .eq('token', token)
      .eq('usado', false)
      .single()
    if (error || !reset) throw new Error('El enlace es inválido o ya fue usado')
    if (new Date(reset.expira_at) < new Date()) throw new Error('El enlace ha expirado')
    // Actualizar contraseña
    const { error: updErr } = await supabase.from('clientes')
      .update({ password_hash: btoa(nuevaPassword) }).eq('id', reset.clientes.id)
    if (updErr) throw new Error('Error al actualizar contraseña')
    // Marcar token como usado
    await supabase.from('password_resets').update({ usado: true }).eq('id', reset.id)
  }

  function logoutCliente() {
    setCliente(null)
    localStorage.removeItem('mp_cliente')
  }

  // ── ADMIN ─────────────────────────────────────────────────
  async function loginAdmin(username, password) {
    const { data, error } = await supabase.from('admins').select('*')
      .eq('username', username).eq('password_hash', btoa(password)).eq('activo', true).single()
    if (error || !data) throw new Error('Usuario o contraseña incorrectos')
    setAdmin(data)
    localStorage.setItem('mp_admin', JSON.stringify(data))
    return data
  }

  async function actualizarAdmin(id, campos) {
    const { data, error } = await supabase.from('admins').update(campos).eq('id', id).select().single()
    if (error) throw new Error('Error al actualizar: ' + error.message)
    // Si se editó el admin logueado, actualizar sesión
    if (admin?.id === id) {
      const updated = { ...admin, ...data }
      setAdmin(updated)
      localStorage.setItem('mp_admin', JSON.stringify(updated))
    }
    return data
  }

  function logoutAdmin() {
    setAdmin(null)
    localStorage.removeItem('mp_admin')
  }

  return (
    <AuthContext.Provider value={{
      cliente, admin, loading,
      loginCliente, registrarCliente, logoutCliente,
      actualizarCliente, solicitarResetPassword, resetPassword,
      loginAdmin, logoutAdmin, actualizarAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
