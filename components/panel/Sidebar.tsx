"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MessageCircle, ScrollText, CalendarDays, Settings, Sun, Moon } from "lucide-react"
import { cn } from "@/lib/utils"
import { useTheme } from "@/components/ThemeProvider"

const links = [
  { href: "/panel/chat", icono: MessageCircle, label: "Chat con Sarah" },
  { href: "/panel/historial", icono: ScrollText, label: "Historial" },
  { href: "/panel/turnos", icono: CalendarDays, label: "Turnos" },
  { href: "/panel/configuracion", icono: Settings, label: "Configuración" },
]

export default function Sidebar() {
  const pathname = usePathname()
  const { tema, toggleTema } = useTheme()

  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] bg-white dark:bg-slate-900 border-r border-slate-100 dark:border-slate-800 flex flex-col z-40 transition-colors duration-200">
      <div className="px-5 py-6 border-b border-slate-100 dark:border-slate-800">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-xl text-slate-900 dark:text-slate-100">
          <span className="text-2xl">🦷</span>
          <span>DentalAI</span>
        </Link>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map((link) => {
          const activo = pathname === link.href || pathname.startsWith(link.href)
          return (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150",
                activo
                  ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-slate-100"
              )}
            >
              <link.icono
                className={cn("w-4.5 h-4.5", activo ? "text-blue-600 dark:text-blue-400" : "text-slate-400 dark:text-slate-500")}
                style={{ width: "18px", height: "18px" }}
              />
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-5 py-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <p className="text-xs text-slate-400 dark:text-slate-500">
          Recepcionista virtual con IA
        </p>
        <button
          onClick={toggleTema}
          title={tema === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
          className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
        >
          {tema === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </aside>
  )
}
