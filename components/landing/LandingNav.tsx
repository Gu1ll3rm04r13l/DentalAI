"use client"

import Link from "next/link"
import { Sun, Moon } from "lucide-react"
import { useTheme } from "@/components/ThemeProvider"

export default function LandingNav() {
  const { tema, toggleTema } = useTheme()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-100 dark:border-slate-800 transition-colors duration-200">
      <Link href="/" className="flex items-center gap-2 font-bold text-xl text-slate-900 dark:text-slate-100">
        <span className="text-2xl">🦷</span>
        <span>DentalAI</span>
      </Link>
      <div className="flex items-center gap-3">
        <button
          onClick={toggleTema}
          title={tema === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
          {tema === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
        <Link
          href="/panel/chat"
          className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          Entrar al panel
        </Link>
      </div>
    </nav>
  )
}
