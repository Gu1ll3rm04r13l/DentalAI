# Optimización del proyecto Clínica Dental Sonrisa

**Fecha**: 2026-04-26
**Tipo**: Refactor quirúrgico (bugs + performance + UX + code quality)
**Filosofía**: Mantener storage en JSON (proyecto demo, sin DB)

---

## Objetivo

Optimizar el proyecto entero atacando 4 categorías de problemas detectados en auditoría:

- **A) Bugs** que pueden romper en producción.
- **B) Performance**: lecturas redundantes de archivo.
- **C) UX**: streaming de chat + eliminar polling innecesario.
- **D) Code quality**: deps actualizadas, validación, configuración.

No se cambia la arquitectura general (Next.js 14 + JSON storage + Groq). No se introducen DB ni servicios externos.

---

## A) Bugs

### A1. `lib/storage/archivo.ts` — temp file cross-volume

**Problema**: `escribirJSON` crea el archivo temporal en `os.tmpdir()` y luego hace `fs.rename(tmp, absoluta)`. En Windows, si `%TEMP%` está en un volumen distinto al del proyecto, `rename` falla con `EXDEV`. CLAUDE.md ya documenta el workaround pero no lo arregla.

**Fix**: crear el archivo temporal en el mismo directorio que el target. Eliminar import de `os`.

```ts
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
```

### A2. `force-dynamic` en rutas API que leen JSON

**Problema**: CLAUDE.md exige `export const dynamic = "force-dynamic"` en toda ruta que lee `data/*.json`. Faltan en las 4 rutas API:

- `app/api/chat/route.ts`
- `app/api/mensajes/route.ts`
- `app/api/turnos/route.ts`
- `app/api/configuracion/route.ts`

**Fix**: agregar la línea al tope del archivo (después de imports):

```ts
export const dynamic = "force-dynamic"
```

---

## B) Performance

### B1. `lib/storage/turnos.ts` y `lib/sarah/ejecutarTool.ts` — eliminar lecturas redundantes

**Problema**: en un solo tool call, `listarTurnos()` se invoca múltiples veces:

- `verDisponibilidad`: llama a `listarTurnos()` directo y a `turnosActivosEnFecha()` (que internamente llama a `listarTurnos()`). **2 lecturas**.
- `agendarTurno` y `reprogramarTurno`: llaman a `estaOcupado()` (1 lectura) y, si el slot está ocupado, a `listarTurnos()` otra vez para alternativos. **Hasta 2 lecturas**.

**Fix**: agregar variantes "sync" que aceptan `turnos: Turno[]` ya cargados. Cada handler en `ejecutarTool.ts` lee el archivo una sola vez al principio y pasa el array al resto de las helpers.

#### Cambios en `lib/storage/turnos.ts`

```ts
// Mantener funciones async existentes (listarTurnos, crearTurno, etc.)

// Nuevas helpers sync que operan sobre array pre-cargado:
export function turnosActivosEnFechaFromList(fecha: string, turnos: Turno[]): Turno[] {
  return turnos.filter((t) => t.fecha === fecha && t.estado === "activo")
}

export function estaOcupadoFromList(fecha: string, hora: string, turnos: Turno[]): boolean {
  return turnos.some((t) => t.fecha === fecha && t.hora === hora && t.estado === "activo")
}
```

#### Cambios en `lib/sarah/ejecutarTool.ts`

Cada handler que necesite turnos:

```ts
async function verDisponibilidad(args: { fecha: string }) {
  // ... validación ...
  const turnos = await listarTurnos()  // 1 sola lectura
  const libres = slotsLibresFuturos(fecha, turnos)
  const activos = turnosActivosEnFechaFromList(fecha, turnos)
  // ...
}
```

Mismo patrón para `agendarTurno` y `reprogramarTurno`.

### B2. `lib/dominio/horarios.ts` — memoizar `generarSlotsDelDia()`

**Problema**: función pura que devuelve siempre el mismo array (18 strings). Se reconstruye en cada llamado de `slotsLibres`, `esSlotValido`, etc.

**Fix**: cache en module scope.

```ts
let _slotsCache: readonly string[] | null = null

export function generarSlotsDelDia(): readonly string[] {
  if (_slotsCache) return _slotsCache
  const slots: string[] = []
  for (let hora = HORA_INICIO; hora < HORA_FIN; hora++) {
    for (let minutos = 0; minutos < 60; minutos += INTERVALO_MINUTOS) {
      const hh = hora.toString().padStart(2, "0")
      const mm = minutos.toString().padStart(2, "0")
      slots.push(`${hh}:${mm}`)
    }
  }
  _slotsCache = Object.freeze(slots)
  return _slotsCache
}
```

Verificar que ningún consumidor mute el array (todos los usos actuales son `.includes()`, `.filter()`, `.indexOf()` — read-only).

---

## C) UX

### C1. Streaming del chat (SSE)

**Problema**: el usuario manda un mensaje y no ve nada hasta que el modelo termina toda la cadena de tool calls + respuesta final. Latencia percibida alta.

**Solución**: Server-Sent Events. El servidor mantiene el loop de tool calls igual, pero:

- Emite eventos `tool_call` cuando Sarah decide usar una tool (con el nombre).
- Emite eventos `delta` con chunks del texto final (usando `stream: true` de Groq en la última iteración cuando ya no hay tool calls).
- Emite evento `done` al final con `mensajes_nuevos` (para sincronía con el historial).

#### Formato del stream

Cada evento es una línea `data: {"type":"...", ...}\n\n`. Tipos:

```ts
type StreamEvent =
  | { type: "tool_call"; name: string }
  | { type: "delta"; text: string }
  | { type: "done"; mensajes_nuevos: Mensaje[] }
  | { type: "error"; mensaje: string }
```

#### Cambios en `app/api/chat/route.ts`

Sustituir el `NextResponse.json(...)` final por un `ReadableStream`:

```ts
const stream = new ReadableStream({
  async start(controller) {
    const encoder = new TextEncoder()
    const send = (ev: StreamEvent) =>
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(ev)}\n\n`))

    try {
      // ... loop tool calls. Cuando hay tool_calls, send({type:"tool_call", name}).
      // En la iteración sin tool_calls, llamar a Groq con stream:true y emitir deltas.
      send({ type: "done", mensajes_nuevos })
    } catch (e) {
      send({ type: "error", mensaje: clasificarError(e) })
    } finally {
      controller.close()
    }
  },
})

return new Response(stream, {
  headers: {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  },
})
```

El loop de tool calls intermedio sigue siendo no-streaming (Groq permite `stream:false` cuando hay `tool_choice:auto`). La iteración final (cuando el modelo no devuelve `tool_calls`) usa `stream:true` para mandar los deltas.

#### Cambios en `store/chatStore.ts`

Reemplazar `await fetch(...).json()` por lectura del stream:

```ts
const res = await fetch("/api/chat", { method: "POST", ... })
if (!res.ok || !res.body) {
  // mostrar error
  return
}
const reader = res.body.getReader()
const decoder = new TextDecoder()
let buffer = ""
let textoStreaming = ""

// Insertar mensaje vacío del assistant para ir llenándolo
const placeholderId = crypto.randomUUID()
set((state) => ({
  mensajes: [...state.mensajes, { id: placeholderId, rol: "assistant", contenido: "", timestamp: ... }]
}))

while (true) {
  const { done, value } = await reader.read()
  if (done) break
  buffer += decoder.decode(value, { stream: true })
  const eventos = buffer.split("\n\n")
  buffer = eventos.pop() ?? ""
  for (const ev of eventos) {
    if (!ev.startsWith("data: ")) continue
    const parsed = JSON.parse(ev.slice(6)) as StreamEvent
    if (parsed.type === "delta") {
      textoStreaming += parsed.text
      set((state) => ({
        mensajes: state.mensajes.map((m) =>
          m.id === placeholderId ? { ...m, contenido: textoStreaming } : m
        ),
      }))
    } else if (parsed.type === "tool_call") {
      // opcional: actualizar UI con "Consultando disponibilidad..."
      set({ herramientaActiva: parsed.name })
    }
  }
}
set({ cargando: false, herramientaActiva: null })
```

#### Cambios en `components/panel/ChatVentana.tsx` y `IndicadorEscribiendo.tsx`

Mostrar `herramientaActiva` cuando exista (mapping `ver_disponibilidad → "Consultando disponibilidad..."`, etc.). Si no hay herramienta activa pero `cargando=true` y aún no llegan deltas, sigue mostrando el indicador de "escribiendo".

### C2. Historial — eliminar polling

**Problema**: `app/panel/historial/page.tsx` hace `setInterval(cargar, 5000)` para siempre. Genera carga server-side aunque nadie esté mirando.

**Fix**: cargar al montar + botón "Actualizar" (ya existe en el JSX). Eliminar el `setInterval`. Cambiar el subtítulo de "Se actualiza cada 5s" a "{N} mensajes".

```ts
useEffect(() => {
  cargar()
}, [])
```

---

## D) Code quality

### D1. `next.config.mjs` — opción deprecada

Next 14.2+ renombró `experimental.serverComponentsExternalPackages` a `serverExternalPackages` (top-level). Sustituir:

```js
const nextConfig = {
  serverExternalPackages: ["groq-sdk"],
}
```

### D2. Validación Zod en `/api/chat`

**Problema**: el body se castea con `as { mensaje: string }`. Sin validación de tipo ni longitud, riesgo de mensajes enormes que exploten contexto Groq.

**Fix**:

```ts
import { z } from "zod"

const InputChatSchema = z.object({
  mensaje: z.string().trim().min(1, "El mensaje no puede estar vacío").max(2000, "Mensaje demasiado largo"),
})

const parseado = InputChatSchema.safeParse(await req.json())
if (!parseado.success) {
  return NextResponse.json({ error: parseado.error.errors[0].message }, { status: 400 })
}
const { mensaje } = parseado.data
```

### D3. `chatStore.ts` — manejo de respuestas no-OK

Antes de procesar el body, verificar `res.ok`. Si falla, no romper el flujo de streaming.

```ts
if (!res.ok) {
  const fallback = await res.json().catch(() => ({ mensaje: "Error del servidor" }))
  // mostrar mensaje error y cortar
  return
}
```

---

## Archivos tocados

| Archivo | Cambios |
|---|---|
| `lib/storage/archivo.ts` | A1 |
| `app/api/chat/route.ts` | A2 + C1 + D2 |
| `app/api/mensajes/route.ts` | A2 |
| `app/api/turnos/route.ts` | A2 |
| `app/api/configuracion/route.ts` | A2 |
| `lib/storage/turnos.ts` | B1 |
| `lib/sarah/ejecutarTool.ts` | B1 |
| `lib/dominio/horarios.ts` | B2 |
| `store/chatStore.ts` | C1 + D3 |
| `components/panel/ChatVentana.tsx` | C1 (render `herramientaActiva`) |
| `app/panel/historial/page.tsx` | C2 |
| `next.config.mjs` | D1 |

Total: 12 archivos.

---

## Validación post-cambios

1. `npm run build` — debe pasar sin errores de tipo ni de Next config.
2. `npm run lint` — sin warnings nuevos.
3. Test manual del chat con streaming visible.
4. Test manual de agendar turno (verificar que crear/cancelar/reprogramar siguen funcionando con la helper sync).
5. Verificar que `/panel/historial` ya no hace polling (network tab).
6. Verificar atomicidad de escritura en `data/turnos.json` (matar el server mid-write y comprobar que el archivo no queda corrupto).

---

## Fuera de alcance

- Migración a SQLite o cualquier DB.
- Auth en panel admin.
- Rate limiting en `/api/chat`.
- Tests automatizados.
- Bump mayor de Next.js (14 → 15).
- Cambios visuales o de copy en UI.
