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
            const mensajeError =
              fallback?.error ?? fallback?.mensaje ?? "Error del servidor. Probá de nuevo."
            reemplazarPlaceholder(mensajeError)
            set({ cargando: false, herramientaActiva: null })
            return
          }

          const reader = res.body.getReader()
          const decoder = new TextDecoder()
          let buffer = ""
          let textoAcumulado = ""

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
                textoAcumulado += parsed.text
                reemplazarPlaceholder(textoAcumulado)
                if (get().herramientaActiva) {
                  set({ herramientaActiva: null })
                }
              } else if (parsed.type === "tool_call") {
                set({ herramientaActiva: parsed.name })
              } else if (parsed.type === "error") {
                reemplazarPlaceholder(parsed.mensaje)
              }
            }
          }

          if (!textoAcumulado.trim()) {
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
