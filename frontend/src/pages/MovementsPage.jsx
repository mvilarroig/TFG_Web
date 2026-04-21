import { useState } from 'react'
import { useMovements, useDeleteMovement, useUpdateMovement, useCategories } from '../hooks/useFinances'
import { movementService } from '../services'
import { useToast } from '../context/ToastContext'
import MovementModal from '../components/movements/MovementModal'
import { formatMoney } from '../utils/format'
import ImportCSVModal from '../components/common/ImportCSVModal'

export default function MovementsPage() {
  const [filters, setFilters] = useState({ page: 1, limit: 20 })
  const [modalOpen, setModalOpen]   = useState(false)
  const [editItem,  setEditItem]    = useState(null)
  const [exporting, setExporting]   = useState(false)
  const [showImport, setShowImport] = useState(false)

  const { data, isLoading }   = useMovements(filters)
  const { data: categories }  = useCategories()
  const deleteMovement        = useDeleteMovement()
  const updateMovement        = useUpdateMovement()
  const { addToast }          = useToast()

  const handleEdit = (item) => { setEditItem(item); setModalOpen(true) }
  const handleNew  = ()     => { setEditItem(null);  setModalOpen(true) }
  const handleClose= ()     => { setModalOpen(false); setEditItem(null) }

  const handleCategoryChange = async (m, categoryId) => {
    try {
      await updateMovement.mutateAsync({
        id: m.id,
        data: { type: m.type, amount: m.amount, date: m.date.split('T')[0], description: m.description, category_id: categoryId || null }
      })
    } catch {
      addToast('Error al cambiar la categoría', 'error')
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar este movimiento?')) {
      try {
        await deleteMovement.mutateAsync(id)
        addToast('Movimiento eliminado correctamente', 'success')
      } catch {
        addToast('Error al eliminar el movimiento', 'error')
      }
    }
  }

  const handleExport = async () => {
    setExporting(true)
    try {
      const allData = await movementService.getAll({ ...filters, limit: 10000, page: 1 })
      const rows = allData.data || []
      if (!rows.length) { addToast('No hay movimientos para exportar', 'info'); return }

      const header = ['Fecha', 'Descripcion', 'Categoria', 'Tipo', 'Importe (EUR)']
      const csvRows = [
        header.join(';'),
        ...rows.map(m => [
          new Date(m.date).toLocaleDateString('es-ES'),
          `"${(m.description || '').replace(/"/g, '""')}"`,
          m.category_name || 'Sin categoria',
          m.type === 'income' ? 'Ingreso' : 'Gasto',
          Number(m.amount).toFixed(2).replace('.', ','),
        ].join(';')),
      ]

      const blob = new Blob(['\uFEFF' + csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' })
      const url  = URL.createObjectURL(blob)
      const a    = document.createElement('a')
      a.href     = url
      a.download = `movimientos_${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      URL.revokeObjectURL(url)
      addToast(`${rows.length} movimientos exportados a CSV`, 'success')
    } catch {
      addToast('Error al exportar los datos', 'error')
    } finally {
      setExporting(false)
    }
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>💸 Movimientos</h1>
          <p>Gestiona tus ingresos y gastos</p>
        </div>
        <div style={{ display: 'flex', gap: '.6rem' }}>
          <button className="btn btn-outline btn-sm" onClick={handleExport} disabled={exporting}>
            {exporting ? '⏳ Exportando...' : '⬇️ Exportar CSV'}
          </button>
          <button className="btn btn-outline btn-sm" onClick={() => setShowImport(true)}>
            ⬆️ Importar CSV
          </button>
          <button className="btn btn-primary" onClick={handleNew}>+ Nuevo</button>
        </div>
      </div>

      {/* Filtros */}
      <div className="filters">
        <div className="form-group">
          <label>Tipo</label>
          <select value={filters.type || ''} onChange={e => setFilters({ ...filters, type: e.target.value || undefined, page: 1 })}>
            <option value="">Todos</option>
            <option value="income">Ingresos</option>
            <option value="expense">Gastos</option>
          </select>
        </div>
        <div className="form-group">
          <label>Categoría</label>
          <select value={filters.category_id || ''} onChange={e => setFilters({ ...filters, category_id: e.target.value || undefined, page: 1 })}>
            <option value="">Todas</option>
            {(categories || []).map(c => <option key={c.id} value={c.id}>{c.icon} {c.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Desde</label>
          <input type="date" value={filters.from || ''} onChange={e => setFilters({ ...filters, from: e.target.value || undefined, page: 1 })} />
        </div>
        <div className="form-group">
          <label>Hasta</label>
          <input type="date" value={filters.to || ''} onChange={e => setFilters({ ...filters, to: e.target.value || undefined, page: 1 })} />
        </div>
        <div className="form-group">
          <label>Buscar</label>
          <input type="text" placeholder="Descripción o categoría…" value={filters.search || ''}
            onChange={e => setFilters({ ...filters, search: e.target.value || undefined, page: 1 })} />
        </div>
        <button className="btn btn-outline btn-sm" onClick={() => setFilters({ page: 1, limit: 20 })}>Limpiar</button>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando...</div>
        ) : data?.data?.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            No hay movimientos. ¡Añade el primero!
          </div>
        ) : (
          <table className="movements-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Descripción</th>
                <th>Categoría</th>
                <th>Tipo</th>
                <th>Importe</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {(data?.data || []).map(m => (
                <tr key={m.id}>
                  <td>{new Date(m.date).toLocaleDateString('es-ES')}</td>
                  <td>{m.description || '—'}</td>
                  <td>
                    <select
                      className="cat-inline-select"
                      value={m.category_id || ''}
                      onChange={e => handleCategoryChange(m, e.target.value ? Number(e.target.value) : null)}
                    >
                      <option value="">Sin categoría</option>
                      {(categories || []).map(c => (
                        <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                      ))}
                    </select>
                  </td>
                  <td><span className={`badge badge-${m.type}`}>{m.type === 'income' ? 'Ingreso' : 'Gasto'}</span></td>
                  <td className={`amount-${m.type}`}>
                    {m.type === 'income' ? '+' : '-'}{formatMoney(Number(m.amount))} €
                  </td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => handleEdit(m)} style={{ marginRight: '.4rem' }}>✏️</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(m.id)}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Paginación */}
      {data?.totalPages > 1 && (
        <div style={{ display: 'flex', gap: '.5rem', justifyContent: 'center', marginTop: '1rem' }}>
          <button className="btn btn-outline btn-sm" disabled={filters.page <= 1} onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))}>← Anterior</button>
          <span style={{ padding: '.4rem .8rem', fontSize: '.85rem', color: 'var(--text-muted)' }}>
            {filters.page} / {data.totalPages}
          </span>
          <button className="btn btn-outline btn-sm" disabled={filters.page >= data.totalPages} onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))}>Siguiente →</button>
        </div>
      )}

      {modalOpen && (
        <MovementModal
          item={editItem}
          categories={categories || []}
          onClose={handleClose}
        />
      )}

      {showImport && (
        <ImportCSVModal onClose={() => setShowImport(false)} categories={categories || []} />
      )}
    </div>
  )
}
