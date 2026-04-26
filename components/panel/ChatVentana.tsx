"use client"

import { useEffect, useRef, useState, KeyboardEvent } from "react"
import { Send, RotateCcw } from "lucide-react"
import { useChatStore } from "@/store/chatStore"
import ListaMensajes from "./ListaMensajes"
import SugerenciasIniciales from "./SugerenciasIniciales"

export default function ChatVentana() {
  const { mensajes, cargando, herramientaActiva, enviarMensaje, nuevaConversacion, sincronizarConServidor } = useChatStore()

  const ETIQUETAS_TOOLS: Record<string, string> = {
    ver_disponibilidad: "Consultando disponibilidad...",
    ver_turnos_paciente: "Buscando turnos del paciente...",
    agendar_turno: "Agendando turno...",
    cancelar_turno: "Cancelando turno...",
    reprogramar_turno: "Reprogramando turno...",
  }
  const etiquetaTool = herramientaActiva
    ? (ETIQUETAS_TOOLS[herramientaActiva] ?? "Procesando...")
    : null
  const [input, setInput] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    sincronizarConServidor()
  }, [sincronizarConServidor])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 96)}px`
    }
  }, [input])

  const handleEnviar = async () => {
    const texto = input.trim()
    if (!texto || cargando) return
    setInput("")
    await enviarMensaje(texto)
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleEnviar()
    }
  }

  const handleNuevaConversacion = async () => {
    await nuevaConversacion()
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white">
        <div>
          <h1 className="font-semibold text-slate-900">Sarah</h1>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-500">Recepcionista virtual · En línea</span>
          </div>
        </div>
        <button
          onClick={handleNuevaConversacion}
          className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-600 hover:bg-slate-100 transition-colors"
          title="Nueva conversación"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Nueva conversación</span>
        </button>
      </div>

      {/* Mensajes */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {mensajes.length === 0 ? (
          <SugerenciasIniciales onSugerencia={(texto) => enviarMensaje(texto)} />
        ) : (
          <ListaMensajes mensajes={mensajes} cargando={cargando} />
        )}
        {etiquetaTool && (
          <div className="px-6 py-2 text-xs text-slate-500 italic">{etiquetaTool}</div>
        )}
      </div>

      {/* Input */}
      <div className="px-5 py-4 border-t border-slate-100 bg-white">
        <div className="flex items-end gap-3 px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50/50 focus-within:border-blue-300 focus-within:bg-white transition-all duration-150">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribí tu mensaje... (Enter para enviar, Shift+Enter para nueva línea)"
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-slate-800 placeholder:text-slate-400 leading-relaxed"
            style={{ maxHeight: "96px" }}
            disabled={cargando}
          />
          <button
            onClick={handleEnviar}
            disabled={!input.trim() || cargando}
            className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white hover:bg-blue-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-slate-400 mt-2 text-center">
          Sarah puede cometer errores. Verificá la información importante.
        </p>
      </div>
    </div>
  )
}
