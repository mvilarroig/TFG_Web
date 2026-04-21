import { Bar } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend)

export default function MonthlyBarChart({ data }) {
  if (!data.length) {
    return <p style={{ color: 'var(--text-muted)', fontSize: '.9rem', textAlign: 'center', padding: '2rem 0' }}>Sin datos este mes</p>
  }

  const dates   = [...new Set(data.map(d => d.date?.split('T')[0]))].sort()
  const incomes  = dates.map(date => { const r = data.find(d => d.date?.startsWith(date) && d.type === 'income');  return r ? Number(r.total) : 0 })
  const expenses = dates.map(date => { const r = data.find(d => d.date?.startsWith(date) && d.type === 'expense'); return r ? Number(r.total) : 0 })

  const chartData = {
    labels: dates.map(d => new Date(d).getDate()),
    datasets: [
      { label: 'Ingresos', data: incomes,  backgroundColor: '#86efac', borderRadius: 4 },
      { label: 'Gastos',   data: expenses, backgroundColor: '#fca5a5', borderRadius: 4 },
    ]
  }

  return (
    <Bar
      data={chartData}
      options={{
        responsive: true,
        plugins: { legend: { position: 'bottom', labels: { font: { size: 11 } } } },
        scales: {
          x: { grid: { display: false } },
          y: { ticks: { callback: v => v + ' €' } }
        }
      }}
    />
  )
}