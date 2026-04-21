import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMonthlySummary, useMovements, useYearlySummary, useFixedExpenses } from '../hooks/useFinances'
import { useAuth } from '../context/AuthContext'
import DashboardSkeleton from '../components/common/SkeletonLoader'
import OnboardingModal from '../components/common/OnboardingModal'
import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, Filler
} from 'chart.js'
import { Doughnut, Bar, Line } from 'react-chartjs-2'
import { formatMoney } from '../utils/format'

ChartJS.register(
  ArcElement, Tooltip, Legend,
  CategoryScale, LinearScale, BarElement,
  PointElement, LineElement, Filler
)

const MONTHS     = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
const MONTHS_FULL= ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre']

/* ── Tooltip informativo ── */
function Tip({ text }) {
  return <span className="metric-tip" data-tip={text}>ⓘ</span>
}

/* ── Número animado ── */
function AnimatedNumber({ value, suffix = '', decimals = 2 }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const target = Number(value) || 0
    const steps = 40
    let step = 0, current = 0
    const timer = setInterval(() => {
      step++
      current += target / steps
      if (step >= steps) { setDisplay(target); clearInterval(timer) }
      else setDisplay(current)
    }, 800 / steps)
    return () => clearInterval(timer)
  }, [value])
  return <span>{formatMoney(display)}{suffix}</span>
}

/* ── Anillo de salud financiera ── */
function HealthRing({ income, expense }) {
  const noIncome = income === 0
  const score    = noIncome ? 0 : Math.min(100, Math.round((1 - expense / income) * 100))
  const clamped  = Math.max(0, score)
  const color    = noIncome ? '#94a3b8' : clamped >= 60 ? '#10b981' : clamped >= 30 ? '#f59e0b' : '#ef4444'
  const label    = noIncome ? 'Sin ingresos' : clamped >= 60 ? 'Excelente' : clamped >= 30 ? 'Moderada' : 'En riesgo'
  const tip      = noIncome
    ? 'Añade tus ingresos del mes para calcular la salud financiera.'
    : clamped >= 60 ? `¡Genial! Estás ahorrando el ${clamped}% de tus ingresos.`
    : clamped >= 30 ? 'Margen moderado. Cada euro que reduces en gastos mejora tu puntuación.'
    : 'Tus gastos igualan o superan tus ingresos este mes.'
  const C = 2 * Math.PI * 52
  return (
    <div className="health-card">
      <div className="health-title">💚 Salud financiera <Tip text="Puntuación 0–100 sobre cuánto de tus ingresos no has gastado. +60 excelente · 30–60 normal · 0–30 en riesgo. Requiere tener ingresos registrados." /></div>
      <div className="health-ring-wrap">
        <svg viewBox="0 0 120 120" className="health-ring">
          <circle cx="60" cy="60" r="52" fill="none" stroke="#e2e8f0" strokeWidth="12"/>
          <circle cx="60" cy="60" r="52" fill="none" stroke={color} strokeWidth="12"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C - (clamped / 100) * C}
            style={{ transition: 'stroke-dashoffset 1.4s ease, stroke .4s', transform: 'rotate(-90deg)', transformOrigin: '50% 50%' }}
          />
        </svg>
        <div className="health-score-inner">
          <div className="health-score-num" style={{ color }}>{noIncome ? '?' : clamped}</div>
          <div className="health-score-pct">{noIncome ? '' : '/ 100'}</div>
        </div>
      </div>
      <div className="health-label" style={{ color }}>{label}</div>
      <div className="health-tip">{tip}</div>
    </div>
  )
}

/* ── Mini stat ── */
function MiniStat({ icon, label, value, color }) {
  return (
    <div className="mini-stat">
      <div className="mini-stat-icon">{icon}</div>
      <div className="mini-stat-body">
        <div className="mini-stat-label">{label}</div>
        <div className="mini-stat-value" style={{ color }}>{value}</div>
      </div>
    </div>
  )
}

/* ── Tira de línea de tiempo ── */
function TimelineStrip({ yearData, viewYear, viewMonth, now, onSelect }) {
  const todayYear  = now.getFullYear()
  const todayMonth = now.getMonth() + 1
  return (
    <div className="tl-strip">
      {Array.from({ length: 12 }, (_, i) => {
        const m        = i + 1
        const inc      = Number(yearData?.data?.find(d => d.month === m && d.type === 'income')?.total  || 0)
        const exp      = Number(yearData?.data?.find(d => d.month === m && d.type === 'expense')?.total || 0)
        const bal      = inc - exp
        const hasData  = inc > 0 || exp > 0
        const isFuture = viewYear === todayYear ? m > todayMonth : viewYear > todayYear
        const isActive = m === viewMonth
        const dotColor = isActive   ? '#3b82f6'
                        : isFuture  ? '#e2e8f0'
                        : !hasData  ? '#cbd5e1'
                        : bal >= 0  ? '#10b981'
                                    : '#ef4444'
        return (
          <div key={m}
            className={`tl-dot${isActive ? ' tl-active' : ''}${isFuture ? ' tl-future' : ''}`}
            onClick={() => !isFuture && onSelect(m)}
            title={MONTHS_FULL[i]}
          >
            <div className="tl-circle" style={{ background: dotColor }} />
            <span className="tl-label">{MONTHS[i]}</span>
          </div>
        )
      })}
    </div>
  )
}

/* ── Barra de progreso de categoría ── */
function CategoryBar({ name, icon, total, max, color, count }) {
  const pct = max > 0 ? Math.min(100, (total / max) * 100) : 0
  return (
    <div className="cat-bar-item">
      <div className="cat-bar-label">
        <span>{icon} {name}</span>
        <span className="cat-bar-count">{count} mov.</span>
      </div>
      <div className="cat-bar-track">
        <div className="cat-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
      <div className="cat-bar-amount" style={{ color }}>{formatMoney(total)} €</div>
    </div>
  )
}

export default function DashboardPage() {
  const { user }  = useAuth()
  const navigate  = useNavigate()
  const now       = new Date()

  // ── Navegación de mes ──
  const [viewYear,  setViewYear]  = useState(now.getFullYear())
  const [viewMonth, setViewMonth] = useState(now.getMonth() + 1)
  const isCurrentMonth = viewYear === now.getFullYear() && viewMonth === now.getMonth() + 1

  const goToPrev = () => {
    if (viewMonth === 1) { setViewYear(y => y - 1); setViewMonth(12) }
    else setViewMonth(m => m - 1)
  }
  const goToNext = () => {
    if (isCurrentMonth) return
    if (viewMonth === 12) { setViewYear(y => y + 1); setViewMonth(1) }
    else setViewMonth(m => m + 1)
  }
  const goToNow = () => { setViewYear(now.getFullYear()); setViewMonth(now.getMonth() + 1) }

  const year  = viewYear
  const month = viewMonth

  const { data, isLoading }       = useMonthlySummary(year, month)
  const { data: yearData }        = useYearlySummary(year)
  const firstDay = `${year}-${String(month).padStart(2,'0')}-01`
  const lastDay  = `${year}-${String(month).padStart(2,'0')}-${new Date(year, month, 0).getDate()}`
  const { data: allMovements }   = useMovements({ limit: 1, page: 1 })
  const { data: monthMovements } = useMovements({ limit: 6, page: 1, from: firstDay, to: lastDay })
  const { data: fixedExpenses }   = useFixedExpenses()

  // ── Onboarding ──
  const showOnboarding = user && !localStorage.getItem(`mb_onboarded_${user.id}`)
  const [onboardingDone, setOnboardingDone] = useState(false)

  // ── Meta de ahorro mensual (hooks siempre primero) ──
  const goalKey = `mb_goal_${year}_${month}`
  const [goal, setGoal]           = useState(() => { const s = localStorage.getItem(goalKey); return s ? Number(s) : 0 })
  const [editingGoal, setEditing] = useState(false)
  const [goalInput, setGoalInput] = useState('')

  const income       = Number(data?.income      || 0)
  const expense      = Number(data?.expense     || 0)
  const totalBalance = Number(data?.totalBalance ?? (income - expense))
  const balance      = income - expense
  // Tasa de ahorro: % de ingresos del mes que no has gastado este mes
  const savingsRate  = income > 0 ? ((balance / income) * 100) : 0
  const monthName   = MONTHS_FULL[month - 1]
  const totalMov   = (data?.byCategory || []).reduce((s, c) => s + Number(c.count), 0)
  const fixedTotal = (fixedExpenses || []).filter(f => f.active).reduce((s, f) => s + Number(f.amount), 0)

  const expenseCategories = (data?.byCategory || []).filter(c => c.type === 'expense').slice(0, 6)
  const incomeCategories  = (data?.byCategory || []).filter(c => c.type === 'income')
  const topExpenses       = [...expenseCategories].sort((a,b) => Number(b.total) - Number(a.total))
  const maxExpense        = topExpenses[0] ? Number(topExpenses[0].total) : 1

  // ── Gráfico donut gastos ──
  const doughnutData = {
    labels: expenseCategories.map(c => c.name || 'Sin cat.'),
    datasets: [{ data: expenseCategories.map(c => Number(c.total)), backgroundColor: expenseCategories.map(c => c.color || '#94a3b8'), borderWidth: 3, borderColor: '#fff', hoverBorderWidth: 4 }]
  }

  // ── Donut ingresos ──
  const incomeColors = ['#10b981','#3b82f6','#f59e0b','#8b5cf6','#06b6d4','#f97316']
  const incomeDoughnutData = {
    labels: incomeCategories.map(c => c.name || 'Otros'),
    datasets: [{ data: incomeCategories.map(c => Number(c.total)), backgroundColor: incomeCategories.map((c, i) => c.color || incomeColors[i % incomeColors.length]), borderWidth: 3, borderColor: '#fff', hoverBorderWidth: 4 }]
  }

  // ── Line anual ──
  const yearIncomes  = MONTHS.map((_, i) => { const r = yearData?.data?.find(d => d.month===i+1 && d.type==='income');  return r ? Number(r.total) : 0 })
  const yearExpenses = MONTHS.map((_, i) => { const r = yearData?.data?.find(d => d.month===i+1 && d.type==='expense'); return r ? Number(r.total) : 0 })
  const yearBalances = yearIncomes.map((inc, i) => inc - yearExpenses[i])

  const lineData = {
    labels: MONTHS,
    datasets: [
      { label: 'Ingresos', data: yearIncomes,  borderColor: '#10b981', backgroundColor: 'rgba(16,185,129,.08)', fill: true, tension: 0.4, pointBackgroundColor: '#10b981', pointRadius: 3, pointHoverRadius: 6 },
      { label: 'Gastos',   data: yearExpenses, borderColor: '#ef4444', backgroundColor: 'rgba(239,68,68,.06)',  fill: true, tension: 0.4, pointBackgroundColor: '#ef4444', pointRadius: 3, pointHoverRadius: 6 },
      { label: 'Balance',  data: yearBalances, borderColor: '#3b82f6', backgroundColor: 'transparent', borderDash: [5,3], tension: 0.4, pointBackgroundColor: '#3b82f6', pointRadius: 3, pointHoverRadius: 6 },
    ]
  }

  // ── Bar diario ──
  const dailyDates    = [...new Set((data?.daily||[]).map(d => d.date?.split('T')[0]))].sort().slice(-14)
  const dailyIncomes  = dailyDates.map(date => { const r = (data?.daily||[]).find(d => d.date?.startsWith(date) && d.type==='income');  return r ? Number(r.total) : 0 })
  const dailyExpenses = dailyDates.map(date => { const r = (data?.daily||[]).find(d => d.date?.startsWith(date) && d.type==='expense'); return r ? Number(r.total) : 0 })

  const barData = {
    labels: dailyDates.map(d => new Date(d).getDate() + '/' + (new Date(d).getMonth()+1)),
    datasets: [
      {
        label: 'Ingresos',
        data: dailyIncomes,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,.12)',
        fill: true, tension: 0.4,
        pointBackgroundColor: '#10b981',
        pointRadius: 4, pointHoverRadius: 6,
        borderWidth: 2,
      },
      {
        label: 'Gastos',
        data: dailyExpenses,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239,68,68,.08)',
        fill: true, tension: 0.4,
        pointBackgroundColor: '#ef4444',
        pointRadius: 4, pointHoverRadius: 6,
        borderWidth: 2,
      },
    ]
  }
  const dailyOpts = {
    responsive: true, maintainAspectRatio: true,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 14, usePointStyle: true } },
      tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${formatMoney(ctx.parsed.y)}€` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 11 } } },
      y: { grid: { color: 'rgba(0,0,0,.04)' }, ticks: { callback: v => v + '€', font: { size: 11 } }, border: { display: false } },
    }
  }

  // ── Comparativa mensual (meses del año actual con datos, máx 6) ──
  const monthsWithData = Array.from({ length: month }, (_, i) => i + 1) // Ene → mes actual
    .slice(-6) // últimos 6 como máximo
  const compareIncomes  = monthsWithData.map(m => { const r = yearData?.data?.find(d => d.month===m && d.type==='income');  return r ? Number(r.total) : 0 })
  const compareExpenses = monthsWithData.map(m => { const r = yearData?.data?.find(d => d.month===m && d.type==='expense'); return r ? Number(r.total) : 0 })
  const compareBalances = compareIncomes.map((inc, i) => parseFloat((inc - compareExpenses[i]).toFixed(2)))

  const compareData = {
    labels: monthsWithData.map(m => MONTHS[m-1].slice(0,3)),
    datasets: [
      {
        label: 'Ingresos',
        data: compareIncomes,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16,185,129,.1)',
        fill: true, tension: 0.4,
        pointBackgroundColor: '#10b981',
        pointRadius: 5, pointHoverRadius: 7,
        borderWidth: 2.5,
      },
      {
        label: 'Gastos',
        data: compareExpenses,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239,68,68,.07)',
        fill: true, tension: 0.4,
        pointBackgroundColor: '#ef4444',
        pointRadius: 5, pointHoverRadius: 7,
        borderWidth: 2.5,
      },
      {
        label: 'Balance',
        data: compareBalances,
        borderColor: '#3b82f6',
        backgroundColor: 'transparent',
        fill: false, tension: 0.4,
        borderDash: [5, 4],
        pointBackgroundColor: compareBalances.map(v => v >= 0 ? '#3b82f6' : '#ef4444'),
        pointRadius: 4, pointHoverRadius: 6,
        borderWidth: 2,
      },
    ]
  }
  const compareOpts = {
    responsive: true, maintainAspectRatio: true,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 14, usePointStyle: true } },
      tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${ctx.parsed.y >= 0 ? '' : ''}${formatMoney(ctx.parsed.y)}€` } },
    },
    scales: {
      x: { grid: { display: false }, ticks: { font: { size: 12, weight: '600' } } },
      y: { grid: { color: 'rgba(0,0,0,.04)' }, ticks: { callback: v => v + '€', font: { size: 11 } }, border: { display: false } },
    }
  }

  // ── Tasa de ahorro mensual ──
  const maxChartMonth = (viewYear === now.getFullYear()) ? viewMonth : 12
  const monthlySavingsRate = yearIncomes.slice(0, maxChartMonth).map((inc, i) =>
    inc > 0 ? parseFloat(((inc - yearExpenses[i]) / inc * 100).toFixed(1)) : null
  )
  const savingsRateChartData = {
    labels: MONTHS.slice(0, maxChartMonth),
    datasets: [{
      label: 'Tasa de ahorro',
      data: monthlySavingsRate,
      borderColor: '#3b82f6',
      backgroundColor: 'rgba(59,130,246,.08)',
      fill: true, tension: 0.4,
      pointBackgroundColor: monthlySavingsRate.map(v => v === null ? '#94a3b8' : v >= 20 ? '#10b981' : v >= 0 ? '#f59e0b' : '#ef4444'),
      pointRadius: 5, pointHoverRadius: 7,
      spanGaps: false,
    }]
  }
  const savingsLineOpts = {
    responsive: true, maintainAspectRatio: true,
    spanGaps: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => ` Ahorro: ${ctx.parsed.y.toFixed(1)}%` } }
    },
    scales: {
      x: { grid: { display: false } },
      y: { grid: { color: '#f1f5f9' }, ticks: { callback: v => v + '%' } }
    }
  }

  // ── Ticket medio por categoría ──
  const avgExpenses = topExpenses.map(c => ({
    label: `${c.icon || '📦'} ${c.name || 'Sin cat.'}`,
    avg: c.count > 0 ? parseFloat((Number(c.total) / Number(c.count)).toFixed(2)) : 0,
    color: c.color || '#94a3b8',
  }))
  const avgChartData = {
    labels: avgExpenses.map(c => c.label),
    datasets: [{
      label: 'Ticket medio',
      data: avgExpenses.map(c => c.avg),
      backgroundColor: avgExpenses.map(c => c.color),
      borderRadius: 6,
    }]
  }
  const avgOpts = {
    indexAxis: 'y',
    responsive: true, maintainAspectRatio: true,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => ` ${formatMoney(ctx.parsed.x)}€ por movimiento` } }
    },
    scales: {
      x: { grid: { color: '#f1f5f9' }, ticks: { callback: v => v + '€' } },
      y: { grid: { display: false }, ticks: { font: { size: 11 } } }
    }
  }

  const chartOpts = {
    responsive: true, maintainAspectRatio: true,
    plugins: { legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 14, usePointStyle: true } }, tooltip: { callbacks: { label: ctx => ` ${ctx.dataset.label}: ${formatMoney(ctx.parsed.y ?? ctx.parsed)}€` } } },
    scales: { x: { grid: { display: false } }, y: { grid: { color: '#f1f5f9' }, ticks: { callback: v => v + '€' } } }
  }
  const lineOpts = { ...chartOpts, scales: { ...chartOpts.scales, y: { ...chartOpts.scales.y, ticks: { callback: v => v + '€' } } } }

  // ── Consejos financieros dinámicos ──
  const tips = []
  if (savingsRate < 0)  tips.push({ icon: '🚨', color: '#ef4444', msg: 'Tus gastos superaron tus ingresos este mes. Revisa los gastos no esenciales.' })
  if (savingsRate >= 0 && savingsRate < 10) tips.push({ icon: '⚠️', color: '#f59e0b', msg: `Tu tasa de ahorro es del ${savingsRate.toFixed(1)}%. Intenta reducir alguna categoría de gasto.` })
  if (savingsRate >= 20) tips.push({ icon: '🌟', color: '#10b981', msg: `¡Excelente! Has ahorrado el ${savingsRate.toFixed(1)}% de tus ingresos este mes.` })
  if (topExpenses[0])   tips.push({ icon: '🔍', color: '#3b82f6', msg: `Tu mayor gasto es "${topExpenses[0].name}" con ${formatMoney(Number(topExpenses[0].total))} €.` })
  if (incomeCategories.length > 1) tips.push({ icon: '💡', color: '#3b82f6', msg: `Tienes ${incomeCategories.length} fuentes de ingreso. ¡Diversificar es buena señal!` })
  if (tips.length === 0) tips.push({ icon: '📊', color: '#64748b', msg: 'Añade movimientos para ver consejos personalizados.' })

  const handleSetGoal = (e) => {
    e.preventDefault()
    const val = parseFloat(goalInput)
    if (val > 0) { localStorage.setItem(goalKey, val); setGoal(val); setEditing(false) }
  }
  const goalPct   = goal > 0 ? Math.min(100, Math.round((totalBalance / goal) * 100)) : 0
  const goalColor = goalPct >= 100 ? '#10b981' : goalPct >= 60 ? '#3b82f6' : goalPct >= 30 ? '#f59e0b' : '#ef4444'

  if (isLoading) return <DashboardSkeleton />

  // ── Estado vacío: sin ningún movimiento ──
  const hasNoData = !isLoading && allMovements?.total === 0
  if (hasNoData && !onboardingDone) return (
    <>
      {(showOnboarding && !onboardingDone) && (
        <OnboardingModal userId={user?.id} onClose={() => setOnboardingDone(true)} />
      )}
      <div className="empty-dashboard">
        <img src="/img/logo.png" alt="MyBudget" className="empty-dashboard-logo" />
        <h1 className="empty-dashboard-title">¡Bienvenido, <span>{user?.name?.split(' ')[0]}</span>!</h1>
        <p className="empty-dashboard-desc">Tu dashboard está listo. Empieza añadiendo tu primer movimiento para ver tus gráficos y análisis en tiempo real.</p>
        <div className="empty-dashboard-cards">
          <div className="empty-card" onClick={() => navigate('/movements')}>
            <div className="empty-card-icon">📈</div>
            <div className="empty-card-label">Añadir ingreso</div>
            <div className="empty-card-sub">Salario, freelance, alquiler…</div>
          </div>
          <div className="empty-card" onClick={() => navigate('/movements')}>
            <div className="empty-card-icon">📉</div>
            <div className="empty-card-label">Añadir gasto</div>
            <div className="empty-card-sub">Alimentación, ocio, transporte…</div>
          </div>
          <div className="empty-card" onClick={() => navigate('/fixed')}>
            <div className="empty-card-icon">📌</div>
            <div className="empty-card-label">Gastos fijos</div>
            <div className="empty-card-sub">Hipoteca, suscripciones…</div>
          </div>
        </div>
        <button className="btn btn-primary btn-lg" onClick={() => navigate('/movements')}>
          ➕ Añadir mi primer movimiento
        </button>
      </div>
    </>
  )

  return (
    <>
    {(showOnboarding && !onboardingDone) && (
      <OnboardingModal userId={user?.id} onClose={() => setOnboardingDone(true)} />
    )}
    <div className="dashboard">

      {/* ── Header ── */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">Hola, <span className="dash-name">{user?.name?.split(' ')[0]}</span> 👋</h1>
          <p className="dash-subtitle">Panel financiero</p>
        </div>
        <div style={{display:'flex', alignItems:'center', gap:'.75rem', flexWrap:'wrap'}}>
          {/* Navegación de mes */}
          <div className="month-nav">
            <button className="month-nav-btn" onClick={goToPrev}>‹</button>
            <span className="month-nav-label">{monthName} {year}</span>
            <button className="month-nav-btn" onClick={goToNext} disabled={isCurrentMonth}>›</button>
            {!isCurrentMonth && (
              <button className="month-nav-today" onClick={goToNow}>Hoy</button>
            )}
          </div>
          <button className="btn btn-primary" onClick={() => navigate('/movements')}>+ Nuevo</button>
        </div>
      </div>

      {/* ── Línea de tiempo de meses ── */}
      <TimelineStrip
        yearData={yearData}
        viewYear={viewYear}
        viewMonth={viewMonth}
        now={now}
        onSelect={m => setViewMonth(m)}
      />

      {/* ── HERO: Saldo acumulado ── */}
      <div className={`balance-hero ${totalBalance >= 0 ? 'balance-positive' : 'balance-negative'}`}>
        <div className="balance-hero-left">
          <div className="balance-hero-label">
            {isCurrentMonth ? '💳 Saldo acumulado a hoy' : `💳 Saldo acumulado a final de ${monthName}`}
          </div>
          <div className="balance-hero-amount">
            {totalBalance < 0 ? '-' : ''}<AnimatedNumber value={Math.abs(totalBalance)} suffix=" €" />
          </div>
        </div>
        <div className="balance-hero-right">
          <div className="balance-hero-stat">
            <span className="balance-hero-stat-label">📈 Ingresos</span>
            <span className="balance-hero-stat-value positive">+{formatMoney(income)} €</span>
          </div>
          <div className="balance-hero-divider" />
          <div className="balance-hero-stat">
            <span className="balance-hero-stat-label">📉 Gastos</span>
            <span className="balance-hero-stat-value negative">-{formatMoney(expense)} €</span>
          </div>
          <div className="balance-hero-divider" />
          <div className="balance-hero-stat">
            <span className="balance-hero-stat-label">💰 Balance neto</span>
            <span className="balance-hero-stat-value" style={{color: balance >= 0 ? '#6ee7b7' : '#fca5a5'}}>
              {balance >= 0 ? '+' : ''}{formatMoney(balance)} €
            </span>
          </div>
        </div>
      </div>

      {/* ── KPIs secundarios ── */}
      {(() => {
        const savColor      = savingsRate >= 20 ? '#10b981' : savingsRate >= 10 ? '#f59e0b' : savingsRate >= 0 ? '#d97706' : '#ef4444'
        const savLabel      = savingsRate >= 20 ? 'Excelente' : savingsRate >= 10 ? 'Buena' : savingsRate >= 0 ? 'Mejorable' : 'Negativa'
        return (
          <div className="kpi-grid" style={{marginBottom:'1.25rem'}}>

            {/* Tasa de ahorro */}
            <div className="kpi-card">
              <div className="kpi-icon">📊</div>
              <div className="kpi-body">
                <div className="kpi-label">Ahorro del mes</div>
                <div className="kpi-value" style={{color: savColor}}>
                  {income > 0 ? `${savingsRate.toFixed(1)}%` : '—'}
                </div>
                {income > 0
                  ? <div style={{fontSize:'.72rem', color:'var(--text-muted)', marginTop:'.1rem'}}>
                      De {formatMoney(income)} € ingresados, <strong style={{color: savColor}}>{formatMoney(balance)} € ahorrados</strong>
                    </div>
                  : <div style={{fontSize:'.72rem', color:'var(--text-muted)', marginTop:'.1rem'}}>
                      Añade ingresos para calcularlo
                    </div>
                }
              </div>
            </div>

            {/* Gastos fijos del mes */}
            <div className="kpi-card">
              <div className="kpi-icon">📌</div>
              <div className="kpi-body">
                <div className="kpi-label">Gastos fijos del mes</div>
                <div className="kpi-value kpi-red">
                  {fixedTotal > 0 ? <AnimatedNumber value={fixedTotal} suffix=" €" /> : '—'}
                </div>
                <div style={{fontSize:'.72rem', color:'var(--text-muted)', marginTop:'.1rem'}}>
                  {fixedTotal === 0
                    ? 'Sin gastos fijos activos'
                    : income > 0
                      ? `${((fixedTotal / income) * 100).toFixed(1)}% de tus ingresos`
                      : 'Compromisos fijos recurrentes'
                  }
                </div>
              </div>
            </div>

            {/* Presupuesto restante por día */}
            {(() => {
              const today       = new Date()
              const lastDay     = new Date(year, month, 0).getDate()
              const daysLeft    = isCurrentMonth ? lastDay - today.getDate() + 1 : 0
              const dailyBudget = isCurrentMonth && daysLeft > 0 && totalBalance > 0 ? totalBalance / daysLeft : 0
              const dailyColor  = !isCurrentMonth ? 'var(--text-muted)' : dailyBudget >= 30 ? '#10b981' : dailyBudget >= 10 ? '#f59e0b' : totalBalance <= 0 ? '#ef4444' : '#d97706'
              return (
                <div className="kpi-card">
                  <div className="kpi-icon">📆</div>
                  <div className="kpi-body">
                    <div className="kpi-label">Puedes gastar al día</div>
                    <div className="kpi-value" style={{color: dailyColor}}>
                      {!isCurrentMonth ? '—' : totalBalance <= 0 ? '0,00 €' : <AnimatedNumber value={dailyBudget} suffix=" €" />}
                    </div>
                    <div style={{fontSize:'.72rem', color:'var(--text-muted)', marginTop:'.1rem'}}>
                      {isCurrentMonth ? `${daysLeft} días restantes` : 'Solo disponible en el mes actual'}
                    </div>
                  </div>
                </div>
              )
            })()}

            {/* Movimientos este mes — clickable */}
            <div className="kpi-card kpi-card-link" onClick={() => navigate('/movements')} style={{cursor:'pointer'}}>
              <div className="kpi-icon">🧾</div>
              <div className="kpi-body">
                <div className="kpi-label">Movimientos del mes</div>
                <div className="kpi-value kpi-blue">{totalMov || '0'}</div>
                <div style={{fontSize:'.72rem', color:'var(--primary-light)', marginTop:'.1rem', fontWeight:600}}>Ver todos →</div>
              </div>
            </div>

          </div>
        )
      })()}

      {/* ── Meta de ahorro ── */}
      <div className="goal-card-v2" style={{marginBottom:'1.25rem'}}>

        {/* Cabecera */}
        <div className="goal-v2-header">
          <div className="goal-v2-title-wrap">
            <span className="goal-v2-icon">🎯</span>
            <div>
              <div className="goal-v2-title">Objetivo de saldo a fin de mes</div>
              <div className="goal-v2-month">{MONTHS_FULL[month-1]} {year}</div>
            </div>
          </div>
          <button className="goal-v2-edit-btn" onClick={() => { setGoalInput(goal || ''); setEditing(v => !v) }}>
            {editingGoal ? '✕ Cancelar' : goal > 0 ? '✏️ Editar' : '+ Añadir meta'}
          </button>
        </div>

        {/* Formulario edición */}
        {editingGoal && (
          <form onSubmit={handleSetGoal} className="goal-v2-form">
            <input type="number" min="1" step="0.01" placeholder="Meta en euros, ej: 300"
              value={goalInput} onChange={e => setGoalInput(e.target.value)} autoFocus className="goal-v2-input" />
            <button type="submit" className="btn btn-primary btn-sm">Guardar</button>
          </form>
        )}

        {goal > 0 ? (
          <div className="goal-v2-body">
            {/* Importes */}
            <div className="goal-v2-amounts">
              <div className="goal-v2-saved">
                <span className="goal-v2-saved-num" style={{color: goalColor}}>
                  {totalBalance >= 0 ? formatMoney(totalBalance) : '0'} €
                </span>
                <span className="goal-v2-saved-label">saldo total</span>
              </div>
              <div className="goal-v2-pct" style={{color: goalColor}}>{goalPct}%</div>
              <div className="goal-v2-target">
                <span className="goal-v2-target-num">{formatMoney(goal)} €</span>
                <span className="goal-v2-saved-label">objetivo</span>
              </div>
            </div>

            {/* Barra */}
            <div className="goal-v2-track">
              <div className="goal-v2-fill" style={{width:`${goalPct}%`, background:`linear-gradient(90deg, ${goalColor}, ${goalColor}bb)`}} />
              {goalPct < 100 && (
                <div className="goal-v2-marker" style={{left:`${goalPct}%`, background: goalColor}} />
              )}
            </div>

            {/* Estado */}
            <div className="goal-v2-status" style={{color: goalColor}}>
              {goalPct >= 100 ? '🎉 ¡Meta superada! Enhorabuena'
                : goalPct >= 60  ? '💪 Buen ritmo, sigue así'
                : goalPct >= 30  ? '⚠️ Vas por el buen camino, no te rindas'
                : balance < 0    ? '🚨 Balance negativo este mes'
                :                  '📉 Aún lejos de la meta, ¡tú puedes!'}
            </div>
          </div>
        ) : (
          !editingGoal && (
            <div className="goal-v2-empty">
              <p>Fija cuánto quieres tener acumulado al final del mes y haz seguimiento en tiempo real.</p>
            </div>
          )
        )}
      </div>

      {/* ── Fila 1: Salud + Donut gastos + Polar ingresos ── */}
      <div className="dash-row-3" style={{marginBottom:'1.25rem'}}>
        <HealthRing income={income} expense={expense} />

        <div className="chart-card">
          <div className="chart-card-header"><h3>🍩 Gastos por categoría</h3></div>
          {expenseCategories.length === 0
            ? <div className="chart-empty"><span style={{fontSize:'2rem'}}>🎉</span>Sin gastos este mes</div>
            : <div style={{position:'relative', height:260}}><Doughnut data={doughnutData} options={{ responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { font:{size:11}, padding:12, usePointStyle:true } }, tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${formatMoney(ctx.parsed)}€` } } } }} /></div>
          }
        </div>

        <div className="chart-card">
          <div className="chart-card-header"><h3>💚 Fuentes de ingreso</h3></div>
          {incomeCategories.length === 0
            ? <div className="chart-empty"><span style={{fontSize:'2rem'}}>📭</span>Sin ingresos este mes</div>
            : <div style={{position:'relative', height:260}}><Doughnut data={incomeDoughnutData} options={{ responsive: true, maintainAspectRatio: false, cutout: '65%', plugins: { legend: { position: 'bottom', labels: { font:{size:11}, padding:12, usePointStyle:true } }, tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${formatMoney(ctx.parsed)}€` } } } }} /></div>
          }
        </div>
      </div>

      {/* ── Fila 2: Top gastos con barras + Consejos ── */}
      <div className="dash-row-2" style={{marginBottom:'1.25rem'}}>
        <div className="chart-card">
          <div className="chart-card-header"><h3>🏆 Top gastos del mes</h3></div>
          {topExpenses.length === 0
            ? <div className="chart-empty"><span style={{fontSize:'2rem'}}>🎉</span>Sin gastos este mes</div>
            : (
              <div style={{display:'flex', flexDirection:'column', gap:'.85rem'}}>
                {topExpenses.map((c, i) => (
                  <CategoryBar key={i}
                    name={c.name || 'Sin categoría'}
                    icon={c.icon || '📦'}
                    total={Number(c.total)}
                    max={maxExpense}
                    color={c.color || '#94a3b8'}
                    count={c.count}
                  />
                ))}
              </div>
            )
          }
        </div>

        <div className="chart-card tips-card">
          <div className="chart-card-header"><h3>💡 Consejos personalizados</h3></div>
          <div className="tips-list">
            {tips.map((t, i) => (
              <div key={i} className="tip-item" style={{borderLeftColor: t.color}}>
                <span className="tip-icon">{t.icon}</span>
                <span className="tip-msg">{t.msg}</span>
              </div>
            ))}
          </div>
          <div className="tips-footer">
            <div className="mini-stats-row">
              <MiniStat icon="📊" label="Movimientos" value={totalMov || 0} color="var(--primary)" />
              <MiniStat icon="🗂️" label="Categorías" value={(data?.byCategory || []).length} color="#3b82f6" />
              <MiniStat icon="📅" label="Días activos" value={dailyDates.length} color="#f59e0b" />
            </div>
          </div>
        </div>
      </div>

      {/* ── Fila: Tasa de ahorro mensual + Ticket medio ── */}
      <div className="dash-row-2" style={{marginBottom:'1.25rem'}}>
        <div className="chart-card">
          <div className="chart-card-header">
            <h3>📊 Tasa de ahorro mensual {year}</h3>
            <div style={{display:'flex', gap:'.5rem', fontSize:'.8rem', fontWeight:600}}>
              <span style={{color:'#10b981'}}>● ≥20%</span>
              <span style={{color:'#f59e0b'}}>● 0–20%</span>
              <span style={{color:'#ef4444'}}>● &lt;0%</span>
            </div>
          </div>
          <Line data={savingsRateChartData} options={savingsLineOpts} />
        </div>

        <div className="chart-card">
          <div className="chart-card-header"><h3>🎫 Ticket medio por categoría</h3></div>
          {topExpenses.length === 0
            ? <div className="chart-empty"><span style={{fontSize:'2rem'}}>🎉</span>Sin gastos este mes</div>
            : <Bar data={avgChartData} options={avgOpts} />
          }
        </div>
      </div>

      {/* ── Fila 4: Actividad diaria + Comparativa 6 meses ── */}
      <div className="dash-row-2" style={{marginBottom:'1.25rem'}}>
        <div className="chart-card">
          <div className="chart-card-header">
            <h3>📅 Actividad del mes</h3>
          </div>
          {dailyDates.length === 0
            ? <div className="chart-empty"><span style={{fontSize:'2rem'}}>📭</span>Sin actividad reciente</div>
            : <Line data={barData} options={dailyOpts} />
          }
        </div>

        <div className="chart-card">
          <div className="chart-card-header">
            <h3>📊 Comparativa — últimos 6 meses</h3>
          </div>
          <Line data={compareData} options={compareOpts} />
        </div>
      </div>

      {/* ── Últimos movimientos ── */}
      <div className="chart-card">
        <div className="chart-card-header">
          <h3>🕐 Movimientos recientes</h3>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/movements')}>Ver todos →</button>
        </div>
        {!monthMovements?.data?.length
          ? <div className="chart-empty"><span style={{fontSize:'2rem'}}>📭</span>Sin movimientos este mes</div>
          : (
            <div className="recent-list">
              {monthMovements.data.map(m => (
                <div key={m.id} className="recent-item">
                  <div className="recent-icon">{m.category_icon || (m.type==='income' ? '💚' : '🔴')}</div>
                  <div className="recent-info">
                    <div className="recent-desc">{m.description || m.category_name || 'Sin descripción'}</div>
                    <div className="recent-date">{new Date(m.date).toLocaleDateString('es-ES')}</div>
                  </div>
                  <div className={`recent-amount ${m.type==='income' ? 'kpi-green' : 'kpi-red'}`}>
                    {m.type==='income' ? '+' : '-'}{formatMoney(Number(m.amount))} €
                  </div>
                </div>
              ))}
            </div>
          )
        }
      </div>

    </div>
    </>
  )
}