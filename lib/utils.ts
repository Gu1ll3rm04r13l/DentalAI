import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const MENSAJES_ERROR = {
  generico: "Uy, algo no salió bien. ¿Lo intentás de nuevo en un ratito?",
  red: "Parece que se cortó la conexión. Revisá tu internet y volvé a probar.",
  sin_api_key: "Falta configurar la clave de Groq. Revisá el archivo .env.local.",
  turno_ocupado: "Ese horario ya lo tomaron. ¿Probamos otro?",
  fecha_pasada: "No puedo agendar turnos en fechas que ya pasaron 😅",
  domingo: "Los domingos estamos cerrados. ¿Te sirve otro día?",
}
