import { useState } from 'react'
import { formatMoney } from '../utils/format'
import { useMonthlySummary, useYearlySummary } from '../hooks/useFinances'
import {
  Chart as ChartJS,
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, Filler
} from 'chart.js'
import { Doughnut, Line } from 'react-chartjs-2'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement, Filler)

const MONTHS     = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']
const MONTHS_SHORT = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function TrendBadge({ current, previous }) {
  if (!previous || previous === 0) return null
  const diff = ((current - previous) / previous * 100).toFixed(1)
  const up   = current >= previous
  return (
    <span className="trend-badge" style={{ background: up ? '#fee2e2' : '#d1fae5', color: up ? '#991b1b' : '#065f46' }}>
      {up ? '▲' : '▼'} {Math.abs(diff)}%
    </span>
  )
}

function ProgressBar({ value, max, color }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0
  return (
    <div className="summary-progress-bg">
      <div className="summary-progress-fill" style={{ width: `${pct}%`, background: color }} />
    </div>
  )
}

export default function SummaryPage() {
  const now   = new Date()
  const [year,  setYear]  = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)

  const isCurrentSummaryMonth = year === now.getFullYear() && month === now.getMonth() + 1
  const goToPrev = () => { if (month === 1) { setYear(y => y - 1); setMonth(12) } else setMonth(m => m - 1) }
  const goToNext = () => { if (isCurrentSummaryMonth) return; if (month === 12) { setYear(y => y + 1); setMonth(1) } else setMonth(m => m + 1) }
  const goToNow  = () => { setYear(now.getFullYear()); setMonth(now.getMonth() + 1) }

  const prevMonth = month === 1 ? 12 : month - 1
  const prevYear  = month === 1 ? year - 1 : year

  const { data: monthly,  isLoading: loadingM } = useMonthlySummary(year, month)
  const { data: prevData }                       = useMonthlySummary(prevYear, prevMonth)
  const { data: yearly,   isLoading: loadingY } = useYearlySummary(year)

  const income       = Number(monthly?.income      || 0)
  const expense      = Number(monthly?.expense     || 0)
  const balance      = income - expense
  const carryOver    = Number(monthly?.carryOver   || 0)
  const totalBalance = Number(monthly?.totalBalance ?? balance)
  const savingsRate  = income > 0 ? ((balance / income) * 100) : 0

  const prevIncome    = Number(prevData?.income  || 0)
  const prevExpense   = Number(prevData?.expense || 0)
  const prevMonthName = MONTHS[prevMonth - 1]
  const incomeDiff    = income - prevIncome
  const expenseDiff   = expense - prevExpense

  const topExpenses = (monthly?.byCategory || [])
    .filter(c => c.type === 'expense')
    .sort((a, b) => Number(b.total) - Number(a.total))
    .slice(0, 5)

  const maxExpense = topExpenses[0] ? Number(topExpenses[0].total) : 1

  // Yearly line chart
  const yearIncomes  = MONTHS_SHORT.map((_, i) => { const r = yearly?.data?.find(d => d.month === i+1 && d.type === 'income');  return r ? Number(r.total) : 0 })
  const yearExpenses = MONTHS_SHORT.map((_, i) => { const r = yearly?.data?.find(d => d.month === i+1 && d.type === 'expense'); return r ? Number(r.total) : 0 })
  const yearBalances = yearIncomes.map((inc, i) => inc - yearExpenses[i])

  const maxMonth = year === now.getFullYear() ? month : 12
  const lineData = {
    labels: MONTHS_SHORT.slice(0, maxMonth),
    datasets: [
      { label: 'Ingresos', data: yearIncomes.slice(0, maxMonth),  borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,.08)', fill: true, tension: 0.4, pointBackgroundColor: '#10b981', pointRadius: 3, pointHoverRadius: 6 },
      { label: 'Gastos',   data: yearExpenses.slice(0, maxMonth), borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,.06)',  fill: true, tension: 0.4, pointBackgroundColor: '#ef4444', pointRadius: 3, pointHoverRadius: 6 },
      { label: 'Balance',  data: yearBalances.slice(0, maxMonth), borderColor: '#3b82f6', backgroundColor: 'transparent', borderDash: [5,3], tension: 0.4, pointBackgroundColor: '#3b82f6', pointRadius: 3, pointHoverRadius: 6 },
    ]
  }

  // Doughnut gastos
  const doughnutData = {
    labels: topExpenses.map(c => c.name || 'Sin cat.'),
    datasets: [{
      data: topExpenses.map(c => Number(c.total)),
      backgroundColor: topExpenses.map(c => c.color || '#94a3b8'),
      borderWidth: 3, borderColor: '#fff', hoverBorderWidth: 4,
    }]
  }

  const chartOpts = {
    responsive: true,
    plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 14, usePointStyle: true } }, tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${formatMoney(ctx.parsed.y ?? ctx.parsed)}€` } } },
    scales: { x: { grid: { display: false } }, y: { grid: { color: '#f1f5f9' }, ticks: { callback: v => v + '€' } } }
  }

  return (
    <div className="summary-page">

      {/* Header */}
      <div className="summary-header">
        <div>
          <h1 className="summary-title">📊 Resumen financiero</h1>
          <p className="summary-subtitle">Análisis de {MONTHS[month-1]} {year}</p>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:'.75rem', flexWrap:'wrap'}}>
          <div className="month-nav">
            <button className="month-nav-btn" onClick={goToPrev}>‹</button>
            <span className="month-nav-label">{MONTHS[month-1]} {year}</span>
            <button className="month-nav-btn" onClick={goToNext} disabled={isCurrentSummaryMonth}>›</button>
            {!isCurrentSummaryMonth && <button className="month-nav-today" onClick={goToNow}>Hoy</button>}
          </div>
          <div className="summary-selectors">
            <div className="summary-selector-group">
              <label>Año</label>
              <select value={year} onChange={e => setYear(Number(e.target.value))}>
                {[2023,2024,2025,2026].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Tira de tiempo */}
      <div className="tl-strip" style={{marginBottom:'1.25rem'}}>
        {Array.from({ length: 12 }, (_, i) => {
          const m        = i + 1
          const inc      = Number(yearly?.data?.find(d => d.month === m && d.type === 'income')?.total  || 0)
          const exp      = Number(yearly?.data?.find(d => d.month === m && d.type === 'expense')?.total || 0)
          const bal      = inc - exp
          const hasData  = inc > 0 || exp > 0
          const isFuture = year === now.getFullYear() ? m > now.getMonth() + 1 : year > now.getFullYear()
          const isActive = m === month
          const dotColor = isActive   ? '#3b82f6'
                          : isFuture  ? '#e2e8f0'
                          : !hasData  ? '#cbd5e1'
                          : bal >= 0  ? '#10b981'
                                      : '#ef4444'
          return (
            <div key={m}
              className={`tl-dot${isActive ? ' tl-active' : ''}${isFuture ? ' tl-future' : ''}`}
              onClick={() => !isFuture && setMonth(m)}
              title={MONTHS[i]}
            >
              <div className="tl-circle" style={{ background: dotColor }} />
              <span className="tl-label">{MONTHS_SHORT[i]}</span>
            </div>
          )
        })}
      </div>

      {/* Banner acumulado */}
      {carryOver !== 0 && (
        <div className="summary-carry-banner">
          <span className="summary-carry-icon">🏦</span>
          <div className="summary-carry-text">
            <strong>Saldo acumulado hasta {MONTHS[month-1]}:</strong>{' '}
            <span style={{color: totalBalance >= 0 ? '#059669' : '#dc2626', fontWeight:700}}>
              {totalBalance >= 0 ? '+' : ''}{formatMoney(totalBalance)} €
            </span>
            <span style={{color:'var(--text-muted)', fontSize:'.85rem'}}>
              {' '}({carryOver >= 0 ? '+' : ''}{formatMoney(carryOver)} € de meses anteriores + {balance >= 0 ? '+' : ''}{formatMoney(balance)} € este mes)
            </span>
          </div>
        </div>
      )}

      {/* KPIs */}
      <div className="summary-kpi-grid">

        <div className="summary-kpi income">
          <div className="summary-kpi-top">
            <span className="summary-kpi-icon">📈</span>
            <TrendBadge current={income} previous={prevIncome} />
          </div>
          <div className="summary-kpi-value" style={{color:'#059669'}}>+{formatMoney(income)} €</div>
          <div className="summary-kpi-label">Ingresos del mes</div>
          <div className="summary-kpi-prev">
            {prevIncome > 0
              ? incomeDiff >= 0
                ? <span style={{color:'#059669'}}>▲ {formatMoney(incomeDiff)} € más que en {prevMonthName}</span>
                : <span style={{color:'#dc2626'}}>▼ {formatMoney(Math.abs(incomeDiff))} € menos que en {prevMonthName}</span>
              : <span style={{color:'var(--text-muted)'}}>Sin datos de {prevMonthName}</span>
            }
          </div>
        </div>

        <div className="summary-kpi expense">
          <div className="summary-kpi-top">
            <span className="summary-kpi-icon">📉</span>
            <TrendBadge current={expense} previous={prevExpense} />
          </div>
          <div className="summary-kpi-value" style={{color:'#dc2626'}}>-{formatMoney(expense)} €</div>
          <div className="summary-kpi-label">Gastos del mes</div>
          <div className="summary-kpi-prev">
            {prevExpense > 0
              ? expenseDiff >= 0
                ? <span style={{color:'#dc2626'}}>▲ {formatMoney(expenseDiff)} € más que en {prevMonthName}</span>
                : <span style={{color:'#059669'}}>▼ {formatMoney(Math.abs(expenseDiff))} € menos que en {prevMonthName}</span>
              : <span style={{color:'var(--text-muted)'}}>Sin datos de {prevMonthName}</span>
            }
          </div>
        </div>

        <div className="summary-kpi balance">
          <div className="summary-kpi-top">
            <span className="summary-kpi-icon">💰</span>
          </div>
          <div className="summary-kpi-value" style={{color: balance >= 0 ? '#2563eb' : '#dc2626'}}>
            {balance >= 0 ? '+' : ''}{formatMoney(balance)} €
          </div>
          <div className="summary-kpi-label">Balance del mes</div>
          <div className="summary-kpi-prev">
            {balance >= 0 ? '✅ Mes positivo · ' : '⚠️ Mes negativo · '}
            <strong style={{color: totalBalance >= 0 ? '#2563eb' : '#dc2626'}}>
              {totalBalance >= 0 ? '+' : ''}{formatMoney(totalBalance)} € acumulados
            </strong>
          </div>
        </div>

        <div className="summary-kpi savings">
          <div className="summary-kpi-top">
            <span className="summary-kpi-icon">🎯</span>
          </div>
          <div className="summary-kpi-value" style={{color: income === 0 ? 'var(--text-muted)' : savingsRate >= 20 ? '#059669' : savingsRate >= 0 ? '#d97706' : '#dc2626'}}>
            {income > 0 ? `${savingsRate.toFixed(1)}%` : '—'}
          </div>
          <div className="summary-kpi-label">Tasa de ahorro</div>
          <div className="summary-kpi-prev">
            {income === 0
              ? 'Sin ingresos este mes'
              : savingsRate >= 20 ? `🌟 Excelente — guardaste ${formatMoney(balance)} €`
              : savingsRate >= 10 ? `👍 Buena — guardaste ${formatMoney(balance)} €`
              : savingsRate >= 0  ? `⚠️ Mejorable — guardaste ${formatMoney(balance)} €`
              :                     `🚨 Gastos superiores a ingresos`
            }
          </div>
        </div>

      </div>

      {/* Fila: Donut + Top gastos */}
      <div className="summary-row-2" style={{marginBottom:'1.25rem'}}>

        <div className="summary-card summary-card-sm">
          <div className="summary-card-header">
            <h3>🍩 Distribución de gastos</h3>
          </div>
          {loadingM ? <div className="summary-loading">Cargando...</div>
            : topExpenses.length === 0
            ? <div className="summary-empty">🎉 Sin gastos este mes</div>
            : (
              <div style={{maxWidth:260, margin:'0 auto'}}>
                <Doughnut data={doughnutData} options={{ responsive: true, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 10, usePointStyle: true } }, tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${formatMoney(ctx.parsed)}€` } } } }} />
              </div>
            )
          }
        </div>

        <div className="summary-card summary-card-sm">
          <div className="summary-card-header">
            <h3>🏆 Top categorías de gasto</h3>
          </div>
          {topExpenses.length === 0
            ? <div className="summary-empty">Sin gastos este mes</div>
            : (
              <div className="summary-top-list">
                {topExpenses.map((c, i) => (
                  <div key={i} className="summary-top-item">
                    <div className="summary-top-rank">#{i+1}</div>
                    <div className="summary-top-info">
                      <div className="summary-top-name">
                        <span>{c.icon}</span> {c.name || 'Sin categoría'}
                        <span className="summary-top-count">({c.count} mov.)</span>
                      </div>
                      <ProgressBar value={Number(c.total)} max={maxExpense} color={c.color || '#94a3b8'} />
                    </div>
                    <div className="summary-top-amount" style={{color: c.color || '#94a3b8'}}>
                      {formatMoney(Number(c.total))} €
                    </div>
                  </div>
                ))}
              </div>
            )
          }
        </div>
      </div>

      {/* Line anual */}
      <div className="summary-card summary-card-sm" style={{marginBottom:'1.25rem'}}>
        <div className="summary-card-header">
          <h3>📈 Evolución anual {year}</h3>
          <div className="summary-year-totals">
            <span style={{color:'#059669'}}>▲ {formatMoney(yearIncomes.reduce((a,b)=>a+b,0))}€</span>
            <span style={{color:'#dc2626'}}>▼ {formatMoney(yearExpenses.reduce((a,b)=>a+b,0))}€</span>
          </div>
        </div>
        {loadingY ? <div className="summary-loading">Cargando...</div>
          : (
            <div style={{maxHeight:220}}>
              <Line data={lineData} options={{...chartOpts, maintainAspectRatio: false}} height={220} />
            </div>
          )
        }
      </div>

      {/* Comparativa mensual del año */}
      <div className="summary-card" style={{marginTop:'1.25rem', padding:0, overflow:'hidden'}}>
        <div className="summary-card-header" style={{padding:'1.25rem 1.5rem', borderBottom:'1px solid var(--border-light)'}}>
          <h3>📅 Comparativa mensual — {year}</h3>
          <span style={{fontSize:'.8rem',color:'var(--text-muted)'}}>Mes a mes</span>
        </div>
        {loadingY ? <div className="summary-loading" style={{padding:'2rem'}}>Cargando...</div> : (
          <table className="movements-table">
            <thead>
              <tr>
                <th>Mes</th>
                <th style={{color:'#059669'}}>Ingresos</th>
                <th style={{color:'#dc2626'}}>Gastos</th>
                <th>Balance mes</th>
                <th>Ahorro %</th>
              </tr>
            </thead>
            <tbody>
              {MONTHS_SHORT.map((m, i) => {
                const inc = yearIncomes[i]
                const exp = yearExpenses[i]
                const bal = inc - exp
                const rate = inc > 0 ? ((bal / inc) * 100).toFixed(1) : '—'
                const hasData = inc > 0 || exp > 0
                const isSelected = i + 1 === month
                const isFuture   = year === now.getFullYear() && i + 1 > now.getMonth() + 1
                return (
                  <tr key={i}
                    onClick={() => !isFuture && setMonth(i + 1)}
                    style={{
                      opacity: isFuture ? .35 : hasData ? 1 : .5,
                      background: isSelected ? 'rgba(59,130,246,.07)' : undefined,
                      fontWeight: isSelected ? 700 : undefined,
                      cursor: isFuture ? 'default' : 'pointer',
                    }}>
                    <td>
                      <span style={{display:'flex',alignItems:'center',gap:'.4rem'}}>
                        <span style={{width:'8px',height:'8px',borderRadius:'50%',display:'inline-block',flexShrink:0,
                          background: isSelected ? '#3b82f6' : !hasData || isFuture ? '#e2e8f0' : bal >= 0 ? '#10b981' : '#ef4444'
                        }} />
                        {MONTHS[i]}
                        {isSelected && <span style={{fontSize:'.7rem',color:'#3b82f6',fontWeight:700}}>← aquí</span>}
                      </span>
                    </td>
                    <td className="amount-income">{hasData ? `+${formatMoney(inc)} €` : '—'}</td>
                    <td className="amount-expense">{hasData ? `-${formatMoney(exp)} €` : '—'}</td>
                    <td style={{fontWeight:700, color: bal >= 0 ? '#2563eb' : '#dc2626'}}>
                      {hasData ? `${bal >= 0 ? '+' : ''}${formatMoney(bal)} €` : '—'}
                    </td>
                    <td style={{color: typeof rate === 'string' ? 'var(--text-muted)' : Number(rate) >= 20 ? '#059669' : Number(rate) >= 0 ? '#d97706' : '#dc2626'}}>
                      {typeof rate === 'string' ? rate : `${rate}%`}
                    </td>
                  </tr>
                )
              })}
              <tr style={{background:'var(--surface-2)',fontWeight:700}}>
                <td>Total {year}</td>
                <td className="amount-income">+{formatMoney(yearIncomes.reduce((a,b)=>a+b,0))} €</td>
                <td className="amount-expense">-{formatMoney(yearExpenses.reduce((a,b)=>a+b,0))} €</td>
                <td style={{fontWeight:800, color: yearBalances.reduce((a,b)=>a+b,0) >= 0 ? '#2563eb' : '#dc2626'}}>
                  {yearBalances.reduce((a,b)=>a+b,0) >= 0 ? '+' : ''}{formatMoney(yearBalances.reduce((a,b)=>a+b,0))} €
                </td>
                <td style={{color:'var(--text-muted)'}}>—</td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

    </div>
  )
}