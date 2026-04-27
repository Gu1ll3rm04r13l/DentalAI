"use client"

import { useEffect, useState } from "react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { RefreshCw, User, Bot, Wrench } from "lucide-react"
import type { Mensaje } from "@/lib/dominio/tipos"

function etiquetaRol(rol: string): { label: string; clase: string; icono: React.ReactNode } {
  switch (rol) {
    case "user":
      return {
        label: "Paciente",
        clase: "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-800",
        icono: <User className="w-3.5 h-3.5" />,
      }
    case "assistant":
      return {
        label: "Sarah",
        clase: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800",
        icono: <Bot className="w-3.5 h-3.5" />,
      }
    default:
      return {
        label: "Sistema",
        clase: "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-100 dark:border-slate-700",
        icono: <Wrench className="w-3.5 h-3.5" />,
      }
  }
}

function formatearContenido(mensaje: Mensaje): string {
  if (mensaje.rol === "tool") {
    try {
      const parsed = JSON.parse(mensaje.contenido)
      return `🔧 Resultado: ${parsed.mensaje ?? mensaje.contenido}`
    } catch {
      return `🔧 ${mensaje.contenido}`
    }
  }
  if (mensaje.tool_calls) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const calls = mensaje.tool_calls as any[]
      const nombres = calls.map((c) => c.function?.name ?? "tool").join(", ")
      return `🔧 Sarah usó: ${nombres}${mensaje.contenido ? `\n${mensaje.contenido}` : ""}`
    } catch {
      return mensaje.contenido
    }
  }
  return mensaje.contenido
}

export default function HistorialPage() {
  const [mensajes, setMensajes] = useState<Mensaje[]>([])
  const [cargando, setCargando] = useState(true)

  const cargar = async () => {
    try {
      const res = await fetch("/api/mensajes")
      const data = await res.json()
      setMensajes(data.mensajes ?? [])
    } catch {
      // silencioso
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => {
    cargar()
  }, [])

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Historial de conversación</h1>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
            {mensajes.length} mensaje{mensajes.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={cargar}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${cargando ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {cargando && mensajes.length === 0 ? (
        <div className="text-center py-16 text-slate-400">Cargando historial...</div>
      ) : mensajes.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-400">Todavía no hay mensajes en el historial.</p>
          <p className="text-slate-400 text-sm mt-1">Chateá con Sarah para que aparezcan acá.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {mensajes.map((m) => {
            const { label, clase, icono } = etiquetaRol(m.rol)
            const contenido = formatearContenido(m)
            return (
              <div
                key={m.id}
                className="flex items-start gap-4 p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 transition-colors"
              >
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium flex-shrink-0 ${clase}`}>
                  {icono}
                  {label}
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-sm text-slate-700 dark:text-slate-300 truncate"
                    title={contenido}
                  >
                    {contenido.length > 120 ? `${contenido.slice(0, 120)}...` : contenido}
                  </p>
                </div>
                <span className="text-xs text-slate-400 dark:text-slate-500 flex-shrink-0 whitespace-nowrap">
                  {format(parseISO(m.timestamp), "dd/MM/yyyy HH:mm", { locale: es })}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
