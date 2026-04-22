"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"

export default function Hero() {
  return (
    <section className="relative overflow-hidden pt-24 pb-20 px-4">
      <div className="absolute inset-0 -z-10">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-blue-100/40 rounded-full blur-3xl" />
      </div>

      <div className="max-w-4xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-600 text-sm font-medium mb-8"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Potenciado por IA</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-5xl md:text-6xl lg:text-7xl font-bold text-slate-900 leading-tight tracking-tight mb-6"
        >
          Tu recepcionista virtual
          <br />
          <span className="text-blue-600">que nunca duerme</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-xl text-slate-500 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Sarah agenda turnos, responde consultas y atiende a tus pacientes las 24hs,
          hablando en español rioplatense como una recepcionista real.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center"
        >
          <Link
            href="/panel/chat"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-blue-600 text-white font-semibold text-lg hover:bg-blue-700 transition-all duration-200 shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:-translate-y-0.5"
          >
            Probar DentalAI
            <ArrowRight className="w-5 h-5" />
          </Link>
          <span className="text-slate-400 text-sm">Sin registro · Gratis para probar</span>
        </motion.div>
      </div>
    </section>
  )
}
