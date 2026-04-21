import { useState } from 'react'
import { Link } from 'react-router-dom'
import { authService } from '../services'

export default function ForgotPasswordPage() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null)
  const [error,   setError]   = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await authService.forgotPassword(email)
      setResult(data)
    } catch (err) {
      setError(err.response?.data?.error || 'Error al procesar la solicitud')
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
          <h2 className="login-left-title">Recupera tu<br /><span>contraseña</span></h2>
          <p className="login-left-desc">Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.</p>
        </div>
      </div>

      <div className="login-right">
        <div className="login-form-wrap">
          <div className="login-form-top">
            <img src="/img/logo.png" alt="MyBudget" className="login-form-logo" />
            <h1 className="login-form-title">¿Olvidaste tu contraseña?</h1>
            <p className="login-form-subtitle">Te enviamos un enlace de recuperación</p>
          </div>

          {error && (
            <div className="login-error"><span className="login-error-icon">⚠️</span>{error}</div>
          )}

          {result ? (
            <div style={{textAlign:'center',padding:'1.5rem 0'}}>
              <div style={{fontSize:'3.5rem',marginBottom:'1rem'}}>📬</div>
              <p style={{fontWeight:700,fontSize:'1.1rem',marginBottom:'.75rem',color:'var(--text)'}}>¡Revisa tu bandeja de entrada!</p>
              <p style={{fontSize:'.9rem',color:'var(--text-muted)',lineHeight:1.65,marginBottom:'1.5rem'}}>
                Si ese email está registrado en MyBudget, recibirás en breve un enlace para restablecer tu contraseña.<br/>
                <span style={{fontSize:'.8rem'}}>Revisa también la carpeta de spam por si acaso.</span>
              </p>
              <Link to="/login" className="btn btn-outline" style={{width:'100%',justifyContent:'center'}}>
                ← Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="login-form">
              <div className="login-field">
                <label>Correo electrónico</label>
                <div className="login-input-wrap">
                  <span className="login-input-prefix">✉️</span>
                  <input type="email" placeholder="tu@email.com" value={email}
                    onChange={e => setEmail(e.target.value)} required autoComplete="email" />
                </div>
              </div>
              <button type="submit" className="login-submit" disabled={loading}>
                {loading ? <><span className="login-spinner" /> Enviando...</> : 'Enviar enlace de recuperación'}
              </button>
            </form>
          )}

          <p className="login-switch">
            <Link to="/login">← Volver al inicio de sesión</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
