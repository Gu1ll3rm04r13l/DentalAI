import { z } from "zod"

export const EstadoTurnoSchema = z.enum(["activo", "cancelado", "completado"])
export type EstadoTurno = z.infer<typeof EstadoTurnoSchema>

export const TurnoSchema = z.object({
  id: z.string(),
  nombre_paciente: z.string().min(1),
  telefono: z.string().min(1),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  hora: z.string().regex(/^\d{2}:\d{2}$/),
  tipo_consulta: z.string().min(1),
  notas: z.string().optional(),
  estado: EstadoTurnoSchema,
  creado_en: z.string(),
  actualizado_en: z.string(),
})
export type Turno = z.infer<typeof TurnoSchema>

export const RolMensajeSchema = z.enum(["user", "assistant", "tool"])
export type RolMensaje = z.infer<typeof RolMensajeSchema>

export const MensajeSchema = z.object({
  id: z.string(),
  rol: RolMensajeSchema,
  contenido: z.string(),
  timestamp: z.string(),
  tool_calls: z.any().optional(),
  tool_call_id: z.string().optional(),
})
export type Mensaje = z.infer<typeof MensajeSchema>

export const ConfiguracionSchema = z.object({
  nombre: z.string().min(1, "Falta el nombre de la clínica"),
  direccion: z.string().min(1, "Falta la dirección"),
  telefono: z.string().min(1, "Falta el teléfono"),
  whatsapp: z.string().min(1, "Falta el WhatsApp"),
  email: z.string().email("Uy, el email no parece válido"),
  horarios: z.object({
    lunes_a_viernes: z.string().min(1, "Falta el horario de lunes a viernes"),
    sabados: z.string().min(1, "Falta el horario del sábado"),
    domingos: z.string().min(1, "Falta el horario del domingo"),
  }),
  servicios: z.array(z.string()).min(1, "Necesitás al menos un servicio"),
  descripcion: z.string().min(1, "Falta la descripción"),
})
export type Configuracion = z.infer<typeof ConfiguracionSchema>
