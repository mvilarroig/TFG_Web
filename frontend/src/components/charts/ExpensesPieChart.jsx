import { Pie } from 'react-chartjs-2'
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js'

ChartJS.register(ArcElement, Tooltip, Legend)

export default function ExpensesPieChart({ data }) {
  const expenses = data.filter(d => d.type === 'expense')

  if (expenses.length === 0) {
    return <p style={{ color: 'var(--text-muted)', fontSize: '.9rem', textAlign: 'center', padding: '2rem 0' }}>Sin gastos este mes</p>
  }

  const chartData = {
    labels:   expenses.map(d => d.name || 'Sin categoría'),
    datasets: [{
      data:            expenses.map(d => Number(d.total)),
      backgroundColor: expenses.map(d => d.color || '#94a3b8'),
      borderWidth:     2,
      borderColor:     '#fff',
    }]
  }

  return (
    <Pie
      data={chartData}
      options={{
        responsive: true,
        plugins: {
          legend: { position: 'bottom', labels: { font: { size: 11 }, padding: 12 } },
          tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${ctx.parsed.toFixed(2)} €` } }
        }
      }}
    />
  )
}