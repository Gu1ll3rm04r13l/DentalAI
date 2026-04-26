"use client"

import { motion } from "framer-motion"
import { Clock, Calendar, MessageCircleHeart } from "lucide-react"

const beneficios = [
  {
    icono: Clock,
    titulo: "Atiende 24/7",
    descripcion:
      "Sarah no se va a dormir, no toma feriados y nunca corta con el paciente a las 18hs. Tus pacientes pueden agendar cuando quieran.",
    color: "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400",
  },
  {
    icono: Calendar,
    titulo: "Agenda sin errores",
    descripcion:
      "Verifica disponibilidad en tiempo real antes de confirmar cada turno. Nunca doble-turna, nunca agenda en días cerrados.",
    color: "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
  },
  {
    icono: MessageCircleHeart,
    titulo: "Habla como vos",
    descripcion:
      "Español rioplatense natural. Tutea, usa modismos porteños y suena como una recepcionista real, no como un bot de call center.",
    color: "bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400",
  },
]

export default function Beneficios() {
  return (
    <section className="py-20 px-4 bg-slate-50/50 dark:bg-slate-900/50">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-14"
        >
          <h2 className="text-4xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Todo lo que hace una buena recepcionista
          </h2>
          <p className="text-lg text-slate-500 dark:text-slate-400">Sin los lunes difíciles ni los feriados</p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {beneficios.map((b, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              className="bg-white dark:bg-slate-800/80 rounded-2xl p-6 border border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow duration-300"
            >
              <div className={`w-12 h-12 rounded-xl ${b.color} flex items-center justify-center mb-4`}>
                <b.icono className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">{b.titulo}</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm leading-relaxed">{b.descripcion}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
