import { useState, useEffect, useRef } from 'react'
import { Outlet, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const navItems = [
  { path: '/dashboard', label: 'Inicio',       icon: '🏠' },
  { path: '/movements', label: 'Movimientos',  icon: '💸' },
  { path: '/fixed',     label: 'Gastos fijos', icon: '📌' },
  { path: '/savings',   label: 'Mis huchas',   icon: '🐷' },
  { path: '/summary',   label: 'Resumen',      icon: '📊' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const [dark, setDark]           = useState(() => localStorage.getItem('mb_theme') === 'dark')
  const [userMenuOpen, setUserMenu] = useState(false)
  const userMenuRef = useRef(null)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light')
    localStorage.setItem('mb_theme', dark ? 'dark' : 'light')
  }, [dark])

  // Cierra el menú al hacer clic fuera
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  return (
    <div className="layout">

      {/* ── Sidebar desktop ── */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <img src="/img/logo.png" alt="MyBudget" />
        </div>

        <div className="sidebar-nav-label">Navegación</div>

        {navItems.map(item => (
          <button
            key={item.path}
            className={`sidebar-link ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}
          >
            <span className="icon">{item.icon}</span>
            <span className="sidebar-label">{item.label}</span>
          </button>
        ))}

        <div className="sidebar-bottom">
          <div className="sidebar-user-wrap" ref={userMenuRef}>

            {/* Menú flotante */}
            {userMenuOpen && (
              <div className="user-menu">
                <div className="user-menu-header">
                  <div className="user-menu-avatar">{user?.name?.[0]?.toUpperCase()}</div>
                  <div>
                    <div className="user-menu-name">{user?.name}</div>
                    <div className="user-menu-email">{user?.email}</div>
                  </div>
                </div>
                <div className="user-menu-divider" />
                <button className="user-menu-item" onClick={() => { navigate('/profile'); setUserMenu(false) }}>
                  <span>👤</span> Mi perfil
                </button>
                <button className="user-menu-item" onClick={() => setDark(d => !d)}>
                  <span>{dark ? '☀️' : '🌙'}</span> {dark ? 'Modo claro' : 'Modo oscuro'}
                </button>
                <div className="user-menu-divider" />
                <button className="user-menu-item user-menu-logout" onClick={logout}>
                  <span>🚪</span> Cerrar sesión
                </button>
              </div>
            )}

            {/* Botón usuario */}
            <button
              className={`sidebar-user-btn ${userMenuOpen ? 'open' : ''}`}
              onClick={() => setUserMenu(v => !v)}
            >
              <div className="sidebar-avatar">{user?.name?.[0]?.toUpperCase()}</div>
              <div className="sidebar-user-info">
                <div className="sidebar-user-name">{user?.name}</div>
                <div className="sidebar-user-email">{user?.email}</div>
              </div>
              <span className="sidebar-user-chevron">{userMenuOpen ? '▲' : '▼'}</span>
            </button>
          </div>
        </div>
      </aside>

      {/* ── Contenido principal ── */}
      <main className="main-content">
        <Outlet />
      </main>

      {/* ── Navbar móvil ── */}
      <nav className="mobile-nav">
        <div className="mobile-nav-items">
          {navItems.map(item => (
            <button
              key={item.path}
              className={`mobile-nav-btn ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => navigate(item.path)}
            >
              <span className="icon">{item.icon}</span>
              {item.label}
            </button>
          ))}
          <button className="mobile-nav-btn" onClick={logout}>
            <span className="icon">🚪</span>
            Salir
          </button>
        </div>
      </nav>

    </div>
  )
}
