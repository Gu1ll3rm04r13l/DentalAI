import { parseISO, isBefore, startOfDay, getDay, format, addMinutes } from "date-fns"
import type { Turno } from "./tipos"

const HORA_INICIO = 9
const HORA_FIN = 18
const INTERVALO_MINUTOS = 30

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

export function esDomingo(fecha: string): boolean {
  const date = parseISO(fecha)
  return getDay(date) === 0
}

export function esFechaPasada(fecha: string): boolean {
  const hoy = startOfDay(new Date())
  const fechaDate = startOfDay(parseISO(fecha))
  return isBefore(fechaDate, hoy)
}

export function esFechaValida(fecha: string): { valida: boolean; error?: string } {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return { valida: false, error: "El formato de la fecha tiene que ser YYYY-MM-DD" }
  }
  if (esFechaPasada(fecha)) {
    return { valida: false, error: "No puedo agendar turnos en fechas que ya pasaron 😅" }
  }
  if (esDomingo(fecha)) {
    return { valida: false, error: "Los domingos estamos cerrados. ¿Te sirve otro día?" }
  }
  return { valida: true }
}

export function esSlotValido(hora: string): boolean {
  const slots = generarSlotsDelDia()
  return slots.includes(hora)
}

export function slotsLibres(fecha: string, turnos: Turno[]): string[] {
  const todos = generarSlotsDelDia()
  const ocupados = turnos
    .filter((t) => t.fecha === fecha && t.estado === "activo")
    .map((t) => t.hora)
  return todos.filter((slot) => !ocupados.includes(slot))
}

export function slotsLibresFuturos(fecha: string, turnos: Turno[]): string[] {
  const libres = slotsLibres(fecha, turnos)
  const hoy = format(new Date(), "yyyy-MM-dd")

  if (fecha !== hoy) return libres

  // Para hoy: solo mostrar slots con al menos 30 min de margen desde ahora
  const limiteMinimo = addMinutes(new Date(), 30)
  return libres.filter((slot) => {
    const [hh, mm] = slot.split(":").map(Number)
    const slotDate = new Date()
    slotDate.setHours(hh, mm, 0, 0)
    return !isBefore(slotDate, limiteMinimo)
  })
}

export function slotsCercanos(hora: string, slotsDisponibles: string[]): string[] {
  if (slotsDisponibles.length === 0) return []
  const todos = generarSlotsDelDia()
  const idx = todos.indexOf(hora)
  if (idx === -1) return slotsDisponibles.slice(0, 3)

  const cercanos: string[] = []
  let izq = idx - 1
  let der = idx + 1

  while (cercanos.length < 3 && (izq >= 0 || der < todos.length)) {
    if (izq >= 0 && slotsDisponibles.includes(todos[izq])) {
      cercanos.unshift(todos[izq])
    }
    if (der < todos.length && slotsDisponibles.includes(todos[der]) && cercanos.length < 3) {
      cercanos.push(todos[der])
    }
    izq--
    der++
  }

  return cercanos.length > 0 ? cercanos : slotsDisponibles.slice(0, 3)
}

export function formatearFecha(fechaISO: string): string {
  const [anio, mes, dia] = fechaISO.split("-")
  return `${dia}/${mes}/${anio}`
}
