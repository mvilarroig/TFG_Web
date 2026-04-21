import { useState, useRef } from 'react'
import Papa from 'papaparse'
import { movementService } from '../../services'
import { useQueryClient } from '@tanstack/react-query'

// ── Bancos conocidos: detección automática de columnas ──────────────────────
const BANK_PROFILES = [
  {
    name: 'ING',
    detect: h => h.some(c => c.toLowerCase().includes('importe') && c.includes('€')),
    dateCol: h => h.find(c => c.toLowerCase() === 'fecha'),
    descCol: h => h.find(c => c.toLowerCase() === 'descripción') || h.find(c => c.toLowerCase().includes('desc')),
    amtCol:  h => h.find(c => c.toLowerCase().includes('importe')),
  },
  {
    name: 'Revolut',
    detect: h => (h.some(c => c.toLowerCase() === 'currency') && h.some(c => c.toLowerCase() === 'amount'))
              || (h.some(c => c === 'Divisa') && h.some(c => c === 'Importe') && h.some(c => c === 'Descripción')),
    dateCol: h => h.find(c => c === 'Fecha de inicio') || h.find(c => c.toLowerCase() === 'started date') || h.find(c => c.toLowerCase() === 'date'),
    descCol: h => h.find(c => c === 'Descripción') || h.find(c => c.toLowerCase() === 'description'),
    amtCol:  h => h.find(c => c === 'Importe') || h.find(c => c.toLowerCase() === 'amount'),
  },
  {
    name: 'BBVA',
    detect: h => h.some(c => c.toLowerCase().includes('concepto')) && h.some(c => c.toLowerCase().includes('disponible')),
    dateCol: h => h.find(c => c.toLowerCase().includes('fecha')),
    descCol: h => h.find(c => c.toLowerCase().includes('concepto')),
    amtCol:  h => h.find(c => c.toLowerCase().includes('importe')),
  },
  {
    name: 'Santander',
    detect: h => h.some(c => c.toLowerCase().includes('concepto')) && h.some(c => c.toLowerCase().includes('fecha valor')),
    dateCol: h => h.find(c => c.toLowerCase().includes('fecha')),
    descCol: h => h.find(c => c.toLowerCase().includes('concepto')),
    amtCol:  h => h.find(c => c.toLowerCase().includes('importe')),
  },
]

function detectBank(headers) {
  return BANK_PROFILES.find(p => p.detect(headers)) || null
}

function guessColumns(headers) {
  const h = headers
  const lower = h.map(c => c.toLowerCase())
  return {
    date: h[lower.findIndex(c => c.includes('fecha') || c.includes('date'))] || '',
    desc: h[lower.findIndex(c => c.includes('concepto') || c.includes('desc') || c.includes('detail'))] || '',
    amt:  h[lower.findIndex(c => c.includes('importe') || c.includes('amount') || c === 'cargo' || c === 'abono')] || '',
  }
}

function parseDate(raw) {
  if (!raw) return null
  const clean = raw.trim()
  // DD/MM/YYYY o DD-MM-YYYY
  let m = clean.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (m) return `${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`
  // YYYY-MM-DD
  m = clean.match(/^(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/)
  if (m) return `${m[1]}-${m[2].padStart(2,'0')}-${m[3].padStart(2,'0')}`
  return null
}

function parseAmount(raw) {
  if (!raw && raw !== 0) return null
  let s = String(raw).replace(/[€$\s]/g, '').trim()
  if (!s) return null

  const hasDot   = s.includes('.')
  const hasComma = s.includes(',')

  if (hasDot && hasComma) {
    // Ambos separadores: el último es el decimal
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      // Formato europeo: 1.234,56
      s = s.replace(/\./g, '').replace(',', '.')
    } else {
      // Formato anglosajón: 1,234.56
      s = s.replace(/,/g, '')
    }
  } else if (hasComma) {
    const parts = s.split(',')
    // Si hay exactamente 1 coma y ≤2 dígitos tras ella → separador decimal
    if (parts.length === 2 && parts[1].length <= 2) {
      s = s.replace(',', '.')
    } else {
      s = s.replace(/,/g, '') // coma de miles
    }
  } else if (hasDot) {
    const parts = s.split('.')
    // Si hay exactamente 1 punto y ≤2 dígitos tras él → separador decimal
    if (parts.length === 2 && parts[1].length <= 2) {
      // ya está en formato correcto
    } else {
      s = s.replace(/\./g, '') // punto de miles
    }
  }

  const n = parseFloat(s)
  return isNaN(n) ? null : n
}

// Intenta asignar una categoría según la descripción
function guessCategory(description, categories) {
  if (!description || !categories?.length) return null
  const desc = description.toLowerCase()
  // Busca si el nombre de la categoría aparece en la descripción
  const match = categories.find(c => {
    const words = c.name.toLowerCase().split(/\s+/)
    return words.some(w => w.length >= 3 && desc.includes(w))
  })
  return match?.id || null
}

// ── Pasos ────────────────────────────────────────────────────────────────────
const STEPS = ['Subir archivo', 'Mapear columnas', 'Revisar e importar']

export default function ImportCSVModal({ onClose, categories = [] }) {
  const qc = useQueryClient()
  const fileRef = useRef()
  const [step,    setStep]    = useState(0)
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)

  // Step 0 – archivo
  const [rawRows,   setRawRows]   = useState([])
  const [headers,   setHeaders]   = useState([])
  const [bankName,  setBankName]  = useState('')
  const [fileName,  setFileName]  = useState('')

  // Step 1 – mapeo
  const [colDate, setColDate] = useState('')
  const [colDesc, setColDesc] = useState('')
  const [colAmt,  setColAmt]  = useState('')
  const [colType, setColType] = useState('') // columna separada de tipo, opcional
  const [signIncome, setSignIncome] = useState('positive') // positive | negative

  // Step 2 – preview
  const [preview,  setPreview]  = useState([])
  const [imported, setImported] = useState(null)

  // ── Paso 0: parsear el archivo ────────────────────────────────────────────
  const handleFile = (file) => {
    if (!file) return
    setFileName(file.name)
    setError('')
    Papa.parse(file, {
      header: true, skipEmptyLines: true, encoding: 'UTF-8',
      complete: ({ data, meta }) => {
        if (!data.length) { setError('El archivo está vacío o no tiene datos.'); return }
        const hdrs = meta.fields || []
        setHeaders(hdrs)
        setRawRows(data)

        const bank = detectBank(hdrs)
        if (bank) {
          setBankName(bank.name)
          setColDate(bank.dateCol(hdrs) || '')
          setColDesc(bank.descCol(hdrs) || '')
          setColAmt(bank.amtCol(hdrs)  || '')
        } else {
          setBankName('')
          const guessed = guessColumns(hdrs)
          setColDate(guessed.date)
          setColDesc(guessed.desc)
          setColAmt(guessed.amt)
        }
        setStep(1)
      },
      error: () => setError('No se pudo leer el archivo. Comprueba que es un CSV válido.'),
    })
  }

  // ── Paso 1 → 2: construir preview ────────────────────────────────────────
  const buildPreview = () => {
    if (!colDate || !colAmt) { setError('Selecciona al menos la columna de fecha e importe.'); return }
    setError('')
    const rows = rawRows.map((row, i) => {
      const rawDate = row[colDate] || ''
      const rawAmt  = row[colAmt]  || ''
      const desc    = colDesc ? (row[colDesc] || '') : ''
      const date    = parseDate(rawDate)
      const amount  = parseAmount(rawAmt)
      if (!date || amount === null || amount === 0) return null
      const type = amount > 0
        ? (signIncome === 'positive' ? 'income' : 'expense')
        : (signIncome === 'positive' ? 'expense' : 'income')
      const cleanDesc = desc.trim().slice(0, 200)
      const category_id = guessCategory(cleanDesc, categories)
      return { _idx: i, date, description: cleanDesc, amount: Math.abs(amount), type, category_id, _raw: rawAmt }
    }).filter(Boolean)

    if (!rows.length) { setError('No se encontraron movimientos válidos con las columnas seleccionadas.'); return }
    setPreview(rows)
    setStep(2)
  }

  // ── Paso 2: importar ──────────────────────────────────────────────────────
  const handleImport = async () => {
    setLoading(true)
    setError('')
    try {
      const toSend = preview.filter(r => !r._skip)
        .map(({ date, description, amount, type, category_id }) => ({ date, description, amount, type, category_id: category_id || null }))
      const res = await movementService.import(toSend)
      setImported(res.inserted)
      qc.invalidateQueries({ queryKey: ['movements'] })
      qc.invalidateQueries({ queryKey: ['summary'] })
    } catch (e) {
      setError(e.response?.data?.error || 'Error al importar. Inténtalo de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const toggleSkip = (idx) => {
    setPreview(p => p.map((r, i) => i === idx ? { ...r, _skip: !r._skip } : r))
  }

  const toggleType = (idx) => {
    setPreview(p => p.map((r, i) => i === idx ? { ...r, type: r.type === 'income' ? 'expense' : 'income' } : r))
  }

  const setCategory = (idx, catId) => {
    setPreview(p => p.map((r, i) => i === idx ? { ...r, category_id: catId ? Number(catId) : null } : r))
  }

  const autoCategorized = preview.filter(r => r.category_id).length

  const toImport = preview.filter(r => !r._skip).length

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box import-modal-box" onClick={e => e.stopPropagation()}>

        {/* Cabecera */}
        <div className="modal-header">
          <div>
            <h2>📂 Importar movimientos desde CSV</h2>
            <div className="import-steps">
              {STEPS.map((s, i) => (
                <span key={i} className={`import-step${i === step ? ' active' : ''}${i < step ? ' done' : ''}`}>
                  {i < step ? '✓' : i + 1} {s}
                </span>
              ))}
            </div>
          </div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="import-body">

          {error && <div className="import-error">⚠️ {error}</div>}

          {/* ── PASO 0: subir archivo ── */}
          {step === 0 && (
            <div className="import-upload-zone">
              <input ref={fileRef} type="file" accept=".csv,.txt" style={{display:'none'}}
                onChange={e => handleFile(e.target.files[0])} />
              <div
                className="import-drop-area"
                onClick={() => fileRef.current.click()}
                onDragOver={e => { e.preventDefault(); e.currentTarget.classList.add('dragging') }}
                onDragLeave={e => e.currentTarget.classList.remove('dragging')}
                onDrop={e => { e.preventDefault(); e.currentTarget.classList.remove('dragging'); handleFile(e.dataTransfer.files[0]) }}
              >
                <div className="import-drop-icon">⬆️</div>
                <div className="import-drop-title">Arrastra tu CSV aquí o haz clic para elegir</div>
                <div className="import-drop-sub">.csv · .txt &nbsp;·&nbsp; Máx. 500 movimientos</div>
              </div>

              <div className="import-banks-hint">
                <div className="import-banks-title">¿Cómo exportar tu extracto?</div>
                <div className="import-bank-cards">
                  {[
                    { color: '#004A9F', label: 'BBVA',           path: 'Mi BBVA web → Mis cuentas → Movimientos → Exportar' },
                    { color: '#EC0000', label: 'Santander',      path: 'Mi Santander → Cuentas → Extracto → CSV' },
                    { color: '#007BC4', label: 'CaixaBank',      path: 'CaixaBankNow → Cuentas → Descargar movimientos' },
                    { color: '#FF6200', label: 'ING',            path: 'Área cliente → Mis productos → Exportar movimientos' },
                    { color: '#191C1F', label: 'Revolut',        path: 'App → Cuenta → Estado de cuenta → CSV' },
                    { color: '#0DC186', label: 'Trade Republic', path: 'App → Perfil → Documentos → Historial → Exportar CSV' },
                  ].map(b => (
                    <div key={b.label} className="import-bank-card">
                      <span className="import-bank-dot" style={{ background: b.color }} />
                      <div className="import-bank-card-content">
                        <span className="import-bank-name">{b.label}</span>
                        <span className="import-bank-path">{b.path}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── PASO 1: mapear columnas ── */}
          {step === 1 && (
            <div className="import-map-zone">
              {bankName && (
                <div className="import-bank-detected">
                  ✅ Banco detectado: <strong>{bankName}</strong> — columnas asignadas automáticamente
                </div>
              )}

              <div className="import-map-grid">
                <div className="form-group">
                  <label className="form-label">📅 Columna FECHA <span style={{color:'#ef4444'}}>*</span></label>
                  <select className="form-input" value={colDate} onChange={e => setColDate(e.target.value)}>
                    <option value="">— Selecciona —</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">💬 Columna DESCRIPCIÓN</label>
                  <select className="form-input" value={colDesc} onChange={e => setColDesc(e.target.value)}>
                    <option value="">— Ninguna —</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">💶 Columna IMPORTE <span style={{color:'#ef4444'}}>*</span></label>
                  <select className="form-input" value={colAmt} onChange={e => setColAmt(e.target.value)}>
                    <option value="">— Selecciona —</option>
                    {headers.map(h => <option key={h} value={h}>{h}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">🔄 Importes positivos = </label>
                  <select className="form-input" value={signIncome} onChange={e => setSignIncome(e.target.value)}>
                    <option value="positive">📈 Ingresos (lo normal)</option>
                    <option value="negative">📉 Gastos (invertido)</option>
                  </select>
                </div>
              </div>

              {/* Muestra de las 3 primeras filas */}
              <div className="import-preview-hint">
                <div className="import-preview-hint-title">Vista previa del archivo ({rawRows.length} filas)</div>
                <div style={{overflowX:'auto'}}>
                  <table className="movements-table" style={{minWidth:500, fontSize:'.78rem'}}>
                    <thead>
                      <tr>{headers.map(h => <th key={h}>{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      {rawRows.slice(0,4).map((row, i) => (
                        <tr key={i}>{headers.map(h => <td key={h}>{row[h]}</td>)}</tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="import-actions">
                <button className="btn btn-outline" onClick={() => setStep(0)}>← Atrás</button>
                <button className="btn btn-primary" onClick={buildPreview}>Ver previsualización →</button>
              </div>
            </div>
          )}

          {/* ── PASO 2: revisar e importar ── */}
          {step === 2 && imported === null && (
            <div className="import-review-zone">
              <div className="import-review-summary">
                <span>📋 <strong>{preview.length}</strong> movimientos encontrados</span>
                <span>✅ <strong>{toImport}</strong> se importarán</span>
                {autoCategorized > 0 && (
                  <span style={{color:'#059669'}}>🏷️ <strong>{autoCategorized}</strong> categorizados</span>
                )}
                <span style={{color:'var(--text-muted)'}}>⛔ {preview.length - toImport} excluidos</span>
              </div>
              <div className="import-review-hint">
                Haz clic en <strong>📈/📉</strong> para cambiar el tipo · cambia la categoría con el desplegable · <strong>⛔</strong> excluye la fila.
              </div>

              <div style={{overflowX:'auto', maxHeight:380, overflowY:'auto'}}>
                <table className="movements-table" style={{fontSize:'.78rem'}}>
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Descripción</th>
                      <th>Importe</th>
                      <th>Tipo</th>
                      <th>Categoría</th>
                      <th>⛔</th>
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((row, i) => (
                      <tr key={i} style={{ opacity: row._skip ? .35 : 1, textDecoration: row._skip ? 'line-through' : 'none' }}>
                        <td style={{whiteSpace:'nowrap'}}>{row.date}</td>
                        <td style={{maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>
                          {row.description || <span style={{color:'var(--text-muted)'}}>Sin descripción</span>}
                        </td>
                        <td style={{fontWeight:700, whiteSpace:'nowrap', color: row.type === 'income' ? '#059669' : '#dc2626'}}>
                          {row.type === 'income' ? '+' : '-'}{row.amount.toFixed(2)} €
                        </td>
                        <td>
                          <button style={{background:'none',border:'none',cursor:'pointer',fontSize:'1.1rem'}}
                            onClick={() => toggleType(i)} title="Cambiar tipo">
                            {row.type === 'income' ? '📈' : '📉'}
                          </button>
                        </td>
                        <td>
                          <select
                            style={{fontSize:'.72rem', padding:'2px 4px', borderRadius:4, border:'1px solid var(--border)', background:'var(--surface)', color:'var(--text)', maxWidth:120}}
                            value={row.category_id || ''}
                            onChange={e => setCategory(i, e.target.value)}
                          >
                            <option value="">Sin categoría</option>
                            {categories.map(c => (
                              <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <button style={{background:'none',border:'none',cursor:'pointer',fontSize:'1rem',opacity: row._skip ? 1 : .4}}
                            onClick={() => toggleSkip(i)} title={row._skip ? 'Incluir' : 'Excluir'}>
                            ⛔
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="import-actions">
                <button className="btn btn-outline" onClick={() => setStep(1)}>← Atrás</button>
                <button className="btn btn-primary" onClick={handleImport} disabled={loading || toImport === 0}>
                  {loading ? 'Importando…' : `✅ Importar ${toImport} movimientos`}
                </button>
              </div>
            </div>
          )}

          {/* ── ÉXITO ── */}
          {imported !== null && (
            <div style={{textAlign:'center', padding:'2.5rem 1rem'}}>
              <div style={{fontSize:'4rem', marginBottom:'1rem'}}>🎉</div>
              <h3 style={{fontSize:'1.4rem', fontWeight:800, marginBottom:'.5rem'}}>
                ¡{imported} movimientos importados!
              </h3>
              <p style={{color:'var(--text-muted)', marginBottom:'1.5rem'}}>
                Ya puedes verlos en la sección de movimientos y en tu dashboard.
              </p>
              <button className="btn btn-primary" onClick={onClose}>Cerrar</button>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
