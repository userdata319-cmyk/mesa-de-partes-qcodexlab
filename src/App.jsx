import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './components/ui'
import LoginCliente     from './pages/cliente/LoginCliente'
import RegistroCliente  from './pages/cliente/RegistroCliente'
import DashboardCliente from './pages/cliente/DashboardCliente'
import EditarPerfil     from './pages/cliente/EditarPerfil'
import OlvidePassword   from './pages/cliente/OlvidePassword'
import ResetPassword    from './pages/cliente/ResetPassword'
import LoginAdmin       from './pages/admin/LoginAdmin'
import AdminPage        from './pages/admin/AdminPage'
import FormPage         from './pages/FormPage'
import './styles/global.css'

function RequireCliente({ children }) {
  const { cliente, loading } = useAuth()
  const loc = useLocation()
  if (loading) return null
  if (!cliente) return <Navigate to="/login" state={{ from: loc }} replace />
  return children
}

function RequireAdmin({ children }) {
  const { admin, loading } = useAuth()
  const loc = useLocation()
  if (loading) return null
  if (!admin) return <Navigate to="/admin/login" state={{ from: loc }} replace />
  return children
}

function AppRoutes() {
  return (
    <Routes>
      {/* Públicas */}
      <Route path="/login"            element={<LoginCliente />} />
      <Route path="/registro"         element={<RegistroCliente />} />
      <Route path="/olvide-password"  element={<OlvidePassword />} />
      <Route path="/reset-password"   element={<ResetPassword />} />

      {/* Cliente autenticado */}
      <Route path="/dashboard"        element={<RequireCliente><DashboardCliente /></RequireCliente>} />
      <Route path="/nueva-solicitud"  element={<RequireCliente><FormPage /></RequireCliente>} />
      <Route path="/perfil"           element={<RequireCliente><EditarPerfil /></RequireCliente>} />

      {/* Admin */}
      <Route path="/admin/login"      element={<LoginAdmin />} />
      <Route path="/admin"            element={<RequireAdmin><AdminPage /></RequireAdmin>} />

      {/* Redirect */}
      <Route path="/"                 element={<Navigate to="/login" replace />} />
      <Route path="*"                 element={<Navigate to="/login" replace />} />
    </Routes>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
