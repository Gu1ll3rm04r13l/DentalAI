import { format, parseISO, isBefore } from "date-fns"
import { es } from "date-fns/locale"
import { User, Phone, Clock, Stethoscope, FileText, Pencil, X } from "lucide-react"
import type { Turno } from "@/lib/dominio/tipos"
import { cn } from "@/lib/utils"

function badgeEstado(turno: Turno) {
  if (turno.estado === "cancelado") {
    return { label: "Cancelado", clase: "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800" }
  }
  if (turno.estado === "completado") {
    return { label: "Completado", clase: "bg-slate-50 text-slate-600 border-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" }
  }
  // activo — verificar si ya pasó
  const fechaHora = parseISO(`${turno.fecha}T${turno.hora}:00`)
  if (isBefore(fechaHora, new Date())) {
    return { label: "Pasado", clase: "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700" }
  }
  return { label: "Activo", clase: "bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800" }
}

interface Props {
  turno: Turno
  compacto?: boolean
  onEditar?: () => void
  onCancelar?: () => void
}

export default function TarjetaTurno({ turno, compacto = false, onEditar, onCancelar }: Props) {
  const { label, clase } = badgeEstado(turno)
  const fechaFormateada = format(parseISO(turno.fecha), "EEEE d 'de' MMMM yyyy", { locale: es })
  const esActivo = turno.estado === "activo"

  if (compacto) {
    return (
      <div className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 transition-colors">
        <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
          <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-900 dark:text-slate-100 text-sm truncate">{turno.nombre_paciente}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{turno.hora}hs · {turno.tipo_consulta}</p>
        </div>
        <span className={cn("px-2 py-0.5 rounded-lg text-xs font-medium border", clase)}>
          {label}
        </span>
      </div>
    )
  }

  return (
    <div className="p-5 bg-white dark:bg-slate-800/80 rounded-2xl border border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 transition-colors shadow-sm group">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="font-semibold text-slate-900 dark:text-slate-100">{fechaFormateada}</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">{turno.hora}hs</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn("px-3 py-1 rounded-xl text-sm font-medium border", clase)}>
            {label}
          </span>
          {esActivo && (
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {onEditar && (
                <button
                  onClick={onEditar}
                  title="Editar turno"
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              )}
              {onCancelar && (
                <button
                  onClick={onCancelar}
                  title="Cancelar turno"
                  className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
          <User className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
          <span>{turno.nombre_paciente}</span>
        </div>
        <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
          <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
          <span>{turno.telefono}</span>
        </div>
        <div className="flex items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
          <Stethoscope className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0" />
          <span>{turno.tipo_consulta}</span>
        </div>
        {turno.notas && (
          <div className="flex items-start gap-2.5 text-sm text-slate-600 dark:text-slate-300">
            <FileText className="w-4 h-4 text-slate-400 dark:text-slate-500 flex-shrink-0 mt-0.5" />
            <span className="text-slate-500 dark:text-slate-400 italic">{turno.notas}</span>
          </div>
        )}
      </div>
    </div>
  )
}
