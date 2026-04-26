"use client"

import { format, parseISO, isBefore, compareAsc } from "date-fns"
import { es } from "date-fns/locale"
import { Pencil, X } from "lucide-react"
import type { Turno } from "@/lib/dominio/tipos"
import { cn } from "@/lib/utils"

function getBadge(turno: Turno) {
  if (turno.estado === "cancelado") {
    return { label: "Cancelado", clase: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400" }
  }
  if (turno.estado === "completado") {
    return { label: "Completado", clase: "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400" }
  }
  const fechaHora = parseISO(`${turno.fecha}T${turno.hora}:00`)
  if (isBefore(fechaHora, new Date())) {
    return { label: "Pasado", clase: "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400" }
  }
  return { label: "Activo", clase: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" }
}

interface Props {
  turnos: Turno[]
  onEditar: (turno: Turno) => void
  onCancelar: (turno: Turno) => void
}

function ordenar(turnos: Turno[]) {
  return [...turnos].sort((a, b) =>
    compareAsc(parseISO(`${a.fecha}T${a.hora}:00`), parseISO(`${b.fecha}T${b.hora}:00`))
  )
}

export default function ListaVerticalTurnos({ turnos, onEditar, onCancelar }: Props) {
  const ordenados = ordenar(turnos)

  return (
    <div className="rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800/80">
      {/* Header */}
      <div className="grid grid-cols-[80px_140px_1fr_120px_140px_100px_64px] gap-0 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700">
        {["Hora", "Fecha", "Paciente", "Teléfono", "Tipo", "Estado", ""].map((col) => (
          <span key={col} className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
            {col}
          </span>
        ))}
      </div>

      {ordenados.length === 0 && (
        <p className="text-sm text-slate-400 dark:text-slate-500 py-8 text-center">No hay turnos.</p>
      )}

      {ordenados.map((turno, i) => {
        const { label, clase } = getBadge(turno)
        const esActivo = turno.estado === "activo"
        const fechaStr = format(parseISO(turno.fecha), "EEE d MMM yyyy", { locale: es })

        return (
          <div
            key={turno.id}
            className={cn(
              "grid grid-cols-[80px_140px_1fr_120px_140px_100px_64px] gap-0 px-4 py-3 items-center group transition-colors",
              i % 2 === 0
                ? "bg-white dark:bg-slate-800/80"
                : "bg-slate-50/60 dark:bg-slate-800/40",
              "hover:bg-blue-50/40 dark:hover:bg-slate-700/60",
              i < ordenados.length - 1 && "border-b border-slate-100 dark:border-slate-700/50"
            )}
          >
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{turno.hora}hs</span>
            <span className="text-sm text-slate-600 dark:text-slate-300 capitalize truncate pr-2">{fechaStr}</span>
            <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate pr-2">{turno.nombre_paciente}</span>
            <span className="text-sm text-slate-500 dark:text-slate-400 truncate pr-2">{turno.telefono}</span>
            <span className="text-sm text-slate-600 dark:text-slate-300 truncate pr-2">{turno.tipo_consulta}</span>
            <span className={cn("text-xs font-medium px-2.5 py-1 rounded-xl w-fit", clase)}>{label}</span>
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
              {esActivo && (
                <>
                  <button
                    onClick={() => onEditar(turno)}
                    title="Editar"
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                  >
                    <Pencil className="w-3 h-3" />
                  </button>
                  <button
                    onClick={() => onCancelar(turno)}
                    title="Cancelar"
                    className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
