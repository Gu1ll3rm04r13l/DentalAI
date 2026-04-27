"use client"

const sugerencias = [
  "Quiero un turno para limpieza dental",
  "¿Qué horarios tienen disponibles mañana?",
  "Necesito reprogramar un turno",
  "¿Atienden los sábados?",
]

interface Props {
  onSugerencia: (texto: string) => void
}

export default function SugerenciasIniciales({ onSugerencia }: Props) {
  return (
    <div className="flex flex-col items-center gap-6 py-8">
      <div className="text-center">
        <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-3xl mx-auto mb-4">
          🦷
        </div>
        <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">¡Hola! 👋 Soy Sarah</h3>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-xs">
          La recepcionista de Clínica Dental Sonrisa. ¿En qué te puedo ayudar?
        </p>
      </div>

      <div className="flex flex-wrap gap-2 justify-center max-w-md">
        {sugerencias.map((s, i) => (
          <button
            key={i}
            onClick={() => onSugerencia(s)}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm font-medium hover:border-blue-300 dark:hover:border-blue-500 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition-all duration-150"
          >
            {s}
          </button>
        ))}
      </div>
    </div>
  )
}
