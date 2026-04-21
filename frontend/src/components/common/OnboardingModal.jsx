import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const STEPS = [
  {
    icon: '👋',
    title: '¡Bienvenido a MyBudget!',
    desc:  'Tu gestor de finanzas personales. En menos de 2 minutos tendrás una visión completa de tu economía.',
    sub:   'Vamos a darte un recorrido rápido por las funciones principales.',
    color: '#3b82f6',
  },
  {
    icon: '💸',
    title: 'Registra tus movimientos',
    desc:  'Cada ingreso o gasto que añadas aparecerá en tus gráficos y resúmenes al instante.',
    sub:   'Puedes añadirlos desde el botón "+ Nuevo" en cualquier página, o desde Movimientos.',
    color: '#10b981',
    bullets: ['Ingresos: salario, freelance, alquiler…', 'Gastos: alimentación, ocio, transporte…', 'Gastos fijos: hipoteca, suscripciones…'],
  },
  {
    icon: '📌',
    title: 'Añade tus gastos fijos',
    desc:  'Hipoteca, alquiler, Spotify, luz… Regístralos una vez y siempre sabrás cuánto tienes comprometido cada mes.',
    sub:   'Encuéntralos en el menú lateral bajo "Gastos fijos".',
    color: '#3b82f6',
  },
  {
    icon: '📊',
    title: '¡Todo listo!',
    desc:  'Tu dashboard te mostrará en todo momento tu salud financiera, tus gastos por categoría y tu evolución mensual.',
    sub:   'Empieza añadiendo tu primer movimiento.',
    color: '#f59e0b',
  },
]

export default function OnboardingModal({ userId, onClose }) {
  const [step, setStep] = useState(0)
  const navigate        = useNavigate()
  const current         = STEPS[step]
  const isLast          = step === STEPS.length - 1

  const handleComplete = (goToMovements = false) => {
    localStorage.setItem(`mb_onboarded_${userId}`, '1')
    onClose()
    if (goToMovements) navigate('/movements')
  }

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-modal">

        {/* Skip */}
        <button className="onboarding-skip" onClick={() => handleComplete()}>Saltar →</button>

        {/* Icon */}
        <div className="onboarding-icon" style={{ background: current.color + '1a', color: current.color }}>
          {current.icon}
        </div>

        {/* Progress dots */}
        <div className="onboarding-dots">
          {STEPS.map((_, i) => (
            <div key={i} className={`onboarding-dot ${i === step ? 'active' : i < step ? 'done' : ''}`}
              style={i === step ? { background: current.color } : {}} />
          ))}
        </div>

        <h2 className="onboarding-title">{current.title}</h2>
        <p className="onboarding-desc">{current.desc}</p>

        {current.bullets && (
          <ul className="onboarding-bullets">
            {current.bullets.map((b, i) => <li key={i}>{b}</li>)}
          </ul>
        )}

        {current.sub && <p className="onboarding-sub">{current.sub}</p>}

        {/* Actions */}
        <div className="onboarding-actions">
          {step > 0 && (
            <button className="btn btn-outline" onClick={() => setStep(s => s - 1)}>← Anterior</button>
          )}
          {isLast ? (
            <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => handleComplete(true)}>
              ➕ Añadir mi primer movimiento
            </button>
          ) : (
            <button className="btn btn-primary" style={{ flex: 1 }}
              onClick={() => setStep(s => s + 1)}>
              Siguiente →
            </button>
          )}
        </div>

        {isLast && (
          <button className="onboarding-later" onClick={() => handleComplete()}>
            Lo haré más tarde
          </button>
        )}
      </div>
    </div>
  )
}
