import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider, useAuth } from './context/AuthContext'
import { ToastProvider } from './context/ToastContext'

import LoginPage           from './pages/LoginPage'
import RegisterPage        from './pages/RegisterPage'
import ForgotPasswordPage  from './pages/ForgotPasswordPage'
import ResetPasswordPage   from './pages/ResetPasswordPage'
import DashboardPage       from './pages/DashboardPage'
import MovementsPage       from './pages/MovementsPage'
import FixedExpensesPage   from './pages/FixedExpensesPage'
import SummaryPage         from './pages/SummaryPage'
import SavingsPage         from './pages/SavingsPage'
import ProfilePage         from './pages/ProfilePage'
import Layout              from './components/common/Layout'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 1000 * 60 } },
})

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading">Cargando...</div>
  return user ? children : <Navigate to="/login" replace />
}

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <div className="loading">Cargando...</div>
  return user ? <Navigate to="/dashboard" replace /> : children
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login"           element={<PublicRoute><LoginPage /></PublicRoute>} />
            <Route path="/register"        element={<PublicRoute><RegisterPage /></PublicRoute>} />
            <Route path="/forgot-password" element={<PublicRoute><ForgotPasswordPage /></PublicRoute>} />
            <Route path="/reset-password"  element={<ResetPasswordPage />} />

            <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
              <Route index              element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard"   element={<DashboardPage />} />
              <Route path="movements"   element={<MovementsPage />} />
              <Route path="fixed"       element={<FixedExpensesPage />} />
              <Route path="summary"     element={<SummaryPage />} />
              <Route path="savings"     element={<SavingsPage />} />
              <Route path="profile"     element={<ProfilePage />} />
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
      </ToastProvider>
    </QueryClientProvider>
  )
}

export default App
