"use client"

import { useState, useEffect, KeyboardEvent } from "react"
import { X, Save, Info } from "lucide-react"
import type { Configuracion } from "@/lib/dominio/tipos"
import { ConfiguracionSchema } from "@/lib/dominio/tipos"
import { ZodError } from "zod"

interface Props {
  initialConfig: Configuracion
}

export default function FormularioConfig({ initialConfig }: Props) {
  const [form, setForm] = useState<Configuracion>(initialConfig)
  const [guardando, setGuardando] = useState(false)
  const [toast, setToast] = useState<{ tipo: "ok" | "error"; mensaje: string } | null>(null)
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [nuevoServicio, setNuevoServicio] = useState("")

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const set = (campo: keyof Configuracion, valor: string) => {
    setForm((prev) => ({ ...prev, [campo]: valor }))
    setErrores((prev) => ({ ...prev, [campo]: "" }))
  }

  const setHorario = (clave: keyof Configuracion["horarios"], valor: string) => {
    setForm((prev) => ({
      ...prev,
      horarios: { ...prev.horarios, [clave]: valor },
    }))
  }

  const agregarServicio = () => {
    const s = nuevoServicio.trim()
    if (!s || form.servicios.includes(s)) return
    setForm((prev) => ({ ...prev, servicios: [...prev.servicios, s] }))
    setNuevoServicio("")
  }

  const quitarServicio = (servicio: string) => {
    setForm((prev) => ({ ...prev, servicios: prev.servicios.filter((s) => s !== servicio) }))
  }

  const handleServicioKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault()
      agregarServicio()
    }
  }

  const handleGuardar = async () => {
    setErrores({})
    try {
      ConfiguracionSchema.parse(form)
    } catch (err) {
      if (err instanceof ZodError) {
        const nuevoErrores: Record<string, string> = {}
        err.errors.forEach((e) => {
          const campo = e.path.join(".")
          nuevoErrores[campo] = e.message
        })
        setErrores(nuevoErrores)
        setToast({ tipo: "error", mensaje: "Revisá los errores antes de guardar" })
        return
      }
    }

    setGuardando(true)
    try {
      const res = await fetch("/api/configuracion", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) {
        setToast({ tipo: "error", mensaje: data.error ?? "Uy, algo salió mal" })
      } else {
        setToast({ tipo: "ok", mensaje: "¡Listo! La configuración se guardó correctamente." })
      }
    } catch {
      setToast({ tipo: "error", mensaje: "Parece que se cortó la conexión. Revisá tu internet." })
    } finally {
      setGuardando(false)
    }
  }

  const inputClase = (campo: string) =>
    `w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-colors text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 ${
      errores[campo]
        ? "border-red-300 dark:border-red-700 bg-red-50 dark:bg-red-900/20 focus:border-red-400"
        : "border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 focus:border-blue-400 dark:focus:border-blue-500"
    }`

  return (
    <div className="space-y-6">
      {/* Banner informativo */}
      <div className="flex items-start gap-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 text-blue-800 dark:text-blue-300 text-sm">
        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
        <span>
          Estos datos los usa Sarah para responder. Cualquier cambio se aplica en la próxima conversación.
        </span>
      </div>

      {/* Toast */}
      {toast && (
        <div
          className={`flex items-center gap-3 p-4 rounded-xl text-sm font-medium ${
            toast.tipo === "ok"
              ? "bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300"
              : "bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800 text-red-800 dark:text-red-300"
          }`}
        >
          {toast.tipo === "ok" ? "✅" : "⚠️"} {toast.mensaje}
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        {/* Nombre */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Nombre de la clínica</label>
          <input
            value={form.nombre}
            onChange={(e) => set("nombre", e.target.value)}
            className={inputClase("nombre")}
            placeholder="Clínica Dental Sonrisa"
          />
          {errores.nombre && <p className="text-red-500 text-xs mt-1">{errores.nombre}</p>}
        </div>

        {/* Dirección */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Dirección</label>
          <input
            value={form.direccion}
            onChange={(e) => set("direccion", e.target.value)}
            className={inputClase("direccion")}
            placeholder="Av. Corrientes 1234, CABA"
          />
          {errores.direccion && <p className="text-red-500 text-xs mt-1">{errores.direccion}</p>}
        </div>

        {/* Teléfono */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Teléfono</label>
          <input
            value={form.telefono}
            onChange={(e) => set("telefono", e.target.value)}
            className={inputClase("telefono")}
            placeholder="+54 11 4567-8900"
          />
          {errores.telefono && <p className="text-red-500 text-xs mt-1">{errores.telefono}</p>}
        </div>

        {/* WhatsApp */}
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">WhatsApp</label>
          <input
            value={form.whatsapp}
            onChange={(e) => set("whatsapp", e.target.value)}
            className={inputClase("whatsapp")}
            placeholder="+54 9 11 4567-8900"
          />
          {errores.whatsapp && <p className="text-red-500 text-xs mt-1">{errores.whatsapp}</p>}
        </div>

        {/* Email */}
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            className={inputClase("email")}
            placeholder="contacto@dentalsonrisa.com.ar"
          />
          {errores.email && <p className="text-red-500 text-xs mt-1">{errores.email}</p>}
        </div>
      </div>

      {/* Horarios */}
      <div>
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">Horarios de atención</h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">Lunes a viernes</label>
            <input
              value={form.horarios.lunes_a_viernes}
              onChange={(e) => setHorario("lunes_a_viernes", e.target.value)}
              className={inputClase("horarios.lunes_a_viernes")}
              placeholder="09:00 a 18:00"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">Sábados</label>
            <input
              value={form.horarios.sabados}
              onChange={(e) => setHorario("sabados", e.target.value)}
              className={inputClase("horarios.sabados")}
              placeholder="09:00 a 18:00"
            />
          </div>
          <div>
            <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1.5">Domingos</label>
            <input
              value={form.horarios.domingos}
              onChange={(e) => setHorario("domingos", e.target.value)}
              className={inputClase("horarios.domingos")}
              placeholder="Cerrado"
            />
          </div>
        </div>
      </div>

      {/* Servicios */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Servicios</label>
        <div className="flex flex-wrap gap-2 mb-3">
          {form.servicios.map((s) => (
            <span
              key={s}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm border border-blue-100 dark:border-blue-800"
            >
              {s}
              <button
                onClick={() => quitarServicio(s)}
                className="hover:text-blue-900 dark:hover:text-blue-100 transition-colors"
                aria-label={`Quitar ${s}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            value={nuevoServicio}
            onChange={(e) => setNuevoServicio(e.target.value)}
            onKeyDown={handleServicioKey}
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-600 outline-none focus:border-blue-400 dark:focus:border-blue-500 transition-colors"
            placeholder="Escribí un servicio y presioná Enter para agregar..."
          />
          <button
            onClick={agregarServicio}
            className="px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            Agregar
          </button>
        </div>
        {errores.servicios && <p className="text-red-500 text-xs mt-1">{errores.servicios}</p>}
      </div>

      {/* Descripción */}
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">Descripción de la clínica</label>
        <textarea
          value={form.descripcion}
          onChange={(e) => set("descripcion", e.target.value)}
          rows={5}
          className={`${inputClase("descripcion")} resize-none leading-relaxed`}
          placeholder="Contá un poco sobre la clínica..."
        />
        {errores.descripcion && <p className="text-red-500 text-xs mt-1">{errores.descripcion}</p>}
      </div>

      <button
        onClick={handleGuardar}
        disabled={guardando}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <Save className="w-4 h-4" />
        {guardando ? "Guardando..." : "Guardar cambios"}
      </button>
    </div>
  )
}
