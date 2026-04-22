"use client"

import { useEffect, useState } from "react"
import { CalendarDays, List } from "lucide-react"
import type { Turno } from "@/lib/dominio/tipos"
import CalendarioTurnos from "@/components/panel/CalendarioTurnos"
import ListaTurnos from "@/components/panel/ListaTurnos"
import { cn } from "@/lib/utils"

type Vista = "calendario" | "lista"

export default function TurnosPage() {
  const [vista, setVista] = useState<Vista>("lista")
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const cargar = async () => {
      try {
        const res = await fetch("/api/turnos")
        const data = await res.json()
        setTurnos(data.turnos ?? [])
      } catch {
        // silencioso
      } finally {
        setCargando(false)
      }
    }
    cargar()
  }, [])

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Turnos</h1>
          <p className="text-slate-500 text-sm mt-1">
            {turnos.filter((t) => t.estado === "activo").length} turno
            {turnos.filter((t) => t.estado === "activo").length !== 1 ? "s" : ""} activo
            {turnos.filter((t) => t.estado === "activo").length !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Toggle de vista */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100">
          <button
            onClick={() => setVista("lista")}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
              vista === "lista"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <List className="w-4 h-4" />
            Lista
          </button>
          <button
            onClick={() => setVista("calendario")}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
              vista === "calendario"
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            )}
          >
            <CalendarDays className="w-4 h-4" />
            Calendario
          </button>
        </div>
      </div>

      {cargando ? (
        <div className="text-center py-16 text-slate-400">Cargando turnos...</div>
      ) : vista === "lista" ? (
        <ListaTurnos turnos={turnos} />
      ) : (
        <CalendarioTurnos turnos={turnos} />
      )}
    </div>
  )
}
