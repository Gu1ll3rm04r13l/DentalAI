"use client"

import { compareAsc, parseISO, parse } from "date-fns"
import type { Turno } from "@/lib/dominio/tipos"
import TarjetaTurno from "./TarjetaTurno"

interface Props {
  turnos: Turno[]
}

function ordenarTurnos(turnos: Turno[]): Turno[] {
  return [...turnos].sort((a, b) => {
    const fechaA = parseISO(`${a.fecha}T${a.hora}:00`)
    const fechaB = parseISO(`${b.fecha}T${b.hora}:00`)
    return compareAsc(fechaA, fechaB)
  })
}

export default function ListaTurnos({ turnos }: Props) {
  const activos = ordenarTurnos(turnos.filter((t) => t.estado === "activo"))
  const historial = ordenarTurnos(turnos.filter((t) => t.estado !== "activo"))

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-base font-semibold text-slate-900 mb-3">
          Turnos activos
          {activos.length > 0 && (
            <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 text-xs font-medium">
              {activos.length}
            </span>
          )}
        </h2>
        {activos.length === 0 ? (
          <p className="text-slate-400 text-sm py-4">No hay turnos activos por el momento.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activos.map((t) => (
              <TarjetaTurno key={t.id} turno={t} />
            ))}
          </div>
        )}
      </div>

      {historial.length > 0 && (
        <div>
          <h2 className="text-base font-semibold text-slate-500 mb-3">
            Historial
            <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-medium">
              {historial.length}
            </span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 opacity-70">
            {historial.map((t) => (
              <TarjetaTurno key={t.id} turno={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
