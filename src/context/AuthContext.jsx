import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [cliente,  setCliente]  = useState(null)
  const [admin,    setAdmin]    = useState(null)
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    // Restaurar sesión desde localStorage
    const savedCliente = localStorage.getItem('mp_cliente')
    const savedAdmin   = localStorage.getItem('mp_admin')
    if (savedCliente) setCliente(JSON.parse(savedCliente))
    if (savedAdmin)   setAdmin(JSON.parse(savedAdmin))
    setLoading(false)
  }, [])

  // ── CLIENTE ─────────────────────────────────────────
  async function loginCliente(documento, password) {
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('documento', documento)
      .eq('password_hash', btoa(password)) // simple base64, reemplazar con bcrypt en prod
      .single()
    if (error || !data) throw new Error('DNI/RUC o contraseña incorrectos')
    setCliente(data)
    localStorage.setItem('mp_cliente', JSON.stringify(data))
    return data
  }

  async function registrarCliente(form) {
    // Verificar que no exista
    const { data: exists } = await supabase
      .from('clientes')
      .select('id')
      .eq('documento', form.documento)
      .single()
    if (exists) throw new Error('Ya existe una cuenta con ese DNI/RUC')

    const { data, error } = await supabase
      .from('clientes')
      .insert({
        tipo_persona:  form.tipo_persona,
        tipo_doc:      form.tipo_doc,
        documento:     form.documento,
        nombres:       form.nombres,
        celular:       form.celular,
        direccion:     form.direccion,
        correo:        form.correo || null,
        password_hash: btoa(form.password),
      })
      .select()
      .single()
    if (error) throw new Error('Error al registrar: ' + error.message)
    setCliente(data)
    localStorage.setItem('mp_cliente', JSON.stringify(data))
    return data
  }

  function logoutCliente() {
    setCliente(null)
    localStorage.removeItem('mp_cliente')
  }

  // ── ADMIN ────────────────────────────────────────────
  async function loginAdmin(username, password) {
    const { data, error } = await supabase
      .from('admins')
      .select('*')
      .eq('username', username)
      .eq('password_hash', btoa(password))
      .eq('activo', true)
      .single()
    if (error || !data) throw new Error('Usuario o contraseña incorrectos')
    setAdmin(data)
    localStorage.setItem('mp_admin', JSON.stringify(data))
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
      loginAdmin, logoutAdmin,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() { return useContext(AuthContext) }
