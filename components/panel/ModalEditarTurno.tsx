"use client"

import { useEffect, useMemo, useState } from "react"
import { X } from "lucide-react"
import type { Turno } from "@/lib/dominio/tipos"
import { generarSlotsDelDia } from "@/lib/dominio/horarios"

const TODOS_LOS_SLOTS = generarSlotsDelDia()

const TIPOS_CONSULTA = [
  "Consulta general",
  "Limpieza dental",
  "Blanqueamiento",
  "Ortodoncia",
  "Extracción",
  "Endodoncia",
  "Implante",
  "Radiografía",
  "Control de brackets",
  "Otro",
]

interface Props {
  turno: Turno
  turnos: Turno[]
  cargando?: boolean
  onGuardar: (datos: Partial<Turno>) => void
  onCerrar: () => void
}

const inputCls = "w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-700 text-sm text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400 dark:placeholder:text-slate-500"

export default function ModalEditarTurno({ turno, turnos, cargando = false, onGuardar, onCerrar }: Props) {
  const [nombre, setNombre] = useState(turno.nombre_paciente)
  const [telefono, setTelefono] = useState(turno.telefono)
  const [fecha, setFecha] = useState(turno.fecha)
  const [hora, setHora] = useState(turno.hora)
  const [tipo, setTipo] = useState(turno.tipo_consulta)
  const [notas, setNotas] = useState(turno.notas ?? "")
  const [sobreturno, setSobreturno] = useState(false)

  const ocupados = useMemo(
    () =>
      turnos
        .filter((t) => t.fecha === fecha && t.estado === "activo" && t.id !== turno.id)
        .map((t) => t.hora),
    [turnos, fecha, turno.id]
  )

  const slotsVisibles = useMemo(
    () => (sobreturno ? [...TODOS_LOS_SLOTS] : TODOS_LOS_SLOTS.filter((s) => !ocupados.includes(s))),
    [sobreturno, ocupados]
  )

  // Si al cambiar fecha/sobreturno el hora actual queda fuera de los visibles, resetear al primero disponible
  useEffect(() => {
    if (!slotsVisibles.includes(hora)) {
      setHora(slotsVisibles[0] ?? TODOS_LOS_SLOTS[0])
    }
  }, [slotsVisibles, hora])

  function handleSobreturno(checked: boolean) {
    setSobreturno(checked)
    if (checked && !notas.toLowerCase().includes("sobreturno")) {
      setNotas((prev) => (prev.trim() ? `${prev.trim()} — sobreturno` : "sobreturno"))
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onGuardar({
      nombre_paciente: nombre.trim(),
      telefono: telefono.trim(),
      fecha,
      hora,
      tipo_consulta: tipo,
      notas: notas.trim() || undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCerrar} />
      <div className="relative bg-white dark:bg-slate-800 rounded-2xl shadow-xl w-full max-w-md border border-slate-100 dark:border-slate-700">
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-slate-100 dark:border-slate-700">
          <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">Editar turno</h2>
          <button
            onClick={onCerrar}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Nombre del paciente</label>
              <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} required className={inputCls} />
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Teléfono</label>
              <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} required className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Fecha</label>
              <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required className={inputCls} />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
                Hora
                {!sobreturno && ocupados.length > 0 && (
                  <span className="ml-1 text-slate-400 font-normal">({ocupados.length} ocupado{ocupados.length !== 1 ? "s" : ""})</span>
                )}
              </label>
              <select value={hora} onChange={(e) => setHora(e.target.value)} required className={inputCls}>
                {slotsVisibles.map((s) => (
                  <option key={s} value={s}>{s}hs</option>
                ))}
              </select>
            </div>

            {/* Sobreturno */}
            <div className="col-span-2">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={sobreturno}
                    onChange={(e) => handleSobreturno(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-colors" />
                  <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-slate-300 dark:bg-slate-500 peer-checked:bg-white peer-checked:translate-x-4 transition-all" />
                </div>
                <span className="text-sm text-slate-600 dark:text-slate-300 font-medium">Sobreturno</span>
                {sobreturno && (
                  <span className="text-xs text-blue-500 dark:text-blue-400">— todos los horarios disponibles</span>
                )}
              </label>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Tipo de consulta</label>
              <select value={tipo} onChange={(e) => setTipo(e.target.value)} required className={inputCls}>
                {TIPOS_CONSULTA.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
                {!TIPOS_CONSULTA.includes(tipo) && <option value={tipo}>{tipo}</option>}
              </select>
            </div>

            <div className="col-span-2">
              <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">Notas (opcional)</label>
              <textarea
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                rows={2}
                placeholder="Observaciones..."
                className={inputCls + " resize-none"}
              />
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-1">
            <button
              type="button"
              onClick={onCerrar}
              disabled={cargando}
              className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando || !nombre.trim() || !telefono.trim()}
              className="px-4 py-2 rounded-xl text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
            >
              {cargando ? "Guardando..." : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
