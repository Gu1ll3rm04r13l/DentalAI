"use client"

import { motion } from "framer-motion"
import Link from "next/link"
import { ArrowRight } from "lucide-react"

export default function CTAFinal() {
  return (
    <section className="py-24 px-4">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto text-center rounded-3xl bg-gradient-to-br from-blue-600 to-blue-700 p-14 shadow-2xl shadow-blue-200"
      >
        <h2 className="text-4xl font-bold text-white mb-4">
          Probalo sin compromiso
        </h2>
        <p className="text-blue-100 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
          Entrá al panel, chateá con Sarah y agendá tu primer turno. No hace falta registro ni tarjeta de crédito.
        </p>
        <Link
          href="/panel/chat"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-2xl bg-white text-blue-600 font-semibold text-lg hover:bg-blue-50 transition-all duration-200 shadow-lg hover:-translate-y-0.5"
        >
          Entrar al panel
          <ArrowRight className="w-5 h-5" />
        </Link>
      </motion.div>
    </section>
  )
}
