import { NextRequest, NextResponse } from "next/server"
import { actualizarTurno } from "@/lib/storage/turnos"
import { EstadoTurnoSchema } from "@/lib/dominio/tipos"
import { z } from "zod"

export const dynamic = "force-dynamic"

const PatchBodySchema = z.object({
  nombre_paciente: z.string().min(1).optional(),
  telefono: z.string().min(1).optional(),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  hora: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  tipo_consulta: z.string().min(1).optional(),
  notas: z.string().optional(),
  estado: EstadoTurnoSchema.optional(),
})

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()
    const datos = PatchBodySchema.parse(body)
    const turno = await actualizarTurno(params.id, datos)
    if (!turno) return NextResponse.json({ error: "Turno no encontrado" }, { status: 404 })
    return NextResponse.json({ turno })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Datos inválidos", detalle: error.errors }, { status: 400 })
    }
    console.error("Error en PATCH /api/turnos/[id]:", error)
    return NextResponse.json({ error: "No se pudo actualizar el turno" }, { status: 500 })
  }
}
