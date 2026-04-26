"use client"

import { useState } from "react"
import { DayPicker } from "react-day-picker"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import type { Turno } from "@/lib/dominio/tipos"
import TarjetaTurno from "./TarjetaTurno"
import "react-day-picker/style.css"

interface Props {
  turnos: Turno[]
}

export default function CalendarioTurnos({ turnos }: Props) {
  const [diaSeleccionado, setDiaSeleccionado] = useState<Date | undefined>(undefined)

  const turnosActivos = turnos.filter((t) => t.estado === "activo")

  const diasConTurnos = turnosActivos.reduce<Set<string>>((acc, t) => {
    acc.add(t.fecha)
    return acc
  }, new Set())

  const turnosDelDia = diaSeleccionado
    ? turnosActivos.filter(
        (t) => t.fecha === format(diaSeleccionado, "yyyy-MM-dd")
      )
    : []

  const modifiers = {
    conTurnos: (date: Date) => diasConTurnos.has(format(date, "yyyy-MM-dd")),
  }

  const modifiersStyles = {
    conTurnos: {
      fontWeight: "600",
    },
  }

  return (
    <div>
      <div className="flex justify-center">
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-4 shadow-sm">
          <DayPicker
            mode="single"
            selected={diaSeleccionado}
            onSelect={setDiaSeleccionado}
            locale={es}
            modifiers={modifiers}
            modifiersStyles={modifiersStyles}
            footer={
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-700 mt-2">
                <div className="w-2 h-2 rounded-full bg-blue-600" />
                <span className="text-xs text-slate-500 dark:text-slate-400">Días con turnos activos</span>
              </div>
            }
            components={{
              DayButton: ({ day, modifiers: dayMods, ...props }) => (
                <button {...props} className={`${props.className ?? ""} relative`}>
                  {day.date.getDate()}
                  {diasConTurnos.has(format(day.date, "yyyy-MM-dd")) && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-blue-500" />
                  )}
                </button>
              ),
            }}
          />
        </div>
      </div>

      {diaSeleccionado && (
        <div className="mt-6">
          <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-3">
            Turnos del{" "}
            {format(diaSeleccionado, "EEEE d 'de' MMMM", { locale: es })}
            {turnosDelDia.length > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium">
                {turnosDelDia.length}
              </span>
            )}
          </h3>
          {turnosDelDia.length === 0 ? (
            <p className="text-slate-400 dark:text-slate-500 text-sm">No hay turnos activos para este día.</p>
          ) : (
            <div className="space-y-2">
              {turnosDelDia
                .sort((a, b) => a.hora.localeCompare(b.hora))
                .map((t) => (
                  <TarjetaTurno key={t.id} turno={t} compacto />
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
