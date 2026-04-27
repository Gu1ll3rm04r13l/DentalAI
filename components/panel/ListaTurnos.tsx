"use client"

import { useState } from "react"
import { compareAsc, parseISO } from "date-fns"
import type { Turno } from "@/lib/dominio/tipos"
import TarjetaTurno from "./TarjetaTurno"
import ModalEditarTurno from "./ModalEditarTurno"
import DialogoConfirmar from "./DialogoConfirmar"

interface Props {
  turnos: Turno[]
  onActualizar: (turno: Turno) => void
  onEliminar: (id: string) => void
}

function ordenarTurnos(turnos: Turno[]): Turno[] {
  return [...turnos].sort((a, b) => {
    const fechaA = parseISO(`${a.fecha}T${a.hora}:00`)
    const fechaB = parseISO(`${b.fecha}T${b.hora}:00`)
    return compareAsc(fechaA, fechaB)
  })
}

export default function ListaTurnos({ turnos, onActualizar, onEliminar }: Props) {
  const [editando, setEditando] = useState<Turno | null>(null)
  const [cancelando, setCancelando] = useState<Turno | null>(null)
  const [cargando, setCargando] = useState(false)

  const activos = ordenarTurnos(turnos.filter((t) => t.estado === "activo"))
  const historial = ordenarTurnos(turnos.filter((t) => t.estado !== "activo"))

  async function handleGuardarEdicion(datos: Partial<Turno>) {
    if (!editando) return
    setCargando(true)
    try {
      const res = await fetch(`/api/turnos/${editando.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      })
      if (!res.ok) throw new Error("Error al guardar")
      const { turno } = await res.json()
      onActualizar(turno)
      setEditando(null)
    } catch {
      // silencioso — mantener modal abierto
    } finally {
      setCargando(false)
    }
  }

  async function handleConfirmarCancelar() {
    if (!cancelando) return
    setCargando(true)
    try {
      const res = await fetch(`/api/turnos/${cancelando.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "cancelado" }),
      })
      if (!res.ok) throw new Error("Error al cancelar")
      onEliminar(cancelando.id)
      setCancelando(null)
    } catch {
      // silencioso — mantener dialogo abierto
    } finally {
      setCargando(false)
    }
  }

  return (
    <>
      <div className="space-y-8">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-3">
            Turnos activos
            {activos.length > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-xs font-medium">
                {activos.length}
              </span>
            )}
          </h2>
          {activos.length === 0 ? (
            <p className="text-slate-400 dark:text-slate-500 text-sm py-4">No hay turnos activos por el momento.</p>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activos.map((t) => (
                <TarjetaTurno
                  key={t.id}
                  turno={t}
                  onEditar={() => setEditando(t)}
                  onCancelar={() => setCancelando(t)}
                />
              ))}
            </div>
          )}
        </div>

        {historial.length > 0 && (
          <div>
            <h2 className="text-base font-semibold text-slate-500 dark:text-slate-400 mb-3">
              Historial
              <span className="ml-2 px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-medium">
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

      {editando && (
        <ModalEditarTurno
          turno={editando}
          turnos={turnos}
          cargando={cargando}
          onGuardar={handleGuardarEdicion}
          onCerrar={() => setEditando(null)}
        />
      )}

      {cancelando && (
        <DialogoConfirmar
          titulo="¿Cancelar este turno?"
          descripcion={`Vas a cancelar el turno de ${cancelando.nombre_paciente} del ${cancelando.fecha} a las ${cancelando.hora}hs. Esta acción no se puede deshacer.`}
          labelConfirmar="Sí, cancelar turno"
          cargando={cargando}
          onConfirmar={handleConfirmarCancelar}
          onCancelar={() => setCancelando(null)}
        />
      )}
    </>
  )
}
