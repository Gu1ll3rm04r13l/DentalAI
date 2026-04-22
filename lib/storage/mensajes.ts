import { leerJSON, escribirJSON } from "./archivo"
import { MensajeSchema, type Mensaje, type RolMensaje } from "../dominio/tipos"
import { z } from "zod"

const RUTA = "data/mensajes.json"

export async function listarMensajes(): Promise<Mensaje[]> {
  try {
    const data = await leerJSON<unknown[]>(RUTA)
    return z.array(MensajeSchema).parse(data)
  } catch {
    return []
  }
}

export async function agregarMensaje(
  rol: RolMensaje,
  contenido: string,
  opciones?: { tool_calls?: unknown; tool_call_id?: string }
): Promise<Mensaje> {
  const mensajes = await listarMensajes()
  const nuevo: Mensaje = {
    id: crypto.randomUUID(),
    rol,
    contenido,
    timestamp: new Date().toISOString(),
    ...(opciones?.tool_calls !== undefined && { tool_calls: opciones.tool_calls }),
    ...(opciones?.tool_call_id !== undefined && { tool_call_id: opciones.tool_call_id }),
  }
  mensajes.push(nuevo)
  await escribirJSON(RUTA, mensajes)
  return nuevo
}

export async function borrarTodoElHistorial(): Promise<void> {
  await escribirJSON(RUTA, [])
}
