"use client"

import { useEffect, useRef } from "react"
import { format, parseISO } from "date-fns"
import { es } from "date-fns/locale"
import { motion, AnimatePresence } from "framer-motion"
import type { MensajeChat } from "@/store/chatStore"
import IndicadorEscribiendo from "./IndicadorEscribiendo"

interface Props {
  mensajes: MensajeChat[]
  cargando: boolean
}

export default function ListaMensajes({ mensajes, cargando }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [mensajes, cargando])

  return (
    <div className="flex flex-col gap-4 p-5">
      <AnimatePresence initial={false}>
        {mensajes.map((m) => (
          <motion.div
            key={m.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className={`flex items-end gap-2 ${m.rol === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.rol === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-base flex-shrink-0">
                🦷
              </div>
            )}
            <div className={`flex flex-col ${m.rol === "user" ? "items-end" : "items-start"} max-w-[75%]`}>
              <div
                className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  m.rol === "user"
                    ? "bg-blue-600 text-white rounded-br-sm"
                    : "bg-slate-100 text-slate-800 rounded-bl-sm"
                }`}
              >
                {m.contenido}
              </div>
              <span className="text-xs text-slate-400 mt-1 px-1">
                {format(parseISO(m.timestamp), "HH:mm", { locale: es })}
              </span>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {cargando && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <IndicadorEscribiendo />
        </motion.div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
