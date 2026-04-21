import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler } from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend, Filler)

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

export default function YearlyLineChart({ data }) {
  const incomes  = MONTHS.map((_, i) => { const r = data.find(d => d.month === i+1 && d.type === 'income');  return r ? Number(r.total) : 0 })
  const expenses = MONTHS.map((_, i) => { const r = data.find(d => d.month === i+1 && d.type === 'expense'); return r ? Number(r.total) : 0 })

  const chartData = {
    labels: MONTHS,
    datasets: [
      {
        label: 'Ingresos',
        data: incomes,
        borderColor: '#22c55e',
        backgroundColor: 'rgba(34,197,94,.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Gastos',
        data: expenses,
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239,68,68,.1)',
        fill: true,
        tension: 0.4,
      },
    ]
  }

  return (
    <Line
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