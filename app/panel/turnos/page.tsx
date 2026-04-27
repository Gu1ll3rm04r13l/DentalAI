"use client"

import { useCallback, useEffect, useState } from "react"
import { CalendarDays, List, LayoutGrid } from "lucide-react"
import type { Turno } from "@/lib/dominio/tipos"
import CalendarioTurnos from "@/components/panel/CalendarioTurnos"
import ListaTurnos from "@/components/panel/ListaTurnos"
import ListaVerticalTurnos from "@/components/panel/ListaVerticalTurnos"
import ModalEditarTurno from "@/components/panel/ModalEditarTurno"
import DialogoConfirmar from "@/components/panel/DialogoConfirmar"
import { cn } from "@/lib/utils"

type Vista = "tarjetas" | "lista" | "calendario"

export default function TurnosPage() {
  const [vista, setVista] = useState<Vista>("tarjetas")
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [cargando, setCargando] = useState(true)

  const [editando, setEditando] = useState<Turno | null>(null)
  const [cancelando, setCancelando] = useState<Turno | null>(null)
  const [eliminando, setEliminando] = useState<Turno | null>(null)
  const [guardando, setGuardando] = useState(false)

  const cargar = useCallback(async () => {
    try {
      const res = await fetch("/api/turnos")
      const data = await res.json()
      setTurnos(data.turnos ?? [])
    } catch {
      // silencioso
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  function handleActualizar(turnoActualizado: Turno) {
    setTurnos((prev) => prev.map((t) => (t.id === turnoActualizado.id ? turnoActualizado : t)))
  }

  function handleEliminarLocal(id: string) {
    setTurnos((prev) => prev.filter((t) => t.id !== id))
  }

  async function handleGuardarEdicion(datos: Partial<Turno>) {
    if (!editando) return
    setGuardando(true)
    try {
      const res = await fetch(`/api/turnos/${editando.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(datos),
      })
      if (!res.ok) throw new Error()
      const { turno } = await res.json()
      handleActualizar(turno)
      setEditando(null)
    } catch {
      // silencioso
    } finally {
      setGuardando(false)
    }
  }

  async function handleConfirmarCancelar() {
    if (!cancelando) return
    setGuardando(true)
    try {
      const res = await fetch(`/api/turnos/${cancelando.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado: "cancelado" }),
      })
      if (!res.ok) throw new Error()
      const { turno } = await res.json()
      handleActualizar(turno)
      setCancelando(null)
    } catch {
      // silencioso
    } finally {
      setGuardando(false)
    }
  }

  async function handleConfirmarEliminar() {
    if (!eliminando) return
    setGuardando(true)
    try {
      const res = await fetch(`/api/turnos/${eliminando.id}`, { method: "DELETE" })
      if (!res.ok) throw new Error()
      handleEliminarLocal(eliminando.id)
      setEliminando(null)
    } catch {
      // silencioso
    } finally {
      setGuardando(false)
    }
  }

  const vistas: { key: Vista; label: string; icono: React.ElementType }[] = [
    { key: "tarjetas", label: "Tarjetas", icono: LayoutGrid },
    { key: "lista", label: "Lista", icono: List },
    { key: "calendario", label: "Calendario", icono: CalendarDays },
  ]

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Turnos</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {turnos.filter((t) => t.estado === "activo").length} turno
            {turnos.filter((t) => t.estado === "activo").length !== 1 ? "s" : ""} activo
            {turnos.filter((t) => t.estado === "activo").length !== 1 ? "s" : ""}
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800">
          {vistas.map(({ key, label, icono: Icono }) => (
            <button
              key={key}
              onClick={() => setVista(key)}
              className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150",
                vista === key
                  ? "bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
              )}
            >
              <Icono className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {cargando ? (
        <div className="text-center py-16 text-slate-400 dark:text-slate-500">Cargando turnos...</div>
      ) : vista === "tarjetas" ? (
        <ListaTurnos
          turnos={turnos}
          onActualizar={handleActualizar}
          onEliminar={handleEliminarLocal}
        />
      ) : vista === "lista" ? (
        <ListaVerticalTurnos
          turnos={turnos}
          onEditar={setEditando}
          onCancelar={setCancelando}
          onEliminar={setEliminando}
        />
      ) : (
        <CalendarioTurnos turnos={turnos} />
      )}

      {editando && (
        <ModalEditarTurno
          turno={editando}
          turnos={turnos}
          cargando={guardando}
          onGuardar={handleGuardarEdicion}
          onCerrar={() => setEditando(null)}
        />
      )}

      {cancelando && (
        <DialogoConfirmar
          titulo="¿Cancelar este turno?"
          descripcion={`Vas a cancelar el turno de ${cancelando.nombre_paciente} del ${cancelando.fecha} a las ${cancelando.hora}hs. Esta acción no se puede deshacer.`}
          labelConfirmar="Sí, cancelar turno"
          cargando={guardando}
          onConfirmar={handleConfirmarCancelar}
          onCancelar={() => setCancelando(null)}
        />
      )}

      {eliminando && (
        <DialogoConfirmar
          titulo="¿Eliminar este turno?"
          descripcion={`Vas a eliminar permanentemente el turno de ${eliminando.nombre_paciente} del ${eliminando.fecha} a las ${eliminando.hora}hs. Esta acción no se puede deshacer.`}
          labelConfirmar="Sí, eliminar"
          cargando={guardando}
          onConfirmar={handleConfirmarEliminar}
          onCancelar={() => setEliminando(null)}
        />
      )}
    </div>
  )
}
