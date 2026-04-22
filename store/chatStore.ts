"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface MensajeChat {
  id: string
  rol: "user" | "assistant"
  contenido: string
  timestamp: string
}

interface ChatStore {
  mensajes: MensajeChat[]
  cargando: boolean
  enviarMensaje: (texto: string) => Promise<void>
  nuevaConversacion: () => Promise<void>
  sincronizarConServidor: () => Promise<void>
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      mensajes: [],
      cargando: false,

      enviarMensaje: async (texto: string) => {
        const mensajeUsuario: MensajeChat = {
          id: crypto.randomUUID(),
          rol: "user",
          contenido: texto,
          timestamp: new Date().toISOString(),
        }

        set((state) => ({
          mensajes: [...state.mensajes, mensajeUsuario],
          cargando: true,
        }))

        try {
          const res = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ mensaje: texto }),
          })

          const data = await res.json()
          const respuestaSarah: MensajeChat = {
            id: crypto.randomUUID(),
            rol: "assistant",
            contenido: data.mensaje ?? "Uy, algo salió mal. ¿Lo intentás de nuevo?",
            timestamp: new Date().toISOString(),
          }

          set((state) => ({
            mensajes: [...state.mensajes, respuestaSarah],
            cargando: false,
          }))
        } catch {
          const mensajeError: MensajeChat = {
            id: crypto.randomUUID(),
            rol: "assistant",
            contenido: "Parece que se cortó la conexión. Revisá tu internet y volvé a probar.",
            timestamp: new Date().toISOString(),
          }
          set((state) => ({
            mensajes: [...state.mensajes, mensajeError],
            cargando: false,
          }))
        }
      },

      nuevaConversacion: async () => {
        try {
          await fetch("/api/mensajes", { method: "DELETE" })
        } catch {
          // Si falla el delete del servidor, igual limpiamos localmente
        }
        set({ mensajes: [], cargando: false })
      },

      sincronizarConServidor: async () => {
        const { mensajes } = get()
        if (mensajes.length > 0) return

        try {
          const res = await fetch("/api/mensajes")
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
          // Si falla la sincronización, no hacemos nada
        }
      },
    }),
    {
      name: "dentalai-chat",
      partialize: (state) => ({ mensajes: state.mensajes }),
    }
  )
)
