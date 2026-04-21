import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { authService } from '../services'

export default function ResetPasswordPage() {
  const [searchParams]    = useSearchParams()
  const navigate          = useNavigate()
  const token             = searchParams.get('token') || ''

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showPass,  setShowPass]  = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [success,   setSuccess]   = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) return setError('Las contraseñas no coinciden')
    if (password.length < 6)  return setError('La contraseña debe tener al menos 6 caracteres')
    setLoading(true)
    setError('')
    try {
      await authService.resetPassword(token, password)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2500)
    } catch (err) {
      setError(err.response?.data?.error || 'El enlace es inválido o ha expirado')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-left">
        <div className="login-left-bg" />
        <div className="login-left-content">
          <div className="login-logo-wrap">
            <img src="/img/logo.png" alt="MyBudget" className="login-logo" />
          </div>
          <h2 className="login-left-title">Nueva<br /><span>contraseña</span></h2>
          <p className="login-left-desc">Elige una contraseña segura para proteger tu cuenta.</p>
        </div>
      </div>

      <div className="login-right">
        <div className="login-form-wrap">
          <div className="login-form-top">
            <img src="/img/logo.png" alt="MyBudget" className="login-form-logo" />
            <h1 className="login-form-title">Restablecer contraseña</h1>
            <p className="login-form-subtitle">Introduce tu nueva contraseña</p>
          </div>

          {error && (
            <div className="login-error"><span className="login-error-icon">⚠️</span>{error}</div>
          )}

          {success ? (
            <div style={{textAlign:'center',padding:'2rem 0'}}>
              <div style={{fontSize:'3rem',marginBottom:'1rem'}}>🎉</div>
              <p style={{fontWeight:700,color:'var(--text)',marginBottom:'.5rem'}}>¡Contraseña actualizada!</p>
              <p style={{fontSize:'.875rem',color:'var(--text-muted)'}}>Redirigiendo al inicio de sesión...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="login-form">
              <div className="login-field">
                <label>Nueva contraseña</label>
                <div className="login-input-wrap">
                  <span className="login-input-prefix">🔑</span>
                  <input type={showPass ? 'text' : 'password'} placeholder="Mínimo 6 caracteres"
                    value={password} onChange={e => setPassword(e.target.value)} required />
                  <button type="button" className="login-show-pass" onClick={() => setShowPass(p => !p)} tabIndex={-1}>
                    {showPass ? '🙈' : '👁️'}
                  </button>
                </div>
              </div>
              <div className="login-field">
                <label>Confirmar contraseña</label>
                <div className="login-input-wrap">
                  <span className="login-input-prefix">🔒</span>
                  <input type="password" placeholder="Repite la contraseña"
                    value={confirm} onChange={e => setConfirm(e.target.value)} required />
                  {confirm && (
                    <span style={{position:'absolute',right:'.75rem',fontSize:'.9rem'}}>
                      {password === confirm ? '✅' : '❌'}
                    </span>
                  )}
                </div>
              </div>
              <button type="submit" className="login-submit" disabled={loading || !token}>
                {loading ? <><span className="login-spinner" /> Guardando...</> : 'Guardar nueva contraseña'}
              </button>
            </form>
          )}

          <p className="login-switch"><Link to="/login">← Volver al inicio de sesión</Link></p>
        </div>
      </div>
    </div>
  )
}
