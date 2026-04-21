import { useState } from 'react'
import { useFixedExpenses, useCreateFixedExpense, useUpdateFixedExpense, useDeleteFixedExpense, useCategories } from '../hooks/useFinances'
import { useToast } from '../context/ToastContext'
import { formatMoney } from '../utils/format'

function FixedModal({ item, categories, onClose }) {
  const isEdit = !!item
  const create = useCreateFixedExpense()
  const update = useUpdateFixedExpense()
  const { addToast } = useToast()

  const expenseCategories = (categories || []).filter(c => c.type === 'expense')

  const [form, setForm] = useState({
    name:         item?.name        || '',
    amount:       item?.amount      || '',
    category_id:  item?.category_id || '',
    day_of_month: item?.day_of_month|| '',
    active:       item?.active !== false,
  })
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const payload = { ...form, amount: Number(form.amount), category_id: form.category_id || null, day_of_month: form.day_of_month || null }
      if (isEdit) {
        await update.mutateAsync({ id: item.id, data: payload })
        addToast('Gasto fijo actualizado', 'success')
      } else {
        await create.mutateAsync(payload)
        addToast('Gasto fijo añadido', 'success')
      }
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar')
    }
  }

  const loading = create.isPending || update.isPending

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{isEdit ? '✏️ Editar gasto fijo' : '📌 Nuevo gasto fijo'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        {error && <div className="form-error" style={{marginBottom:'1rem',padding:'.6rem',background:'#fee2e2',borderRadius:'.5rem'}}>{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Nombre del gasto</label>
            <input type="text" placeholder="ej: Hipoteca, Spotify, Luz..." value={form.name}
              onChange={e => setForm({...form, name: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Importe mensual (€)</label>
            <input type="number" step="0.01" min="0.01" placeholder="0.00" value={form.amount}
              onChange={e => setForm({...form, amount: e.target.value})} required />
          </div>
          <div className="form-group">
            <label>Categoría</label>
            <select value={form.category_id} onChange={e => setForm({...form, category_id: e.target.value})}>
              <option value="">Sin categoría</option>
              {expenseCategories.map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Día del mes en que se cobra (opcional)</label>
            <input type="number" min="1" max="31" placeholder="ej: 1, 15, 28..." value={form.day_of_month}
              onChange={e => setForm({...form, day_of_month: e.target.value})} />
          </div>
          {isEdit && (
            <div className="form-group">
              <label style={{display:'flex',alignItems:'center',gap:'.5rem',cursor:'pointer'}}>
                <input type="checkbox" checked={form.active} onChange={e => setForm({...form, active: e.target.checked})} />
                Gasto activo
              </label>
            </div>
          )}
          <div style={{display:'flex',gap:'.75rem',justifyContent:'flex-end',marginTop:'1.25rem'}}>
            <button type="button" className="btn btn-outline" onClick={onClose}>Cancelar</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Añadir'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function FixedExpensesPage() {
  const { data: items = [], isLoading } = useFixedExpenses()
  const { data: categories = [] }       = useCategories()
  const deleteItem  = useDeleteFixedExpense()
  const { addToast } = useToast()
  const [modalOpen, setModalOpen] = useState(false)
  const [editItem,  setEditItem]  = useState(null)

  const active   = items.filter(i => i.active)
  const inactive = items.filter(i => !i.active)
  const totalMonthly = active.reduce((s, i) => s + Number(i.amount), 0)
  const totalYearly  = totalMonthly * 12

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este gasto fijo?')) {
      await deleteItem.mutateAsync(id)
      addToast('Gasto fijo eliminado', 'success')
    }
  }

  const openNew  = ()     => { setEditItem(null); setModalOpen(true) }
  const openEdit = (item) => { setEditItem(item); setModalOpen(true) }

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>📌 Gastos fijos</h1>
          <p>Hipoteca, alquiler, suscripciones y otros compromisos mensuales</p>
        </div>
        <button className="btn btn-primary" onClick={openNew}>+ Añadir gasto fijo</button>
      </div>

      {/* Resumen */}
      <div className="fixed-summary-grid">
        <div className="fixed-summary-card fixed-s-active">
          <div className="fixed-s-icon">📌</div>
          <div>
            <div className="fixed-s-label">Gastos activos</div>
            <div className="fixed-s-value">{active.length}</div>
          </div>
        </div>
        <div className="fixed-summary-card fixed-s-monthly">
          <div className="fixed-s-icon">📅</div>
          <div>
            <div className="fixed-s-label">Compromiso mensual</div>
            <div className="fixed-s-value">{formatMoney(totalMonthly)} €</div>
          </div>
        </div>
        <div className="fixed-summary-card fixed-s-yearly">
          <div className="fixed-s-icon">📆</div>
          <div>
            <div className="fixed-s-label">Compromiso anual</div>
            <div className="fixed-s-value">{formatMoney(totalYearly)} €</div>
          </div>
        </div>
      </div>

      {/* Lista activos */}
      {isLoading ? (
        <div style={{padding:'2rem',textAlign:'center',color:'var(--text-muted)'}}>Cargando...</div>
      ) : active.length === 0 && inactive.length === 0 ? (
        <div className="card" style={{textAlign:'center',padding:'3rem',color:'var(--text-muted)'}}>
          <div style={{fontSize:'3rem',marginBottom:'1rem'}}>📌</div>
          <p>Aún no tienes gastos fijos. ¡Añade tu primera suscripción o cuota!</p>
          <button className="btn btn-primary" style={{marginTop:'1rem'}} onClick={openNew}>+ Añadir gasto fijo</button>
        </div>
      ) : (
        <>
          <div className="card" style={{padding:0,overflow:'hidden',marginBottom:'1.25rem'}}>
            <div style={{padding:'1rem 1.5rem',borderBottom:'1px solid var(--border-light)',fontWeight:700,fontSize:'.85rem',color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'.06em'}}>
              ✅ Activos ({active.length})
            </div>
            <table className="movements-table">
              <thead>
                <tr>
                  <th>Nombre</th>
                  <th>Categoría</th>
                  <th>Día cobro</th>
                  <th>Importe</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {active.map(item => (
                  <tr key={item.id}>
                    <td style={{fontWeight:600}}>{item.name}</td>
                    <td>{item.category_icon} {item.category_name || '—'}</td>
                    <td style={{color:'var(--text-muted)'}}>
                      {item.day_of_month ? `Día ${item.day_of_month}` : '—'}
                    </td>
                    <td className="amount-expense">-{Number(item.amount).toFixed(2)} €</td>
                    <td>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(item)} style={{marginRight:'.4rem'}}>✏️</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>🗑️</button>
                    </td>
                  </tr>
                ))}
                <tr style={{background:'var(--surface-2)'}}>
                  <td colSpan={3} style={{fontWeight:700,fontSize:'.875rem'}}>Total mensual</td>
                  <td className="amount-expense" style={{fontWeight:800,fontSize:'1rem'}}>-{totalMonthly.toFixed(2)} €</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>

          {inactive.length > 0 && (
            <div className="card" style={{padding:0,overflow:'hidden'}}>
              <div style={{padding:'1rem 1.5rem',borderBottom:'1px solid var(--border-light)',fontWeight:700,fontSize:'.85rem',color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'.06em'}}>
                ⏸️ Inactivos ({inactive.length})
              </div>
              <table className="movements-table">
                <thead>
                  <tr><th>Nombre</th><th>Categoría</th><th>Importe</th><th></th></tr>
                </thead>
                <tbody>
                  {inactive.map(item => (
                    <tr key={item.id} style={{opacity:.55}}>
                      <td style={{fontWeight:600,textDecoration:'line-through'}}>{item.name}</td>
                      <td>{item.category_icon} {item.category_name || '—'}</td>
                      <td>-{Number(item.amount).toFixed(2)} €</td>
                      <td>
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(item)} style={{marginRight:'.4rem'}}>✏️</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(item.id)}>🗑️</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {modalOpen && (
        <FixedModal item={editItem} categories={categories} onClose={() => { setModalOpen(false); setEditItem(null) }} />
      )}
    </div>
  )
}
