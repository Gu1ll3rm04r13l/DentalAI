import { promises as fs } from "fs"
import path from "path"

export async function leerJSON<T>(filePath: string): Promise<T> {
  const absoluta = path.resolve(process.cwd(), filePath)
  const contenido = await fs.readFile(absoluta, "utf-8")
  return JSON.parse(contenido) as T
}

export async function escribirJSON(filePath: string, data: unknown): Promise<void> {
  const absoluta = path.resolve(process.cwd(), filePath)
  const dir = path.dirname(absoluta)
  await fs.mkdir(dir, { recursive: true })
  const tmp = path.join(
    dir,
    `.${path.basename(absoluta)}.${Date.now()}-${Math.random().toString(36).slice(2)}.tmp`
  )
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf-8")
  await fs.rename(tmp, absoluta)
}
