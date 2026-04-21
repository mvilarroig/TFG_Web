import { useState } from 'react'
import {
  useSavingsGoals, useCreateSavingsGoal, useUpdateSavingsGoal,
  useDepositSavingsGoal, useDeleteSavingsGoal
} from '../hooks/useFinances'

import { formatMoney } from '../utils/format'

const PRESET_ICONS  = ['🎯','✈️','🏖️','🚗','🏠','💻','📱','🎓','💍','🐶','🎸','⚽','🧳','🏋️','🎁','🏕️','🛋️','💊','🌍','🚀']
const PRESET_COLORS = ['#3b82f6','#10b981','#f59e0b','#ef4444','#8b5cf6','#06b6d4','#f97316','#ec4899','#14b8a6','#84cc16']

function GoalModal({ goal, onClose, onCreate, onUpdate }) {
  const editing = !!goal
  const [name,   setName]   = useState(goal?.name   || '')
  const [icon,   setIcon]   = useState(goal?.icon   || '🎯')
  const [color,  setColor]  = useState(goal?.color  || '#3b82f6')
  const [target, setTarget] = useState(goal?.target_amount || '')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setSaving(true)
    const data = { name: name.trim(), icon, color, target_amount: parseFloat(target) || 0 }
    editing ? await onUpdate(data) : await onCreate(data)
    onClose()
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{maxWidth:440}}>
        <div className="modal-header">
          <h2>{editing ? '✏️ Editar hucha' : '➕ Nueva hucha'}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{display:'flex',flexDirection:'column',gap:'1rem',padding:'1.25rem'}}>

          {/* Nombre */}
          <div className="form-group">
            <label className="form-label">Nombre</label>
            <input className="form-input" placeholder="Ej: Viaje a Roma, Coche nuevo…"
              value={name} onChange={e => setName(e.target.value)} required autoFocus />
          </div>

          {/* Icono */}
          <div className="form-group">
            <label className="form-label">Icono</label>
            <div style={{display:'flex',flexWrap:'wrap',gap:'.4rem'}}>
              {PRESET_ICONS.map(ic => (
                <button key={ic} type="button"
                  onClick={() => setIcon(ic)}
                  style={{
                    fontSize:'1.3rem', padding:'.3rem .45rem', border:'2px solid',
                    borderColor: icon === ic ? color : 'var(--border-light)',
                    borderRadius:'var(--radius-sm)', background: icon === ic ? color + '22' : 'transparent',
                    cursor:'pointer', transition:'all .15s'
                  }}>{ic}</button>
              ))}
            </div>
          </div>

          {/* Color */}
          <div className="form-group">
            <label className="form-label">Color</label>
            <div style={{display:'flex',gap:'.5rem',flexWrap:'wrap'}}>
              {PRESET_COLORS.map(c => (
                <button key={c} type="button" onClick={() => setColor(c)}
                  style={{
                    width:28, height:28, borderRadius:'50%', background:c, border:'3px solid',
                    borderColor: color === c ? '#1e293b' : 'transparent', cursor:'pointer'
                  }} />
              ))}
            </div>
          </div>

          {/* Objetivo */}
          <div className="form-group">
            <label className="form-label">Objetivo (€) <span style={{fontWeight:400,color:'var(--text-muted)'}}>— opcional</span></label>
            <input className="form-input" type="number" min="0" step="0.01"
              placeholder="Ej: 1500" value={target} onChange={e => setTarget(e.target.value)} />
          </div>

          <div style={{display:'flex',gap:'.75rem',justifyContent:'flex-end'}}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? 'Guardando…' : editing ? 'Guardar cambios' : 'Crear hucha'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function DepositModal({ goal, onClose, onDeposit }) {
  const [amount,  setAmount]  = useState('')
  const [mode,    setMode]    = useState('add') // 'add' | 'withdraw'
  const [saving,  setSaving]  = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    const val = parseFloat(amount)
    if (!val || val <= 0) return
    setSaving(true)
    await onDeposit(mode === 'add' ? val : -val)
    onClose()
  }

  const pct = goal.target_amount > 0
    ? Math.min(100, (Number(goal.saved_amount) / Number(goal.target_amount)) * 100)
    : null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={e => e.stopPropagation()} style={{maxWidth:380}}>
        <div className="modal-header">
          <h2><span style={{marginRight:'.4rem'}}>{goal.icon}</span>{goal.name}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div style={{padding:'1.25rem', display:'flex', flexDirection:'column', gap:'1.1rem'}}>

          {/* Estado actual */}
          <div style={{textAlign:'center', padding:'1rem', background:'var(--surface-2)', borderRadius:'var(--radius)'}}>
            <div style={{fontSize:'2rem', fontWeight:800, color: goal.color}}>
              {formatMoney(Number(goal.saved_amount))} €
            </div>
            <div style={{fontSize:'.8rem', color:'var(--text-muted)'}}>
              {goal.target_amount > 0
                ? `ahorrados de ${formatMoney(Number(goal.target_amount))} € (${pct.toFixed(0)}%)`
                : 'ahorrados'}
            </div>
            {pct !== null && (
              <div style={{marginTop:'.6rem', height:6, background:'var(--border-light)', borderRadius:99}}>
                <div style={{height:'100%', width:`${pct}%`, background: goal.color, borderRadius:99, transition:'width .5s'}} />
              </div>
            )}
          </div>

          {/* Modo */}
          <div style={{display:'flex', gap:'.5rem'}}>
            <button type="button"
              className={mode === 'add' ? 'btn btn-primary' : 'btn btn-outline'}
              style={{flex:1}} onClick={() => setMode('add')}>
              ➕ Aportar
            </button>
            <button type="button"
              className={mode === 'withdraw' ? 'btn btn-primary' : 'btn btn-outline'}
              style={{flex:1, ...(mode === 'withdraw' ? {background:'#dc2626'} : {})}}
              onClick={() => setMode('withdraw')}>
              ➖ Retirar
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{display:'flex', gap:'.75rem'}}>
            <input className="form-input" type="number" min="0.01" step="0.01"
              placeholder="Importe en €" value={amount}
              onChange={e => setAmount(e.target.value)} autoFocus required
              style={{flex:1}} />
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? '…' : 'OK'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default function SavingsPage() {
  const { data: goals = [], isLoading } = useSavingsGoals()
  const createGoal  = useCreateSavingsGoal()
  const updateGoal  = useUpdateSavingsGoal()
  const depositGoal = useDepositSavingsGoal()
  const deleteGoal  = useDeleteSavingsGoal()

  const [showCreate,  setShowCreate]  = useState(false)
  const [editGoal,    setEditGoal]    = useState(null)
  const [depositGoalState, setDepositGoal] = useState(null)

  const totalSaved  = goals.reduce((s, g) => s + Number(g.saved_amount),  0)
  const totalTarget = goals.reduce((s, g) => s + Number(g.target_amount), 0)

  return (
    <div className="savings-page">

      {/* Header */}
      <div className="savings-header">
        <div>
          <h1 className="savings-title">🐷 Mis huchas</h1>
          <p className="savings-subtitle">Guarda dinero para tus objetivos</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          + Nueva hucha
        </button>
      </div>

      {/* Resumen global */}
      {goals.length > 0 && (
        <div className="savings-summary-bar">
          <div className="savings-sum-item">
            <span className="savings-sum-label">Total ahorrado</span>
            <span className="savings-sum-value" style={{color:'#10b981'}}>
              {formatMoney(totalSaved)} €
            </span>
          </div>
          <div className="savings-sum-sep" />
          <div className="savings-sum-item">
            <span className="savings-sum-label">Objetivos totales</span>
            <span className="savings-sum-value">{formatMoney(totalTarget)} €</span>
          </div>
          <div className="savings-sum-sep" />
          <div className="savings-sum-item">
            <span className="savings-sum-label">Huchas activas</span>
            <span className="savings-sum-value">{goals.length}</span>
          </div>
          {totalTarget > 0 && (
            <>
              <div className="savings-sum-sep" />
              <div className="savings-sum-item">
                <span className="savings-sum-label">Progreso global</span>
                <span className="savings-sum-value" style={{color:'#3b82f6'}}>
                  {Math.min(100, (totalSaved / totalTarget * 100)).toFixed(0)}%
                </span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Grid de huchas */}
      {isLoading ? (
        <div style={{textAlign:'center',padding:'3rem',color:'var(--text-muted)'}}>Cargando…</div>
      ) : goals.length === 0 ? (
        <div className="savings-empty">
          <div style={{fontSize:'4rem', marginBottom:'1rem'}}>🐷</div>
          <h2>¡Crea tu primera hucha!</h2>
          <p>Guarda dinero para tus metas: un viaje, un coche, emergencias… Tú decides.</p>
          <button className="btn btn-primary btn-lg" onClick={() => setShowCreate(true)}>
            + Crear hucha
          </button>
        </div>
      ) : (
        <div className="savings-grid">
          {goals.map(goal => {
            const saved  = Number(goal.saved_amount)
            const target = Number(goal.target_amount)
            const pct    = target > 0 ? Math.min(100, (saved / target) * 100) : null
            const done   = pct !== null && pct >= 100
            return (
              <div key={goal.id} className="savings-card">
                {/* Top */}
                <div className="savings-card-top">
                  <div className="savings-card-icon" style={{background: goal.color + '22', color: goal.color}}>
                    {goal.icon}
                  </div>
                  <div className="savings-card-actions">
                    <button className="savings-action-btn" title="Editar" onClick={() => setEditGoal(goal)}>✏️</button>
                    <button className="savings-action-btn" title="Eliminar"
                      onClick={() => { if (window.confirm(`¿Eliminar "${goal.name}"?`)) deleteGoal.mutate(goal.id) }}>🗑️</button>
                  </div>
                </div>

                {/* Nombre */}
                <div className="savings-card-name">{goal.name}</div>

                {/* Importe */}
                <div className="savings-card-amount" style={{color: goal.color}}>
                  {formatMoney(saved)} €
                </div>

                {/* Objetivo + barra */}
                {target > 0 ? (
                  <>
                    <div className="savings-card-target">
                      {done ? '🎉 ¡Meta alcanzada!' : `de ${formatMoney(target)} € objetivo`}
                    </div>
                    <div className="savings-card-track">
                      <div className="savings-card-fill"
                        style={{width:`${pct}%`, background: done ? '#10b981' : goal.color}} />
                    </div>
                    <div className="savings-card-pct" style={{color: done ? '#10b981' : goal.color}}>
                      {pct.toFixed(0)}%
                      {!done && target > saved && (
                        <span style={{color:'var(--text-muted)',fontWeight:400}}>
                          {' '}· faltan {formatMoney(target - saved)} €
                        </span>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="savings-card-target">Sin objetivo fijado</div>
                )}

                {/* Botón aportar */}
                <button className="btn btn-primary savings-deposit-btn"
                  style={{background: goal.color, boxShadow:`0 2px 8px ${goal.color}44`}}
                  onClick={() => setDepositGoal(goal)}>
                  + Aportar / retirar
                </button>
              </div>
            )
          })}
        </div>
      )}

      {/* Modales */}
      {showCreate && (
        <GoalModal
          onClose={() => setShowCreate(false)}
          onCreate={data => createGoal.mutateAsync(data)}
        />
      )}
      {editGoal && (
        <GoalModal
          goal={editGoal}
          onClose={() => setEditGoal(null)}
          onUpdate={data => updateGoal.mutateAsync({ id: editGoal.id, data })}
        />
      )}
      {depositGoalState && (
        <DepositModal
          goal={depositGoalState}
          onClose={() => setDepositGoal(null)}
          onDeposit={amount => depositGoal.mutateAsync({ id: depositGoalState.id, amount })}
        />
      )}
    </div>
  )
}
