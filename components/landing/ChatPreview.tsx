"use client"

import { motion } from "framer-motion"

const mensajes = [
  { rol: "user", texto: "Hola, quiero sacar un turno para limpieza dental" },
  {
    rol: "assistant",
    texto: "¡Hola! 👋 Con gusto te ayudo. ¿Para qué fecha lo necesitás?",
  },
  { rol: "user", texto: "Para el próximo jueves" },
  {
    rol: "assistant",
    texto: "El jueves 24 tengo estos horarios libres: 09:00, 10:30, 14:00, 15:30 y 17:00. ¿Alguno te sirve?",
  },
]

export default function ChatPreview() {
  return (
    <section className="py-16 px-4">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="rounded-3xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl shadow-slate-200/60 dark:shadow-slate-900/60 overflow-hidden"
        >
          {/* Header de la ventana */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/50">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400" />
              <div className="w-3 h-3 rounded-full bg-yellow-400" />
              <div className="w-3 h-3 rounded-full bg-green-400" />
            </div>
            <div className="flex-1 text-center">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Chat con Sarah</span>
            </div>
            <div className="w-12" />
          </div>

          {/* Mensajes */}
          <div className="p-5 space-y-4 min-h-[280px]">
            {mensajes.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.15 }}
                className={`flex items-end gap-2 ${m.rol === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.rol === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-base flex-shrink-0">
                    🦷
                  </div>
                )}
                <div
                  className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                    m.rol === "user"
                      ? "bg-blue-600 text-white rounded-br-sm"
                      : "bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-bl-sm"
                  }`}
                >
                  {m.texto}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Input simulado */}
          <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-300 dark:text-slate-600 text-sm flex-1">Escribí tu mensaje...</span>
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
