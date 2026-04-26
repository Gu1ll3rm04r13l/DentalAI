import { writeFileSync, readFileSync, existsSync } from "fs"
import { join } from "path"
import { randomUUID } from "crypto"

const RUTA = join(process.cwd(), "data", "turnos.json")

const NOMBRES = [
  "Lucía Fernández", "Martín García", "Valentina López", "Santiago Rodríguez",
  "Camila Martínez", "Nicolás González", "Sofía Pérez", "Tomás Sánchez",
  "Julieta Torres", "Agustín Ramírez", "Florencia Díaz", "Federico Ruiz",
  "Natalia Morales", "Matías Jiménez", "Carolina Herrera", "Pablo Romero",
  "Daniela Castro", "Ignacio Vargas", "Rocío Medina", "Andrés Reyes",
]

const TELEFONOS = [
  "2214567890", "2234561234", "2214098765", "2215674321", "2218901234",
  "2219876543", "2213456789", "2216789012", "2217890123", "2212345678",
  "2210987654", "2211234567", "2213579246", "2215802468", "2219135790",
  "2214681357", "2217924680", "2216013579", "2218246801", "2213579012",
]

const TIPOS = [
  "Consulta general", "Limpieza dental", "Blanqueamiento", "Ortodoncia",
  "Extracción", "Endodoncia", "Control de brackets", "Radiografía",
  "Implante", "Consulta general",
]

const NOTAS_OPCIONALES = [
  "Primera visita", "Paciente con alergia al látex", "Viene derivado",
  undefined, undefined, undefined, undefined, undefined,
]

const SLOTS = [
  "09:00","09:30","10:00","10:30","11:00","11:30","12:00","12:30",
  "13:00","13:30","14:00","14:30","15:00","15:30","16:00","16:30","17:00","17:30",
]

function fechaAleatoria(): string {
  const hoy = new Date()
  // Distribuir entre ayer -5 días y +30 días para tener mix de activos/pasados
  const offsetDias = Math.floor(Math.random() * 36) - 5
  const fecha = new Date(hoy)
  fecha.setDate(hoy.getDate() + offsetDias)
  // Saltar domingos
  if (fecha.getDay() === 0) fecha.setDate(fecha.getDate() + 1)
  return fecha.toISOString().split("T")[0]
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

const existentes: Array<{ fecha: string; hora: string }> = []

function slotUnico(): { fecha: string; hora: string } {
  let intentos = 0
  while (intentos < 200) {
    const fecha = fechaAleatoria()
    const hora = pick(SLOTS)
    const ocupado = existentes.some((e) => e.fecha === fecha && e.hora === hora)
    if (!ocupado) {
      existentes.push({ fecha, hora })
      return { fecha, hora }
    }
    intentos++
  }
  throw new Error("No se pudieron generar suficientes slots únicos")
}

const turnosExistentes = existsSync(RUTA)
  ? JSON.parse(readFileSync(RUTA, "utf-8"))
  : []

const nuevos = Array.from({ length: 20 }, (_, i) => {
  const { fecha, hora } = slotUnico()
  const ahora = new Date().toISOString()
  const notas = NOTAS_OPCIONALES[i % NOTAS_OPCIONALES.length]
  return {
    id: randomUUID(),
    nombre_paciente: NOMBRES[i],
    telefono: TELEFONOS[i],
    fecha,
    hora,
    tipo_consulta: TIPOS[i % TIPOS.length],
    ...(notas ? { notas } : {}),
    estado: "activo",
    creado_en: ahora,
    actualizado_en: ahora,
  }
})

writeFileSync(RUTA, JSON.stringify([...turnosExistentes, ...nuevos], null, 2), "utf-8")
console.log(`✓ ${nuevos.length} turnos agregados a data/turnos.json`)
nuevos.forEach((t) => console.log(`  ${t.fecha} ${t.hora}hs — ${t.nombre_paciente}`))
