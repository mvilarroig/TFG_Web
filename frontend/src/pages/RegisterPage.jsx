import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function RegisterPage() {
  const { register }  = useAuth()
  const navigate      = useNavigate()
  const [form, setForm]       = useState({ name: '', email: '', password: '', confirm: '' })
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)

  const strength = (() => {
    const p = form.password
    if (!p) return 0
    let s = 0
    if (p.length >= 6)           s++
    if (p.length >= 10)          s++
    if (/[A-Z]/.test(p))         s++
    if (/[0-9]/.test(p))         s++
    if (/[^A-Za-z0-9]/.test(p))  s++
    return s
  })()
  const strengthLabel = ['', 'Muy débil', 'Débil', 'Moderada', 'Fuerte', 'Muy fuerte'][strength]
  const strengthColor = ['', '#ef4444', '#f97316', '#f59e0b', '#10b981', '#059669'][strength]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) return setError('Las contraseñas no coinciden')
    if (form.password.length < 6)       return setError('La contraseña debe tener al menos 6 caracteres')
    setLoading(true)
    try {
      await register(form.name, form.email, form.password)
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrarse')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">

      {/* ── Panel izquierdo ── */}
      <div className="login-left">
        <div className="login-left-bg" />
        <div className="login-left-content">

          <div className="login-logo-wrap">
            <img src="/img/logo.png" alt="MyBudget" className="login-logo" />
          </div>

          <h2 className="login-left-title">Empieza a ahorrar<br /><span>hoy mismo</span></h2>
          <p className="login-left-desc">
            Crea tu cuenta gratuita y toma el control de tu economía personal en minutos.
          </p>

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

      {/* ── Panel derecho ── */}
      <div className="login-right">
        <div className="login-form-wrap">

          <div className="login-form-top">
            <img src="/img/logo.png" alt="MyBudget" className="login-form-logo" />
            <h1 className="login-form-title">Crear cuenta gratis</h1>
            <p className="login-form-subtitle">Regístrate en menos de un minuto</p>
          </div>

          {error && (
            <div className="login-error">
              <span className="login-error-icon">⚠️</span>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">

            <div className="login-field">
              <label>Nombre completo</label>
              <div className="login-input-wrap">
                <span className="login-input-prefix">👤</span>
                <input
                  type="text"
                  placeholder="Tu nombre"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
            </div>

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
                  placeholder="Mínimo 6 caracteres"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="login-show-pass"
                  onClick={() => setShowPass(p => !p)}
                  tabIndex={-1}
                >
                  {showPass ? '🙈' : '👁️'}
                </button>
              </div>
              {form.password && (
                <div className="register-strength">
                  <div className="register-strength-bars">
                    {[1,2,3,4,5].map(i => (
                      <div
                        key={i}
                        className="register-strength-bar"
                        style={{ background: i <= strength ? strengthColor : '#e2e8f0' }}
                      />
                    ))}
                  </div>
                  <span style={{ color: strengthColor, fontSize: '.75rem', fontWeight: 700 }}>
                    {strengthLabel}
                  </span>
                </div>
              )}
            </div>

            <div className="login-field">
              <label>Confirmar contraseña</label>
              <div className="login-input-wrap">
                <span className="login-input-prefix">🔒</span>
                <input
                  type="password"
                  placeholder="Repite la contraseña"
                  value={form.confirm}
                  onChange={e => setForm({ ...form, confirm: e.target.value })}
                  required
                />
                {form.confirm && (
                  <span style={{ position: 'absolute', right: '.75rem', fontSize: '.9rem' }}>
                    {form.password === form.confirm ? '✅' : '❌'}
                  </span>
                )}
              </div>
            </div>

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading
                ? <><span className="login-spinner" /> Creando cuenta...</>
                : 'Crear cuenta gratis →'
              }
            </button>
          </form>

          <p className="login-switch">
            ¿Ya tienes cuenta?{' '}
            <Link to="/login">Inicia sesión aquí</Link>
          </p>
        </div>
      </div>

    </div>
  )
}