import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { getGroqClient, MODELO } from "@/lib/sarah/cliente"
import { TOOLS } from "@/lib/sarah/tools"
import { buildSystemPrompt } from "@/lib/sarah/systemPrompt"
import { ejecutarTool } from "@/lib/sarah/ejecutarTool"
import { listarMensajes, agregarMensaje } from "@/lib/storage/mensajes"
import { leerConfiguracion } from "@/lib/storage/configuracion"
import type { Mensaje } from "@/lib/dominio/tipos"
import type Groq from "groq-sdk"

export const dynamic = "force-dynamic"

const InputChatSchema = z.object({
  mensaje: z
    .string()
    .trim()
    .min(1, "El mensaje no puede estar vacío")
    .max(2000, "El mensaje es demasiado largo (máx. 2000 caracteres)."),
})

type StreamEvent =
  | { type: "tool_call"; name: string }
  | { type: "delta"; text: string }
  | { type: "done"; mensajes_nuevos: Mensaje[] }
  | { type: "error"; mensaje: string }

type GroqMessage = Groq.Chat.ChatCompletionMessageParam

const MAX_HISTORIAL_MENSAJES = 30

function mensajesAGroq(mensajes: Mensaje[]): GroqMessage[] {
  const recientes = mensajes.slice(-MAX_HISTORIAL_MENSAJES)

  return recientes.flatMap((m): GroqMessage[] => {
    if (m.rol === "assistant" && m.tool_calls) {
      return [
        {
          role: "assistant",
          content: m.contenido || null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          tool_calls: m.tool_calls as any,
        },
      ]
    }
    if (m.rol === "tool") {
      return [
        {
          role: "tool",
          content: m.contenido,
          tool_call_id: m.tool_call_id ?? "",
        },
      ]
    }
    return [
      {
        role: m.rol as "user" | "assistant",
        content: m.contenido,
      },
    ]
  })
}

function clasificarError(error: unknown): string {
  if (!(error instanceof Error)) {
    return "Tuve un problema inesperado. ¿Lo intentás de nuevo?"
  }
  const msg = error.message.toLowerCase()

  if (msg.includes("api key") || msg.includes("apikey") || msg.includes("authentication")) {
    return "Falta configurar la clave de Groq. Revisá el archivo .env.local."
  }
  if (msg.includes("rate limit") || msg.includes("429")) {
    return "Le pegué mucho a la API y me cortaron por un momento 😅. Esperá unos segundos y volvé a intentar."
  }
  if (msg.includes("timeout") || msg.includes("network") || msg.includes("fetch")) {
    return "Parece que se cortó la conexión con el servidor. Revisá tu internet y volvé a probar."
  }
  if (msg.includes("context") || msg.includes("token")) {
    return "La conversación se puso muy larga. Podés empezar una nueva con el botón de arriba."
  }
  return "Tuve un problema al procesar tu mensaje. ¿Lo intentás de nuevo?"
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const parseado = InputChatSchema.safeParse(body)
    if (!parseado.success) {
      return NextResponse.json(
        { error: parseado.error.errors[0]?.message ?? "Entrada inválida" },
        { status: 400 }
      )
    }
    const mensaje = parseado.data.mensaje

    const [config, historial] = await Promise.all([leerConfiguracion(), listarMensajes()])

    const mensajeUsuario = await agregarMensaje("user", mensaje)
    const mensajesNuevos: Mensaje[] = [mensajeUsuario]

    const systemPrompt = buildSystemPrompt(config)
    const historialParaGroq = mensajesAGroq([...historial, mensajeUsuario])

    const groqMessages: GroqMessage[] = [
      { role: "system", content: systemPrompt },
      ...historialParaGroq,
    ]

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

            // Sin tool_calls: usar la respuesta ya recibida
            mensajeFinal = assistantMessage.content ?? ""
            if (!mensajeFinal.trim()) {
              mensajeFinal = "Disculpá, ¿podés repetirme eso? No llegué a procesar bien tu mensaje."
            }
            send({ type: "delta", text: mensajeFinal })

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
  } catch (error) {
    console.error("Error en /api/chat:", error)
    const mensajeError = clasificarError(error)
    return NextResponse.json({ mensaje: mensajeError }, { status: 500 })
  }
}
