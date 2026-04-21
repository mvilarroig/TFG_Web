import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { userService } from '../services'

export default function ProfilePage() {
  const { user, logout } = useAuth()
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '' })
  const [passForm,    setPassForm]    = useState({ currentPassword: '', newPassword: '', confirm: '' })
  const [msg,   setMsg]   = useState('')
  const [error, setError] = useState('')

  const handleProfile = async (e) => {
    e.preventDefault()
    setMsg(''); setError('')
    try {
      await userService.updateProfile(profileForm)
      setMsg('Perfil actualizado correctamente')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar perfil')
    }
  }

  const handlePassword = async (e) => {
    e.preventDefault()
    setMsg(''); setError('')
    if (passForm.newPassword !== passForm.confirm) return setError('Las contraseñas no coinciden')
    try {
      await userService.changePassword({ currentPassword: passForm.currentPassword, newPassword: passForm.newPassword })
      setMsg('Contraseña cambiada correctamente')
      setPassForm({ currentPassword: '', newPassword: '', confirm: '' })
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar contraseña')
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Mi perfil</h1>
        <p>Gestiona tu cuenta</p>
      </div>

      {msg   && <div style={{ padding: '.75rem', background: '#dcfce7', borderRadius: '.5rem', marginBottom: '1rem', color: '#166534' }}>{msg}</div>}
      {error && <div style={{ padding: '.75rem', background: '#fee2e2', borderRadius: '.5rem', marginBottom: '1rem', color: '#991b1b' }}>{error}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <div className="card">
          <h3 style={{ marginBottom: '1.25rem', fontWeight: 600 }}>Datos personales</h3>
          <form onSubmit={handleProfile}>
            <div className="form-group">
              <label>Nombre</label>
              <input type="text" value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input type="email" value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} required />
            </div>
            <button type="submit" className="btn btn-primary">Guardar cambios</button>
          </form>
        </div>

        <div className="card">
          <h3 style={{ marginBottom: '1.25rem', fontWeight: 600 }}>Cambiar contraseña</h3>
          <form onSubmit={handlePassword}>
            <div className="form-group">
              <label>Contraseña actual</label>
              <input type="password" value={passForm.currentPassword} onChange={e => setPassForm({ ...passForm, currentPassword: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Nueva contraseña</label>
              <input type="password" value={passForm.newPassword} onChange={e => setPassForm({ ...passForm, newPassword: e.target.value })} required />
            </div>
            <div className="form-group">
              <label>Confirmar nueva contraseña</label>
              <input type="password" value={passForm.confirm} onChange={e => setPassForm({ ...passForm, confirm: e.target.value })} required />
            </div>
            <button type="submit" className="btn btn-primary">Cambiar contraseña</button>
          </form>
        </div>
      </div>

      <div className="card" style={{ marginTop: '1rem', borderColor: '#fecaca' }}>
        <h3 style={{ marginBottom: '.5rem', fontWeight: 600, color: 'var(--danger)' }}>Zona de peligro</h3>
        <p style={{ fontSize: '.9rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Esta acción eliminará tu cuenta y todos tus datos permanentemente.</p>
        <button className="btn btn-danger" onClick={() => { if(window.confirm('¿Eliminar cuenta? Esta acción no se puede deshacer.')) { userService.deleteAccount().then(logout) } }}>
          Eliminar cuenta
        </button>
      </div>
    </div>
  )
}