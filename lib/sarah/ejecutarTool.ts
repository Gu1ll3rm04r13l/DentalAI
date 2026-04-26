import {
  listarTurnos,
  crearTurno,
  actualizarEstado,
  buscarTurnoPorId,
  buscarTurnosPorPaciente,
  turnosActivosEnFechaFromList,
  estaOcupadoFromList,
} from "../storage/turnos"
import {
  esFechaValida,
  esSlotValido,
  slotsLibres,
  slotsLibresFuturos,
  slotsCercanos,
  formatearFecha,
} from "../dominio/horarios"

type ResultadoTool = Record<string, unknown>

const PLACEHOLDERS = ["?", "desconocido", "n/a", "unknown", "sin dato", "ninguno", "none", ""]

function esPlaceholder(valor: string): boolean {
  return PLACEHOLDERS.includes(valor.trim().toLowerCase())
}

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

async function verTurnosPaciente(args: {
  nombre_paciente?: string
  telefono?: string
}): Promise<ResultadoTool> {
  const { nombre_paciente, telefono } = args
  if (!nombre_paciente && !telefono) {
    return { error: "Necesito al menos el nombre o el teléfono del paciente para buscar." }
  }

  const turnos = await buscarTurnosPorPaciente(nombre_paciente, telefono)
  if (turnos.length === 0) {
    return { encontrado: false, mensaje: "No encontré turnos activos para ese paciente.", turnos: [] }
  }

  return {
    encontrado: true,
    turnos: turnos.map((t) => ({
      id: t.id,
      nombre_paciente: t.nombre_paciente,
      telefono: t.telefono,
      fecha: formatearFecha(t.fecha),
      hora: t.hora,
      tipo_consulta: t.tipo_consulta,
      notas: t.notas,
      estado: t.estado,
    })),
  }
}

async function agendarTurno(args: {
  nombre_paciente: string
  telefono: string
  fecha: string
  hora: string
  tipo_consulta: string
  notas?: string
}): Promise<ResultadoTool> {
  const { nombre_paciente, telefono, fecha, hora, tipo_consulta, notas } = args

  // Guardrail: rechazar datos placeholder o incompletos
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

async function cancelarTurno(args: { id_turno: string }): Promise<ResultadoTool> {
  const { id_turno } = args
  const turno = await buscarTurnoPorId(id_turno)
  if (!turno) {
    return { error: `No encontré ningún turno con el ID ${id_turno}.` }
  }
  if (turno.estado === "cancelado") {
    return { error: "Ese turno ya estaba cancelado." }
  }

  await actualizarEstado(id_turno, "cancelado")
  return {
    exito: true,
    mensaje: `✅ Turno de ${turno.nombre_paciente} del ${formatearFecha(turno.fecha)} a las ${turno.hora}hs cancelado correctamente.`,
    id_turno,
  }
}

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

export async function ejecutarTool(nombre: string, argumentosStr: string): Promise<string> {
  try {
    const args = JSON.parse(argumentosStr)

    let resultado: ResultadoTool
    switch (nombre) {
      case "ver_disponibilidad":
        resultado = await verDisponibilidad(args)
        break
      case "ver_turnos_paciente":
        resultado = await verTurnosPaciente(args)
        break
      case "agendar_turno":
        resultado = await agendarTurno(args)
        break
      case "cancelar_turno":
        resultado = await cancelarTurno(args)
        break
      case "reprogramar_turno":
        resultado = await reprogramarTurno(args)
        break
      default:
        resultado = { error: `Tool desconocida: ${nombre}` }
    }

    return JSON.stringify(resultado)
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Error desconocido"
    return JSON.stringify({ error: `Error ejecutando ${nombre}: ${msg}` })
  }
}
