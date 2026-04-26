# Optimización Clínica Dental Sonrisa — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor quirúrgico que arregla bugs (force-dynamic, escritura atómica cross-volume), elimina lecturas redundantes de JSON, agrega streaming SSE al chat y limpia code quality (next.config, validación Zod).

**Architecture:** Mantener Next.js 14 App Router + JSON storage + Groq SDK. No DB. Cambios localizados en 12 archivos: storage, capa Sarah, rutas API, store cliente, panel.

**Tech Stack:** Next.js 14.2.18, React 18, TypeScript 5.6, Groq SDK 0.9, Zod 3, Zustand 5, date-fns 4.

---

## Pre-flight

Antes de empezar:
- Tener `.env.local` con `GROQ_API_KEY` configurado.
- `npm install` ya ejecutado.
- Confirmar baseline: `npm run build` debe pasar sin errores antes de tocar nada.

```bash
npm run build
```
Expected: build OK.

**Convención de tests**: el proyecto NO tiene framework de testing automatizado. La verificación es:
1. `npm run build` (chequea tipos TypeScript completo).
2. `npm run lint` (ESLint).
3. Test manual descrito en cada tarea.

Donde el plan dice "Write failing test" para lógica pura aislada (helpers de storage/dominio), se crea un script ad-hoc de Node ejecutable con `node --loader tsx <script>` o equivalente. Si tsx no está disponible, validación se reduce a build + ejecución manual del flow.

---

## Task 1: Fix escribirJSON cross-volume (A1)

**Files:**
- Modify: `lib/storage/archivo.ts` (full rewrite, archivo corto)

**Why:** `os.tmpdir()` puede estar en otro volumen → `fs.rename` falla con `EXDEV` en Windows. Solución: tmp file en mismo directorio que target.

- [ ] **Step 1: Reemplazar contenido completo de `lib/storage/archivo.ts`**

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

- [ ] **Step 2: Verificar tipos**

Run: `npm run build`
Expected: PASS sin errores.

- [ ] **Step 3: Test manual de escritura**

Iniciar dev server (`npm run dev`), abrir `/panel/configuracion`, modificar el campo "Teléfono", guardar. Verificar que `data/configuracion.json` se actualiza y no queda ningún archivo `.tmp` huérfano en `data/`.

- [ ] **Step 4: Commit**

```bash
git add lib/storage/archivo.ts
git commit -m "fix(storage): tmp file en mismo directorio que target evita EXDEV"
```

---

## Task 2: force-dynamic en /api/configuracion y /api/turnos (A2 parte 1)

**Files:**
- Modify: `app/api/configuracion/route.ts`
- Modify: `app/api/turnos/route.ts`

**Why:** CLAUDE.md exige `force-dynamic` en rutas que leen `data/*.json`. Falta en estas dos rutas (las de chat y mensajes se tocan más adelante porque cambian más).

- [ ] **Step 1: Agregar export al tope de `app/api/configuracion/route.ts`**

Insertar (después de los imports, antes del primer `export async function`):

```ts
export const dynamic = "force-dynamic"
```

- [ ] **Step 2: Agregar export al tope de `app/api/turnos/route.ts`**

Mismo cambio:

```ts
export const dynamic = "force-dynamic"
```

- [ ] **Step 3: Verificar build**

Run: `npm run build`
Expected: PASS. En la salida, las rutas `/api/configuracion` y `/api/turnos` deben aparecer marcadas como `ƒ` (Dynamic) en lugar de `λ` o estáticas.

- [ ] **Step 4: Commit**

```bash
git add app/api/configuracion/route.ts app/api/turnos/route.ts
git commit -m "fix(api): force-dynamic en /api/configuracion y /api/turnos"
```

---

## Task 3: force-dynamic en /api/mensajes (A2 parte 2)

**Files:**
- Modify: `app/api/mensajes/route.ts`

- [ ] **Step 1: Agregar export al tope**

Insertar después de los imports:

```ts
export const dynamic = "force-dynamic"
```

- [ ] **Step 2: Verificar build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add app/api/mensajes/route.ts
git commit -m "fix(api): force-dynamic en /api/mensajes"
```

---

## Task 4: Memoizar generarSlotsDelDia (B2)

**Files:**
- Modify: `lib/dominio/horarios.ts:8-18`

**Why:** Función pura que devuelve array de 18 strings. Se invoca en cada `slotsLibres`/`esSlotValido`. Memoización trivial.

- [ ] **Step 1: Reemplazar la función `generarSlotsDelDia`**

Buscar bloque actual (líneas 8-18):

```ts
export function generarSlotsDelDia(): string[] {
  const slots: string[] = []
  for (let hora = HORA_INICIO; hora < HORA_FIN; hora++) {
    for (let minutos = 0; minutos < 60; minutos += INTERVALO_MINUTOS) {
      const hh = hora.toString().padStart(2, "0")
      const mm = minutos.toString().padStart(2, "0")
      slots.push(`${hh}:${mm}`)
    }
  }
  return slots
}
```

Reemplazar por:

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

- [ ] **Step 2: Verificar tipos en consumidores**

Los consumidores (`slotsLibres`, `esSlotValido`, `slotsCercanos`) usan `.includes()`, `.filter()`, `.indexOf()`. `readonly string[]` es asignable a parámetros que esperan `string[]` solo si NO se mutan. Verificar:

Run: `npm run build`
Expected: PASS. Si el compilador se queja de algún uso, cambiar la signatura del consumidor a `readonly string[]` o convertir con `[...generarSlotsDelDia()]` donde haga falta. Probable: `slotsCercanos` en línea 75 hace `todos.indexOf(hora)` (read-only, OK).

- [ ] **Step 3: Test manual**

Iniciar dev server, mandar a Sarah "qué horarios hay para mañana". Confirmar que devuelve los slots correctos.

- [ ] **Step 4: Commit**

```bash
git add lib/dominio/horarios.ts
git commit -m "perf(horarios): memoizar generarSlotsDelDia"
```

---

## Task 5: Helpers sync sobre array pre-cargado en storage/turnos (B1 parte 1)

**Files:**
- Modify: `lib/storage/turnos.ts`

**Why:** Crear variantes sync que acepten `turnos: Turno[]` ya cargado. Eliminan re-lectura del archivo cuando el caller ya tiene el array.

- [ ] **Step 1: Agregar helpers sync al final de `lib/storage/turnos.ts`**

Después de la última función existente, agregar:

```ts
export function turnosActivosEnFechaFromList(fecha: string, turnos: Turno[]): Turno[] {
  return turnos.filter((t) => t.fecha === fecha && t.estado === "activo")
}

export function estaOcupadoFromList(fecha: string, hora: string, turnos: Turno[]): boolean {
  return turnos.some((t) => t.fecha === fecha && t.hora === hora && t.estado === "activo")
}
```

- [ ] **Step 2: Verificar build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add lib/storage/turnos.ts
git commit -m "perf(storage): helpers sync sobre array pre-cargado de turnos"
```

---

## Task 6: Refactor ejecutarTool para una sola lectura por handler (B1 parte 2)

**Files:**
- Modify: `lib/sarah/ejecutarTool.ts`

**Why:** `verDisponibilidad`, `agendarTurno`, `reprogramarTurno` actualmente hacen 2-3 lecturas de `data/turnos.json` por tool call. Cargar 1 vez y pasar el array.

- [ ] **Step 1: Actualizar imports**

Buscar el import block (líneas 1-9):

```ts
import {
  listarTurnos,
  crearTurno,
  actualizarEstado,
  buscarTurnoPorId,
  buscarTurnosPorPaciente,
  turnosActivosEnFecha,
  estaOcupado,
} from "../storage/turnos"
```

Reemplazar por:

```ts
import {
  listarTurnos,
  crearTurno,
  actualizarEstado,
  buscarTurnoPorId,
  buscarTurnosPorPaciente,
  turnosActivosEnFechaFromList,
  estaOcupadoFromList,
} from "../storage/turnos"
```

- [ ] **Step 2: Reemplazar `verDisponibilidad` (líneas 27-52)**

Buscar:

```ts
async function verDisponibilidad(args: { fecha: string }): Promise<ResultadoTool> {
  const { fecha } = args
  const validacion = esFechaValida(fecha)
  if (!validacion.valida) {
    return { error: validacion.error }
  }

  const todos = await listarTurnos()
  const libres = slotsLibresFuturos(fecha, todos)
  const activos = await turnosActivosEnFecha(fecha)

  if (libres.length === 0) {
    return {
      disponible: false,
      mensaje: `No hay más turnos disponibles el ${formatearFecha(fecha)}.`,
      slots_libres: [],
    }
  }

  return {
    disponible: true,
    fecha: formatearFecha(fecha),
    slots_libres: libres,
    turnos_ocupados: activos.length,
  }
}
```

Reemplazar por:

```ts
async function verDisponibilidad(args: { fecha: string }): Promise<ResultadoTool> {
  const { fecha } = args
  const validacion = esFechaValida(fecha)
  if (!validacion.valida) {
    return { error: validacion.error }
  }

  const todos = await listarTurnos()
  const libres = slotsLibresFuturos(fecha, todos)
  const activos = turnosActivosEnFechaFromList(fecha, todos)

  if (libres.length === 0) {
    return {
      disponible: false,
      mensaje: `No hay más turnos disponibles el ${formatearFecha(fecha)}.`,
      slots_libres: [],
    }
  }

  return {
    disponible: true,
    fecha: formatearFecha(fecha),
    slots_libres: libres,
    turnos_ocupados: activos.length,
  }
}
```

- [ ] **Step 3: Reemplazar `agendarTurno` (líneas 83-137)**

Buscar el bloque desde `async function agendarTurno` hasta su llave de cierre. Reemplazar el cuerpo de modo que cargue una sola vez:

```ts
async function agendarTurno(args: {
  nombre_paciente: string
  telefono: string
  fecha: string
  hora: string
  tipo_consulta: string
  notas?: string
}): Promise<ResultadoTool> {
  const { nombre_paciente, telefono, fecha, hora, tipo_consulta, notas } = args

  if (esPlaceholder(nombre_paciente)) {
    return { error: "No tengo el nombre del paciente. Pedíselo antes de agendar." }
  }
  if (esPlaceholder(telefono)) {
    return { error: "No tengo el teléfono del paciente. Pedíselo antes de agendar." }
  }
  if (esPlaceholder(tipo_consulta)) {
    return { error: "No sé el tipo de consulta. Preguntáselo al paciente antes de agendar." }
  }

  const validacionFecha = esFechaValida(fecha)
  if (!validacionFecha.valida) {
    return { error: validacionFecha.error }
  }

  if (!esSlotValido(hora)) {
    return {
      error: `La hora ${hora} no es un slot válido. Los turnos son cada 30 minutos, de 09:00 a 17:30.`,
    }
  }

  const todos = await listarTurnos()
  const ocupado = estaOcupadoFromList(fecha, hora, todos)
  if (ocupado) {
    const libres = slotsLibresFuturos(fecha, todos)
    const alternativos = slotsCercanos(hora, libres)
    return {
      error: `El turno de las ${hora} del ${formatearFecha(fecha)} ya está ocupado.`,
      slots_alternativos: alternativos,
      mensaje: `Ese horario ya lo tomaron. ${
        alternativos.length > 0
          ? `Tengo libre: ${alternativos.join(", ")}. ¿Alguno te sirve?`
          : "No hay más horarios disponibles ese día."
      }`,
    }
  }

  const turno = await crearTurno({ nombre_paciente, telefono, fecha, hora, tipo_consulta, notas })
  return {
    exito: true,
    turno: { ...turno, fecha: formatearFecha(turno.fecha) },
    mensaje: `✅ Turno agendado para ${nombre_paciente} el ${formatearFecha(fecha)} a las ${hora}hs. (${tipo_consulta})`,
  }
}
```

- [ ] **Step 4: Reemplazar `reprogramarTurno` (líneas 157-215)**

Buscar el bloque y reemplazar de modo que use una sola lectura:

```ts
async function reprogramarTurno(args: {
  id_turno: string
  nueva_fecha: string
  nueva_hora: string
}): Promise<ResultadoTool> {
  const { id_turno, nueva_fecha, nueva_hora } = args

  const turnoViejo = await buscarTurnoPorId(id_turno)
  if (!turnoViejo) {
    return { error: `No encontré el turno con ID ${id_turno}.` }
  }
  if (turnoViejo.estado !== "activo") {
    return { error: "Solo se pueden reprogramar turnos activos." }
  }

  const validacionFecha = esFechaValida(nueva_fecha)
  if (!validacionFecha.valida) {
    return { error: validacionFecha.error }
  }

  if (!esSlotValido(nueva_hora)) {
    return {
      error: `La hora ${nueva_hora} no es un slot válido. Los turnos son cada 30 minutos, de 09:00 a 17:30.`,
    }
  }

  const todos = await listarTurnos()
  const ocupado = estaOcupadoFromList(nueva_fecha, nueva_hora, todos)
  if (ocupado) {
    const libres = slotsLibresFuturos(nueva_fecha, todos)
    const alternativos = slotsCercanos(nueva_hora, libres)
    return {
      error: `El slot ${nueva_hora} del ${formatearFecha(nueva_fecha)} ya está ocupado.`,
      slots_alternativos: alternativos,
      mensaje: `Ese horario ya lo tomaron. ${
        alternativos.length > 0
          ? `Tengo libre: ${alternativos.join(", ")}. ¿Alguno te sirve?`
          : "No hay más horarios disponibles ese día."
      }`,
    }
  }

  await actualizarEstado(id_turno, "cancelado")
  const turnoNuevo = await crearTurno({
    nombre_paciente: turnoViejo.nombre_paciente,
    telefono: turnoViejo.telefono,
    fecha: nueva_fecha,
    hora: nueva_hora,
    tipo_consulta: turnoViejo.tipo_consulta,
    notas: turnoViejo.notas,
  })

  return {
    exito: true,
    turno_nuevo: { ...turnoNuevo, fecha: formatearFecha(turnoNuevo.fecha) },
    turno_viejo_cancelado: id_turno,
    mensaje: `✅ Turno reprogramado para ${turnoViejo.nombre_paciente} al ${formatearFecha(nueva_fecha)} a las ${nueva_hora}hs.`,
  }
}
```

- [ ] **Step 5: Verificar build**

Run: `npm run build`
Expected: PASS sin errores.

- [ ] **Step 6: Test manual end-to-end**

Iniciar dev server. En el chat:
1. "qué horarios hay para mañana" → Sarah debe responder con slots libres.
2. "agéndame un turno mañana a las 14:00 para Juan Pérez, teléfono 1144556677, limpieza" → Sarah confirma datos y agenda.
3. Verificar `data/turnos.json` que el turno aparece.
4. "agendá otro a la misma hora para María" → debe rechazar y ofrecer alternativos.
5. "reprogramá el turno de Juan a las 15:00 mañana" → mueve correctamente.

- [ ] **Step 7: Commit**

```bash
git add lib/sarah/ejecutarTool.ts
git commit -m "perf(sarah): una sola lectura de turnos.json por tool call"
```

---

## Task 7: Limpiar next.config.mjs (D1)

**Files:**
- Modify: `next.config.mjs`

- [ ] **Step 1: Reemplazar contenido completo**

```js
/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["groq-sdk"],
}

export default nextConfig
```

- [ ] **Step 2: Verificar build**

Run: `npm run build`
Expected: PASS sin warnings de configuración. La advertencia previa "experimental.serverComponentsExternalPackages has been deprecated" debe desaparecer.

- [ ] **Step 3: Commit**

```bash
git add next.config.mjs
git commit -m "chore(next): migrar a serverExternalPackages top-level"
```

---

## Task 8: Validación Zod en /api/chat (D2)

**Files:**
- Modify: `app/api/chat/route.ts`

**Why:** Body actualmente casteado con `as { mensaje: string }`. Sin cap de longitud. Riesgo de mensajes que disparan context overflow.

NOTA: este task también añade `force-dynamic` ya que esta ruta lee JSON. Antes era parte de Task 2 pero se difiere acá porque se está editando igual.

- [ ] **Step 1: Agregar import de Zod al tope**

Buscar el import block actual:

```ts
import { NextRequest, NextResponse } from "next/server"
import { getGroqClient, MODELO } from "@/lib/sarah/cliente"
```

Agregar línea:

```ts
import { z } from "zod"
```

- [ ] **Step 2: Agregar `dynamic` y schema al inicio del archivo (después de imports, antes de la primera función)**

```ts
export const dynamic = "force-dynamic"

const InputChatSchema = z.object({
  mensaje: z
    .string()
    .trim()
    .min(1, "El mensaje no puede estar vacío")
    .max(2000, "El mensaje es demasiado largo (máx. 2000 caracteres)."),
})
```

- [ ] **Step 3: Reemplazar el bloque de validación al inicio de POST**

Buscar (líneas ~71-77):

```ts
    const body = await req.json()
    const { mensaje } = body as { mensaje: string }

    if (!mensaje?.trim()) {
      return NextResponse.json({ error: "El mensaje no puede estar vacío" }, { status: 400 })
    }
```

Reemplazar por:

```ts
    const body = await req.json().catch(() => null)
    const parseado = InputChatSchema.safeParse(body)
    if (!parseado.success) {
      return NextResponse.json(
        { error: parseado.error.errors[0]?.message ?? "Entrada inválida" },
        { status: 400 }
      )
    }
    const mensaje = parseado.data.mensaje
```

Y eliminar la línea posterior `const mensajeUsuario = await agregarMensaje("user", mensaje.trim())` reemplazándola por:

```ts
    const mensajeUsuario = await agregarMensaje("user", mensaje)
```

(porque `parseado.data.mensaje` ya viene `.trim()`-eado por Zod).

- [ ] **Step 4: Verificar build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 5: Test manual**

Mandar a `/api/chat` un body inválido con curl:

```bash
curl -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d '{"mensaje":""}'
```
Expected: `400 {"error":"El mensaje no puede estar vacío"}`.

```bash
curl -X POST http://localhost:3000/api/chat -H "Content-Type: application/json" -d "{\"mensaje\":\"$(printf 'a%.0s' {1..2500})\"}"
```
Expected: `400 {"error":"El mensaje es demasiado largo..."}`.

Body válido funciona normal.

- [ ] **Step 6: Commit**

```bash
git add app/api/chat/route.ts
git commit -m "feat(chat): validación Zod en /api/chat + force-dynamic"
```

---

## Task 9: Streaming SSE en /api/chat (C1 backend)

**Files:**
- Modify: `app/api/chat/route.ts`

**Why:** El usuario espera sin feedback durante toda la cadena de tool calls + respuesta final. Stream con SSE muestra eventos de tool calls y deltas de texto a medida que llegan.

- [ ] **Step 1: Agregar tipo de evento al tope del archivo (después de imports, antes de InputChatSchema)**

```ts
type StreamEvent =
  | { type: "tool_call"; name: string }
  | { type: "delta"; text: string }
  | { type: "done"; mensajes_nuevos: Mensaje[] }
  | { type: "error"; mensaje: string }
```

- [ ] **Step 2: Reemplazar el bloque del loop de tool calls + return final por una respuesta de streaming**

El cambio reemplaza desde la línea `let iteraciones = 0` hasta el `return NextResponse.json(...)` final dentro del `try`. Mantiene `clasificarError`. La estructura nueva:

```ts
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder()
        const send = (ev: StreamEvent) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(ev)}\n\n`))
        }

        try {
          let iteraciones = 0
          const MAX_ITERACIONES = 5
          let mensajeFinal = ""

          while (iteraciones < MAX_ITERACIONES) {
            iteraciones++

            const yaSinTools = iteraciones > 1 &&
              groqMessages[groqMessages.length - 1]?.role === "tool"

            // Dejamos que el modelo decida tool_choice en cada iteración.
            // Streameamos solo cuando NO se usen tools en esta iteración.
            // Estrategia: pedimos no-stream con tool_choice:auto. Si la respuesta
            // no trae tool_calls, repetimos con stream:true para emitir deltas.
            const respuesta = await getGroqClient().chat.completions.create({
              model: MODELO,
              messages: groqMessages,
              tools: TOOLS,
              tool_choice: "auto",
              temperature: 0.6,
              max_tokens: 1024,
            })

            const choice = respuesta.choices[0]
            if (!choice) break
            const assistantMessage = choice.message

            if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
              const contenidoAssistant = assistantMessage.content ?? ""
              const msgAssistant = await agregarMensaje("assistant", contenidoAssistant, {
                tool_calls: assistantMessage.tool_calls,
              })
              mensajesNuevos.push(msgAssistant)

              groqMessages.push({
                role: "assistant",
                content: contenidoAssistant || null,
                tool_calls: assistantMessage.tool_calls,
              })

              for (const toolCall of assistantMessage.tool_calls) {
                send({ type: "tool_call", name: toolCall.function.name })
                const resultado = await ejecutarTool(
                  toolCall.function.name,
                  toolCall.function.arguments
                )
                const msgTool = await agregarMensaje("tool", resultado, {
                  tool_call_id: toolCall.id,
                })
                mensajesNuevos.push(msgTool)
                groqMessages.push({
                  role: "tool",
                  content: resultado,
                  tool_call_id: toolCall.id,
                })
              }
              continue
            }

            // Sin tool_calls: re-pedimos con stream:true para emitir deltas.
            const respuestaStream = await getGroqClient().chat.completions.create({
              model: MODELO,
              messages: groqMessages,
              temperature: 0.6,
              max_tokens: 1024,
              stream: true,
            })

            for await (const chunk of respuestaStream) {
              const delta = chunk.choices[0]?.delta?.content ?? ""
              if (delta) {
                mensajeFinal += delta
                send({ type: "delta", text: delta })
              }
            }

            if (!mensajeFinal.trim()) {
              mensajeFinal = "Disculpá, ¿podés repetirme eso? No llegué a procesar bien tu mensaje."
              send({ type: "delta", text: mensajeFinal })
            }

            const msgFinal = await agregarMensaje("assistant", mensajeFinal)
            mensajesNuevos.push(msgFinal)
            break
          }

          if (!mensajeFinal) {
            mensajeFinal =
              "Estuve procesando tu consulta pero se me fue el tiempo de respuesta. ¿Me lo repetís?"
            const msg = await agregarMensaje("assistant", mensajeFinal)
            mensajesNuevos.push(msg)
            send({ type: "delta", text: mensajeFinal })
          }

          send({ type: "done", mensajes_nuevos: mensajesNuevos })
        } catch (e) {
          console.error("Error streaming chat:", e)
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

Eliminar la variable `iteraciones`/`MAX_ITERACIONES`/`mensajeFinal` originales fuera del stream (ahora viven dentro del `start`).

El `catch` externo del POST sigue, pero solo aplica a errores ANTES de iniciar el stream (parse, leer config, etc). Mantenerlo intacto:

```ts
  } catch (error) {
    console.error("Error en /api/chat:", error)
    const mensajeError = clasificarError(error)
    return NextResponse.json({ mensaje: mensajeError }, { status: 500 })
  }
```

- [ ] **Step 3: Verificar build**

Run: `npm run build`
Expected: PASS sin errores de tipo.

- [ ] **Step 4: Test manual con curl (verificar formato SSE)**

Iniciar dev server. Correr:

```bash
curl -N -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"mensaje":"hola"}'
```
Expected: stream de líneas `data: {"type":"delta","text":"..."}\n\n` seguido de `data: {"type":"done", ...}`.

```bash
curl -N -X POST http://localhost:3000/api/chat \
  -H "Content-Type: application/json" \
  -d '{"mensaje":"qué horarios hay mañana"}'
```
Expected: primero `data: {"type":"tool_call","name":"ver_disponibilidad"}`, luego deltas, luego `done`.

- [ ] **Step 5: Commit**

```bash
git add app/api/chat/route.ts
git commit -m "feat(chat): streaming SSE con eventos tool_call/delta/done"
```

---

## Task 10: Cliente streaming en chatStore (C1 frontend + D3)

**Files:**
- Modify: `store/chatStore.ts`

**Why:** Reemplazar `await fetch().json()` por lectura del stream. Insertar mensaje placeholder del assistant y actualizarlo con cada delta. Trackear `herramientaActiva`.

- [ ] **Step 1: Reemplazar contenido completo de `store/chatStore.ts`**

```ts
"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface MensajeChat {
  id: string
  rol: "user" | "assistant"
  contenido: string
  timestamp: string
}

type StreamEvent =
  | { type: "tool_call"; name: string }
  | { type: "delta"; text: string }
  | { type: "done"; mensajes_nuevos: unknown }
  | { type: "error"; mensaje: string }

interface ChatStore {
  mensajes: MensajeChat[]
  cargando: boolean
  herramientaActiva: string | null
  enviarMensaje: (texto: string) => Promise<void>
  nuevaConversacion: () => Promise<void>
  sincronizarConServidor: () => Promise<void>
}

const ETIQUETAS_HERRAMIENTAS: Record<string, string> = {
  ver_disponibilidad: "Consultando disponibilidad...",
  ver_turnos_paciente: "Buscando turnos del paciente...",
  agendar_turno: "Agendando turno...",
  cancelar_turno: "Cancelando turno...",
  reprogramar_turno: "Reprogramando turno...",
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      mensajes: [],
      cargando: false,
      herramientaActiva: null,

      enviarMensaje: async (texto: string) => {
        const mensajeUsuario: MensajeChat = {
          id: crypto.randomUUID(),
          rol: "user",
          contenido: texto,
          timestamp: new Date().toISOString(),
        }
        const placeholderId = crypto.randomUUID()
        const placeholder: MensajeChat = {
          id: placeholderId,
          rol: "assistant",
          contenido: "",
          timestamp: new Date().toISOString(),
        }

        set((state) => ({
          mensajes: [...state.mensajes, mensajeUsuario, placeholder],
          cargando: true,
          herramientaActiva: null,
        }))

        const reemplazarPlaceholder = (contenido: string) => {
          set((state) => ({
            mensajes: state.mensajes.map((m) =>
              m.id === placeholderId ? { ...m, contenido } : m
            ),
          }))
        }

        try {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mensaje: texto }),
          })

          if (!res.ok || !res.body) {
            const fallback = await res.json().catch(() => null)
            const mensaje =
              fallback?.error ?? fallback?.mensaje ?? "Error del servidor. Probá de nuevo."
            reemplazarPlaceholder(mensaje)
            set({ cargando: false, herramientaActiva: null })
            return
          }

          const reader = res.body.getReader()
          const decoder = new TextDecoder()
          let buffer = ""
          let texto_acumulado = ""

          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buffer += decoder.decode(value, { stream: true })
            const eventos = buffer.split("\n\n")
            buffer = eventos.pop() ?? ""
            for (const ev of eventos) {
              const linea = ev.trim()
              if (!linea.startsWith("data:")) continue
              const json = linea.slice(5).trim()
              if (!json) continue
              let parsed: StreamEvent
              try {
                parsed = JSON.parse(json) as StreamEvent
              } catch {
                continue
              }

              if (parsed.type === "delta") {
                texto_acumulado += parsed.text
                reemplazarPlaceholder(texto_acumulado)
                if (get().herramientaActiva) {
                  set({ herramientaActiva: null })
                }
              } else if (parsed.type === "tool_call") {
                set({ herramientaActiva: parsed.name })
              } else if (parsed.type === "error") {
                reemplazarPlaceholder(parsed.mensaje)
              }
              // type === "done": no-op (los mensajes ya se streamearon)
            }
          }

          // Si no llegó ningún delta, dejar mensaje genérico
          if (!texto_acumulado.trim()) {
            reemplazarPlaceholder(
              "Tuve un problema al procesar tu mensaje. ¿Lo intentás de nuevo?"
            )
          }
        } catch {
          reemplazarPlaceholder(
            "Parece que se cortó la conexión. Revisá tu internet y volvé a probar."
          )
        } finally {
          set({ cargando: false, herramientaActiva: null })
        }
      },

      nuevaConversacion: async () => {
        try {
          await fetch("/api/mensajes", { method: "DELETE" })
        } catch {
          // continuar igual
        }
        set({ mensajes: [], cargando: false, herramientaActiva: null })
      },

      sincronizarConServidor: async () => {
        const { mensajes } = get()
        if (mensajes.length > 0) return

        try {
          const res = await fetch("/api/mensajes")
          if (!res.ok) return
          const data = await res.json()
          const mensajesServidor = (data.mensajes ?? []) as Array<{
            id: string
            rol: string
            contenido: string
            timestamp: string
          }>

          const filtrados: MensajeChat[] = mensajesServidor
            .filter((m) => m.rol === "user" || m.rol === "assistant")
            .map((m) => ({
              id: m.id,
              rol: m.rol as "user" | "assistant",
              contenido: m.contenido,
              timestamp: m.timestamp,
            }))

          if (filtrados.length > 0) {
            set({ mensajes: filtrados })
          }
        } catch {
          // sincronización silenciosa
        }
      },
    }),
    {
      name: "dentalai-chat",
      partialize: (state) => ({ mensajes: state.mensajes }),
    }
  )
)
```

- [ ] **Step 2: Verificar build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit (parcial — UI se ajusta en task 11)**

```bash
git add store/chatStore.ts
git commit -m "feat(chat): cliente streaming SSE en chatStore + manejo res.ok"
```

---

## Task 11: UI streaming en ChatVentana (C1 UI)

**Files:**
- Modify: `components/panel/ChatVentana.tsx`

**Why:** Mostrar `herramientaActiva` cuando exista (texto tipo "Consultando disponibilidad..."). Mantener indicador de "escribiendo" cuando no haya tool activa pero `cargando=true`.

- [ ] **Step 1: Leer `IndicadorEscribiendo.tsx` para entender API**

Run: read `components/panel/IndicadorEscribiendo.tsx`. Anotar si acepta props.

- [ ] **Step 2: Modificar `ChatVentana.tsx` para mostrar etiqueta de herramienta**

Cambiar la línea de destructuring del store al inicio del componente:

```ts
const { mensajes, cargando, herramientaActiva, enviarMensaje, nuevaConversacion, sincronizarConServidor } = useChatStore()
```

Agregar mapping local de etiquetas (justo antes del `return`):

```ts
const ETIQUETAS_TOOLS: Record<string, string> = {
  ver_disponibilidad: "Consultando disponibilidad...",
  ver_turnos_paciente: "Buscando turnos...",
  agendar_turno: "Agendando turno...",
  cancelar_turno: "Cancelando turno...",
  reprogramar_turno: "Reprogramando turno...",
}
const etiquetaTool = herramientaActiva ? (ETIQUETAS_TOOLS[herramientaActiva] ?? "Procesando...") : null
```

En el área de mensajes (donde está `<ListaMensajes>`), agregar debajo:

```tsx
{etiquetaTool && (
  <div className="px-6 py-2 text-xs text-slate-500 italic">
    {etiquetaTool}
  </div>
)}
```

- [ ] **Step 3: Verificar build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Test manual UI completo**

Iniciar dev server. En `/panel/chat`:
1. Mandar "hola" → debe verse el texto apareciendo carácter por carácter (streaming).
2. Mandar "qué horarios hay mañana" → debe aparecer "Consultando disponibilidad..." brevemente, después la respuesta de Sarah streameada.
3. Refrescar la página → mensajes persisten.
4. Botón "Nueva conversación" → limpia historial.

- [ ] **Step 5: Commit**

```bash
git add components/panel/ChatVentana.tsx
git commit -m "feat(panel): mostrar herramienta activa de Sarah durante streaming"
```

---

## Task 12: Eliminar polling en historial (C2)

**Files:**
- Modify: `app/panel/historial/page.tsx`

- [ ] **Step 1: Reemplazar el `useEffect` que monta el polling**

Buscar (líneas 70-73):

```ts
  useEffect(() => {
    cargar()
    const intervalo = setInterval(cargar, 5000)
    return () => clearInterval(intervalo)
  }, [])
```

Reemplazar por:

```ts
  useEffect(() => {
    cargar()
  }, [])
```

- [ ] **Step 2: Cambiar el subtítulo "Se actualiza cada 5s"**

Buscar (líneas ~81-83):

```tsx
          <p className="text-slate-500 text-sm mt-1">
            {mensajes.length} mensaje{mensajes.length !== 1 ? "s" : ""} · Se actualiza cada 5s
          </p>
```

Reemplazar por:

```tsx
          <p className="text-slate-500 text-sm mt-1">
            {mensajes.length} mensaje{mensajes.length !== 1 ? "s" : ""}
          </p>
```

- [ ] **Step 3: Verificar build**

Run: `npm run build`
Expected: PASS.

- [ ] **Step 4: Test manual**

Iniciar dev server. Abrir `/panel/historial`, abrir Network tab del browser. Confirmar que solo hay UNA request a `/api/mensajes` (al montar) y nada cada 5s. El botón "Actualizar" sigue funcionando.

- [ ] **Step 5: Commit**

```bash
git add app/panel/historial/page.tsx
git commit -m "perf(panel): eliminar polling 5s en historial, usar refresh manual"
```

---

## Task 13: Validación final integral

**Files:** ninguno (solo verificación)

- [ ] **Step 1: Build limpio**

Run: `npm run build`
Expected: PASS, sin warnings de Next config ni de tipos.

- [ ] **Step 2: Lint limpio**

Run: `npm run lint`
Expected: PASS, sin warnings nuevos.

- [ ] **Step 3: Smoke test del flow completo**

Iniciar dev server. Ejecutar este script manual:

1. `/panel/chat`: mandar "buenas, qué horarios tenés mañana?". Verificar streaming visible y "Consultando disponibilidad...".
2. Mandar "agéndame uno a las 14:00, soy Ariel, teléfono 1133224455, limpieza dental". Confirmar.
3. `/panel/turnos`: ver el turno en lista y calendario.
4. `/panel/historial`: ver todos los mensajes (incluyendo tool calls). Confirmar que NO hay polling.
5. `/panel/configuracion`: cambiar el teléfono, guardar. Verificar `data/configuracion.json` actualizado.
6. Verificar que NO quedan archivos `.tmp` huérfanos en `data/`.

- [ ] **Step 4: Verificar atomicidad de escritura**

Mandar 3 requests concurrentes a `/api/configuracion` POST con curl en paralelo. Verificar que el archivo final es válido JSON y refleja una de las escrituras (no corrupto).

```bash
for i in 1 2 3; do
  curl -X PUT http://localhost:3000/api/configuracion \
    -H "Content-Type: application/json" \
    -d "{\"telefono\":\"$i\", ...resto de config}" &
done; wait
```

(Adaptar el body según el schema de `/api/configuracion`).

Expected: archivo válido + uno de los teléfonos persiste.

- [ ] **Step 5: Commit final si hay cambios menores**

Si hubo ajustes en este paso:

```bash
git add -A
git commit -m "chore: ajustes post-validación integral"
```

Si no hubo cambios, skip.

---

## Resumen de commits esperados

1. fix(storage): tmp file en mismo directorio que target
2. fix(api): force-dynamic en /api/configuracion y /api/turnos
3. fix(api): force-dynamic en /api/mensajes
4. perf(horarios): memoizar generarSlotsDelDia
5. perf(storage): helpers sync sobre array pre-cargado
6. perf(sarah): una sola lectura de turnos.json por tool call
7. chore(next): migrar a serverExternalPackages top-level
8. feat(chat): validación Zod en /api/chat + force-dynamic
9. feat(chat): streaming SSE con eventos tool_call/delta/done
10. feat(chat): cliente streaming SSE en chatStore
11. feat(panel): mostrar herramienta activa durante streaming
12. perf(panel): eliminar polling en historial
13. (opcional) chore: ajustes post-validación

13 commits, 12 archivos tocados.
