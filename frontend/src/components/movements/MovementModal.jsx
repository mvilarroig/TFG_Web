import { useState, useEffect } from 'react'
import { useCreateMovement, useUpdateMovement } from '../../hooks/useFinances'
import { useToast } from '../../context/ToastContext'

export default function MovementModal({ item, categories, onClose }) {
  const isEdit = !!item
  const createMovement = useCreateMovement()
  const updateMovement = useUpdateMovement()
  const { addToast }   = useToast()

  const [form, setForm] = useState({
    type:        'expense',
    amount:      '',
    description: '',
    date:        new Date().toISOString().split('T')[0],
    category_id: '',
  })
  const [error, setError] = useState('')

  useEffect(() => {
    if (item) {
      setForm({
        type:        item.type,
        amount:      item.amount,
        description: item.description || '',
        date:        item.date?.split('T')[0] || '',
        category_id: item.category_id || '',
      })
    }
  }, [item])

  const filtered = categories.filter(c => c.type === form.type)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    try {
      const payload = {
        ...form,
        amount:      Number(form.amount),
        category_id: form.category_id || null,
      }
      if (isEdit) {
        await updateMovement.mutateAsync({ id: item.id, data: payload })
        addToast('Movimiento actualizado correctamente', 'success')
      } else {
        await createMovement.mutateAsync(payload)
        addToast('Movimiento añadido correctamente', 'success')
      }
      onClose()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar')
    }
  }

  const loading = createMovement.isPending || updateMovement.isPending

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{isEdit ? 'Editar movimiento' : 'Nuevo movimiento'}</h2>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>

        {error && (
          <div className="form-error" style={{ marginBottom: '1rem', padding: '.6rem', background: '#fee2e2', borderRadius: '.5rem' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Tipo</label>
            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value, category_id: '' })}>
              <option value="expense">Gasto</option>
              <option value="income">Ingreso</option>
            </select>
          </div>

          <div className="form-group">
            <label>Importe (€)</label>
            <input
              type="number" step="0.01" min="0.01" placeholder="0.00"
              value={form.amount}
              onChange={e => setForm({ ...form, amount: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Descripción</label>
            <input
              type="text" placeholder="Descripción opcional"
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
            />
          </div>

          <div className="form-group">
            <label>Fecha</label>
            <input
              type="date" value={form.date}
              onChange={e => setForm({ ...form, date: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Categoría</label>
            <select value={form.category_id} onChange={e => setForm({ ...form, category_id: e.target.value })}>
              <option value="">Sin categoría</option>
              {filtered.map(c => (
                <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', gap: '.75rem', justifyContent: 'flex-end', marginTop: '1.25rem' }}>
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