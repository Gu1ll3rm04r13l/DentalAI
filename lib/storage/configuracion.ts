import { leerJSON, escribirJSON } from "./archivo"
import { ConfiguracionSchema, type Configuracion } from "../dominio/tipos"

const RUTA = "data/configuracion.json"

export async function leerConfiguracion(): Promise<Configuracion> {
  const data = await leerJSON<unknown>(RUTA)
  return ConfiguracionSchema.parse(data)
}

export async function guardarConfiguracion(config: Configuracion): Promise<Configuracion> {
  const validada = ConfiguracionSchema.parse(config)
  await escribirJSON(RUTA, validada)
  return validada
}
