import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function LoginPage() {
  const { login }     = useAuth()
  const navigate      = useNavigate()
  const [form, setForm]       = useState({ email: '', password: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Credenciales incorrectas')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">

      {/* ── Panel izquierdo ───────────────────────────────── */}
      <div className="login-left">
        <div className="login-left-bg" />

        <div className="login-left-content">
          {/* Logo */}
          <div className="login-logo-wrap">
            <img src="/img/logo.png" alt="MyBudget" className="login-logo" />
          </div>

          <h2 className="login-left-title">Controla tus<br /><span>finanzas</span></h2>
          <p className="login-left-desc">
            Gestiona tus ingresos y gastos de forma sencilla, visual e intuitiva.
          </p>

          {/* Features */}
          <div className="login-features">
            <div className="login-feat">
              <div className="login-feat-icon">
                <img src="/img/ckeck.png" alt="" />
              </div>
              <div className="login-feat-text">
                <strong>Registro de movimientos</strong>
                <span>Añade ingresos y gastos en segundos</span>
              </div>
            </div>
            <div className="login-feat">
              <div className="login-feat-icon">
                <img src="/img/grafico.png" alt="" />
              </div>
              <div className="login-feat-text">
                <strong>Gráficos interactivos</strong>
                <span>Visualiza tu economía de un vistazo</span>
              </div>
            </div>
            <div className="login-feat">
              <div className="login-feat-icon">
                <img src="/img/1827235.png" alt="" />
              </div>
              <div className="login-feat-text">
                <strong>Resúmenes mensuales</strong>
                <span>Informes detallados de cada mes</span>
              </div>
            </div>
            <div className="login-feat">
              <div className="login-feat-icon">
                <img src="/img/980496.png" alt="" />
              </div>
              <div className="login-feat-text">
                <strong>100% seguro y privado</strong>
                <span>Tus datos solo los ves tú</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Panel derecho ─────────────────────────────────── */}
      <div className="login-right">
        <div className="login-form-wrap">

          <div className="login-form-top">
            <img src="/img/logo.png" alt="MyBudget" className="login-form-logo" />
            <h1 className="login-form-title">¡Bienvenido de nuevo!</h1>
            <p className="login-form-subtitle">Inicia sesión en tu cuenta</p>
          </div>

          {error && (
            <div className="login-error">
              <span className="login-error-icon">⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-field">
              <label>Correo electrónico</label>
              <div className="login-input-wrap">
                <span className="login-input-prefix">✉️</span>
                <input
                  type="email"
                  placeholder="tu@email.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="login-field">
              <label>Contraseña</label>
              <div className="login-input-wrap">
                <span className="login-input-prefix">🔑</span>
                <input
                  type={showPass ? 'text' : 'password'}
                  placeholder="Tu contraseña"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="login-show-pass"
                  onClick={() => setShowPass(p => !p)}
                  tabIndex={-1}
                  title={showPass ? 'Ocultar' : 'Mostrar'}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading
                ? <><span className="login-spinner" /> Entrando...</>
                : 'Iniciar sesión'
              }
            </button>
          </form>

          <p className="login-switch" style={{marginBottom:'.4rem'}}>
            <Link to="/forgot-password" style={{color:'var(--text-muted)',fontSize:'.85rem',fontWeight:500}}>
              ¿Olvidaste tu contraseña?
            </Link>
          </p>
          <p className="login-switch">
            ¿No tienes cuenta?{' '}
            <Link to="/register">Regístrate gratis</Link>
          </p>
        </div>
      </div>

    </div>
  )
}
