import { NextResponse } from "next/server"
import { listarMensajes, borrarTodoElHistorial } from "@/lib/storage/mensajes"

export async function GET() {
  try {
    const mensajes = await listarMensajes()
    return NextResponse.json({ mensajes })
  } catch (error) {
    console.error("Error en GET /api/mensajes:", error)
    return NextResponse.json({ error: "No se pudo leer el historial" }, { status: 500 })
  }
}

export async function DELETE() {
  try {
    await borrarTodoElHistorial()
    return NextResponse.json({ ok: true, mensaje: "Historial borrado correctamente" })
  } catch (error) {
    console.error("Error en DELETE /api/mensajes:", error)
    return NextResponse.json({ error: "No se pudo borrar el historial" }, { status: 500 })
  }
}
