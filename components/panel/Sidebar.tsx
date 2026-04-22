"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { MessageCircle, ScrollText, CalendarDays, Settings } from "lucide-react"
import { cn } from "@/lib/utils"

const links = [
  { href: "/panel/chat", icono: MessageCircle, label: "Chat con Sarah" },
  { href: "/panel/historial", icono: ScrollText, label: "Historial" },
  { href: "/panel/turnos", icono: CalendarDays, label: "Turnos" },
  { href: "/panel/configuracion", icono: Settings, label: "Configuración" },
]

export default function Sidebar() {
  const pathname = usePathname()

  return (
    <aside className="fixed left-0 top-0 h-full w-[260px] bg-white border-r border-slate-100 flex flex-col z-40">
      <div className="px-5 py-6 border-b border-slate-100">
        <Link href="/" className="flex items-center gap-2.5 font-bold text-xl text-slate-900">
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
                  ? "bg-blue-50 text-blue-700"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <link.icono
                className={cn("w-4.5 h-4.5", activo ? "text-blue-600" : "text-slate-400")}
                style={{ width: "18px", height: "18px" }}
              />
              {link.label}
            </Link>
          )
        })}
      </nav>

      <div className="px-5 py-4 border-t border-slate-100">
        <p className="text-xs text-slate-400">
          Recepcionista virtual con IA
        </p>
      </div>
    </aside>
  )
}
