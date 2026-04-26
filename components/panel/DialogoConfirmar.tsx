"use client"

import { AlertTriangle } from "lucide-react"

interface Props {
  titulo: string
  descripcion: string
  labelConfirmar?: string
  cargando?: boolean
  onConfirmar: () => void
  onCancelar: () => void
}

export default function DialogoConfirmar({
  titulo,
  descripcion,
  labelConfirmar = "Confirmar",
  cargando = false,
  onConfirmar,
  onCancelar,
}: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancelar} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-sm p-6 flex flex-col gap-4 border border-slate-100 dark:border-slate-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">{titulo}</h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">{descripcion}</p>
        <div className="flex gap-3 justify-end pt-1">
          <button
            onClick={onCancelar}
            disabled={cargando}
            className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirmar}
            disabled={cargando}
            className="px-4 py-2 rounded-xl text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors disabled:opacity-60"
          >
            {cargando ? "Cancelando..." : labelConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}
