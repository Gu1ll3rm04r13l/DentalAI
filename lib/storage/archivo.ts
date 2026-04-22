import { promises as fs } from "fs"
import path from "path"
import os from "os"

export async function leerJSON<T>(filePath: string): Promise<T> {
  const absoluta = path.resolve(process.cwd(), filePath)
  const contenido = await fs.readFile(absoluta, "utf-8")
  return JSON.parse(contenido) as T
}

export async function escribirJSON(filePath: string, data: unknown): Promise<void> {
  const absoluta = path.resolve(process.cwd(), filePath)
  const dir = path.dirname(absoluta)
  const tmp = path.join(os.tmpdir(), `dental-ai-${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`)
  const contenido = JSON.stringify(data, null, 2)
  await fs.writeFile(tmp, contenido, "utf-8")
  await fs.mkdir(dir, { recursive: true })
  await fs.rename(tmp, absoluta)
}
