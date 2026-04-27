import { NextResponse } from "next/server"
import { listarTurnos, limpiarTurnosViejos } from "@/lib/storage/turnos"

export const dynamic = "force-dynamic"

export async function GET() {
  try {
    await limpiarTurnosViejos()
    const turnos = await listarTurnos()
    return NextResponse.json({ turnos })
  } catch (error) {
    console.error("Error en GET /api/turnos:", error)
    return NextResponse.json({ error: "No se pudo leer los turnos" }, { status: 500 })
  }
}
