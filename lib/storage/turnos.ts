import { leerJSON, escribirJSON } from "./archivo"
import { TurnoSchema, type Turno, type EstadoTurno } from "../dominio/tipos"
import { z } from "zod"

const RUTA = "data/turnos.json"

export async function listarTurnos(): Promise<Turno[]> {
  try {
    const data = await leerJSON<unknown[]>(RUTA)
    return z.array(TurnoSchema).parse(data)
  } catch {
    return []
  }
}

export async function crearTurno(
  datos: Omit<Turno, "id" | "estado" | "creado_en" | "actualizado_en">
): Promise<Turno> {
  const turnos = await listarTurnos()
  const ahora = new Date().toISOString()
  const nuevo: Turno = {
    ...datos,
    id: crypto.randomUUID(),
    estado: "activo",
    creado_en: ahora,
    actualizado_en: ahora,
  }
  turnos.push(nuevo)
  await escribirJSON(RUTA, turnos)
  return nuevo
}

export async function actualizarEstado(id: string, estado: EstadoTurno): Promise<Turno | null> {
  const turnos = await listarTurnos()
  const idx = turnos.findIndex((t) => t.id === id)
  if (idx === -1) return null
  turnos[idx] = { ...turnos[idx], estado, actualizado_en: new Date().toISOString() }
  await escribirJSON(RUTA, turnos)
  return turnos[idx]
}

export async function actualizarTurno(
  id: string,
  datos: Partial<Omit<Turno, "id" | "creado_en" | "actualizado_en">>
): Promise<Turno | null> {
  const turnos = await listarTurnos()
  const idx = turnos.findIndex((t) => t.id === id)
  if (idx === -1) return null
  turnos[idx] = { ...turnos[idx], ...datos, actualizado_en: new Date().toISOString() }
  await escribirJSON(RUTA, turnos)
  return turnos[idx]
}

export async function buscarTurnoPorId(id: string): Promise<Turno | null> {
  const turnos = await listarTurnos()
  return turnos.find((t) => t.id === id) ?? null
}

export async function buscarTurnosPorPaciente(
  nombre?: string,
  telefono?: string
): Promise<Turno[]> {
  const turnos = await listarTurnos()
  return turnos.filter((t) => {
    if (t.estado !== "activo") return false
    if (nombre && t.nombre_paciente.toLowerCase().includes(nombre.toLowerCase())) return true
    if (telefono && t.telefono.replace(/\D/g, "").includes(telefono.replace(/\D/g, ""))) return true
    return false
  })
}

export async function turnosActivosEnFecha(fecha: string): Promise<Turno[]> {
  const turnos = await listarTurnos()
  return turnos.filter((t) => t.fecha === fecha && t.estado === "activo")
}

export async function estaOcupado(fecha: string, hora: string): Promise<boolean> {
  const activos = await turnosActivosEnFecha(fecha)
  return activos.some((t) => t.hora === hora)
}

export function turnosActivosEnFechaFromList(fecha: string, turnos: Turno[]): Turno[] {
  return turnos.filter((t) => t.fecha === fecha && t.estado === "activo")
}

export function estaOcupadoFromList(fecha: string, hora: string, turnos: Turno[]): boolean {
  return turnos.some((t) => t.fecha === fecha && t.hora === hora && t.estado === "activo")
}
