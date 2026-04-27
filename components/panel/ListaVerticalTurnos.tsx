"use client"

import { useState, useMemo } from "react"
import { format, parseISO, isBefore } from "date-fns"
import { es } from "date-fns/locale"
import { Pencil, X, Trash2, ChevronDown, ChevronRight, Search } from "lucide-react"
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
    return { label: "Terminado", clase: "bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400" }
  }
  return { label: "Activo", clase: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400" }
}

interface Props {
  turnos: Turno[]
  onEditar: (turno: Turno) => void
  onCancelar: (turno: Turno) => void
  onEliminar: (turno: Turno) => void
}

const COLS = "grid-cols-[80px_1fr_1fr_120px_160px_100px_80px]"

export default function ListaVerticalTurnos({ turnos, onEditar, onCancelar, onEliminar }: Props) {
  const [busqueda, setBusqueda] = useState("")
  const [diasColapsados, setDiasColapsados] = useState<Set<string>>(new Set())

  const hoy = format(new Date(), "yyyy-MM-dd")

  const grupos = useMemo(() => {
    const q = busqueda.trim().toLowerCase()
    const filtrados = q
      ? turnos.filter((t) => t.nombre_paciente.toLowerCase().includes(q))
      : turnos

    const map = new Map<string, Turno[]>()
    for (const t of filtrados) {
      if (!map.has(t.fecha)) map.set(t.fecha, [])
      map.get(t.fecha)!.push(t)
    }

    for (const lista of map.values()) {
      lista.sort((a, b) => a.hora.localeCompare(b.hora))
    }

    const fechas = [...map.keys()]
    const futuras = fechas.filter((f) => f >= hoy).sort()
    const pasadas = fechas.filter((f) => f < hoy).sort().reverse()

    return [...futuras, ...pasadas].map((fecha) => ({
      fecha,
      esFutura: fecha >= hoy,
      esHoy: fecha === hoy,
      turnos: map.get(fecha)!,
    }))
  }, [turnos, busqueda, hoy])

  const primerFuturo = grupos.find((g) => g.esFutura && !g.esHoy)?.fecha

  const toggleDia = (fecha: string) => {
    setDiasColapsados((prev) => {
      const next = new Set(prev)
      if (next.has(fecha)) next.delete(fecha)
      else next.add(fecha)
      return next
    })
  }

  const expandirTodo = () => setDiasColapsados(new Set())
  const colapsarTodo = () => setDiasColapsados(new Set(grupos.map((g) => g.fecha)))

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar paciente..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400 transition-colors"
          />
        </div>
        <button
          onClick={expandirTodo}
          className="px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          Desplegar todo
        </button>
        <button
          onClick={colapsarTodo}
          className="px-3 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
        >
          Colapsar todo
        </button>
      </div>

      {/* Tabla */}
      <div className="rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800/80">
        {/* Header */}
        <div className={cn("grid gap-0 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border-b border-slate-100 dark:border-slate-700", COLS)}>
          {["Hora", "Paciente", "Notas", "Teléfono", "Tipo", "Estado", ""].map((col) => (
            <span key={col} className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
              {col}
            </span>
          ))}
        </div>

        {grupos.length === 0 && (
          <p className="text-sm text-slate-400 dark:text-slate-500 py-8 text-center">
            {busqueda ? "No hay turnos que coincidan con la búsqueda." : "No hay turnos."}
          </p>
        )}

        {grupos.map(({ fecha, esHoy, esFutura, turnos: turnosDia }, gi) => {
          const colapsado = diasColapsados.has(fecha)
          const fechaLabel = format(parseISO(fecha), "EEEE d 'de' MMMM yyyy", { locale: es })
          const esPrimeroFuturo = fecha === primerFuturo

          return (
            <div
              key={fecha}
              className={cn(gi > 0 && "border-t border-slate-200 dark:border-slate-700")}
            >
              {/* Day header */}
              <button
                onClick={() => toggleDia(fecha)}
                className={cn(
                  "w-full flex items-center gap-2 px-4 py-2.5 transition-colors text-left",
                  esFutura
                    ? "bg-slate-50/80 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-700/60"
                    : "bg-slate-100/60 dark:bg-slate-900/40 hover:bg-slate-200/60 dark:hover:bg-slate-800/60"
                )}
              >
                {colapsado
                  ? <ChevronRight className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                  : <ChevronDown className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                }
                <span className={cn(
                  "text-sm font-semibold capitalize",
                  esFutura ? "text-slate-700 dark:text-slate-200" : "text-slate-400 dark:text-slate-500"
                )}>
                  {fechaLabel}
                </span>
                {esHoy && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-blue-500 text-white">HOY</span>
                )}
                {esPrimeroFuturo && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">PRÓXIMO</span>
                )}
                <span className="ml-auto text-xs text-slate-400 dark:text-slate-500">
                  {turnosDia.length} turno{turnosDia.length !== 1 ? "s" : ""}
                </span>
              </button>

              {/* Filas del día */}
              {!colapsado && turnosDia.map((turno, i) => {
                const { label, clase } = getBadge(turno)
                const esActivo = turno.estado === "activo"

                return (
                  <div
                    key={turno.id}
                    className={cn(
                      "grid gap-0 px-4 py-3 items-center transition-colors",
                      COLS,
                      i % 2 === 0
                        ? "bg-white dark:bg-slate-800/80"
                        : "bg-slate-50/60 dark:bg-slate-800/40",
                      "hover:bg-blue-50/40 dark:hover:bg-slate-700/60",
                      i < turnosDia.length - 1 && "border-b border-slate-100 dark:border-slate-700/50"
                    )}
                  >
                    <span className="text-sm font-bold text-blue-600 dark:text-blue-400">{turno.hora}hs</span>
                    <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate pr-2">{turno.nombre_paciente}</span>
                    <span className="text-sm text-slate-400 dark:text-slate-500 truncate pr-2 italic">{turno.notas || "—"}</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400 truncate pr-2">{turno.telefono}</span>
                    <span className="text-sm text-slate-600 dark:text-slate-300 truncate pr-2">{turno.tipo_consulta}</span>
                    <span className={cn("text-xs font-medium px-2.5 py-1 rounded-xl w-fit", clase)}>{label}</span>
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        onClick={() => onEditar(turno)}
                        title="Editar"
                        className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      {esActivo ? (
                        <button
                          onClick={() => onCancelar(turno)}
                          title="Cancelar turno"
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      ) : (
                        <button
                          onClick={() => onEliminar(turno)}
                          title="Eliminar turno"
                          className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-100 dark:hover:bg-red-900/40 text-slate-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
