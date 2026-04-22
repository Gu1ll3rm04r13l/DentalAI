import { NextRequest, NextResponse } from "next/server"
import { leerConfiguracion, guardarConfiguracion } from "@/lib/storage/configuracion"
import { ConfiguracionSchema } from "@/lib/dominio/tipos"
import { ZodError } from "zod"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    const config = await leerConfiguracion()
    return NextResponse.json({ configuracion: config })
  } catch (error) {
    console.error("Error en GET /api/configuracion:", error)
    return NextResponse.json({ error: "No se pudo leer la configuración" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json()
    const validada = ConfiguracionSchema.parse(body)
    const guardada = await guardarConfiguracion(validada)
    return NextResponse.json({ configuracion: guardada, mensaje: "Configuración guardada correctamente" })
  } catch (error) {
    if (error instanceof ZodError) {
      const mensajes = error.errors.map((e) => e.message).join(". ")
      return NextResponse.json({ error: mensajes }, { status: 400 })
    }
    console.error("Error en PUT /api/configuracion:", error)
    return NextResponse.json({ error: "No se pudo guardar la configuración" }, { status: 500 })
  }
}
