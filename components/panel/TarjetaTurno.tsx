import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { User, Phone, Clock, Stethoscope, FileText } from "lucide-react"
import type { Turno } from "@/lib/dominio/tipos"
import { cn } from "@/lib/utils"

const estadoConfig = {
  activo: { label: "Activo", clase: "bg-emerald-50 text-emerald-700 border-emerald-100" },
  cancelado: { label: "Cancelado", clase: "bg-red-50 text-red-700 border-red-100" },
  completado: { label: "Completado", clase: "bg-slate-50 text-slate-600 border-slate-100" },
}

interface Props {
  turno: Turno
  compacto?: boolean
}

export default function TarjetaTurno({ turno, compacto = false }: Props) {
  const config = estadoConfig[turno.estado]
  const fechaFormateada = format(parseISO(turno.fecha), "EEEE d 'de' MMMM yyyy", { locale: es })

  if (compacto) {
    return (
      <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-100 hover:border-slate-200 transition-colors">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
          <Clock className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-slate-900 text-sm truncate">{turno.nombre_paciente}</p>
          <p className="text-xs text-slate-500">{turno.hora}hs · {turno.tipo_consulta}</p>
        </div>
        <span className={cn("px-2 py-0.5 rounded-lg text-xs font-medium border", config.clase)}>
          {config.label}
        </span>
      </div>
    )
  }

  return (
    <div className="p-5 bg-white rounded-2xl border border-slate-100 hover:border-slate-200 transition-colors shadow-sm">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="font-semibold text-slate-900">{fechaFormateada}</p>
          <p className="text-2xl font-bold text-blue-600 mt-0.5">{turno.hora}hs</p>
        </div>
        <span className={cn("px-3 py-1 rounded-xl text-sm font-medium border", config.clase)}>
          {config.label}
        </span>
      </div>

      <div className="space-y-2.5">
        <div className="flex items-center gap-2.5 text-sm text-slate-600">
          <User className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span>{turno.nombre_paciente}</span>
        </div>
        <div className="flex items-center gap-2.5 text-sm text-slate-600">
          <Phone className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span>{turno.telefono}</span>
        </div>
        <div className="flex items-center gap-2.5 text-sm text-slate-600">
          <Stethoscope className="w-4 h-4 text-slate-400 flex-shrink-0" />
          <span>{turno.tipo_consulta}</span>
        </div>
        {turno.notas && (
          <div className="flex items-start gap-2.5 text-sm text-slate-600">
            <FileText className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <span className="text-slate-500 italic">{turno.notas}</span>
          </div>
        )}
      </div>
    </div>
  )
}
