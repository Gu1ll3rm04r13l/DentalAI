export const TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "ver_disponibilidad",
      description:
        "Devuelve los horarios libres para agendar un turno en una fecha específica. Usala cuando el paciente quiera saber qué horarios hay disponibles o antes de confirmar un turno.",
      parameters: {
        type: "object",
        properties: {
          fecha: {
            type: "string",
            description: "Fecha en formato YYYY-MM-DD (ejemplo: 2026-05-15)",
          },
        },
        required: ["fecha"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "ver_turnos_paciente",
      description:
        "Busca y devuelve los turnos activos de un paciente. Usala cuando el paciente quiera saber sus turnos o antes de cancelar/reprogramar.",
      parameters: {
        type: "object",
        properties: {
          nombre_paciente: {
            type: "string",
            description: "Nombre completo o parcial del paciente",
          },
          telefono: {
            type: "string",
            description: "Número de teléfono del paciente",
          },
        },
        required: [],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "agendar_turno",
      description:
        "Crea un turno nuevo para un paciente. IMPORTANTE: antes de llamar a esta función, siempre verificá que el slot esté libre con ver_disponibilidad y confirmá los datos con el paciente.",
      parameters: {
        type: "object",
        properties: {
          nombre_paciente: {
            type: "string",
            description: "Nombre completo del paciente",
          },
          telefono: {
            type: "string",
            description: "Número de teléfono del paciente",
          },
          fecha: {
            type: "string",
            description: "Fecha del turno en formato YYYY-MM-DD",
          },
          hora: {
            type: "string",
            description: "Hora del turno en formato HH:MM (ejemplo: 14:30)",
          },
          tipo_consulta: {
            type: "string",
            description:
              "Tipo de consulta (ejemplo: Limpieza dental, Consulta general, Ortodoncia, Blanqueamiento, Extracción, Urgencia)",
          },
          notas: {
            type: "string",
            description: "Notas adicionales opcionales sobre la consulta",
          },
        },
        required: ["nombre_paciente", "telefono", "fecha", "hora", "tipo_consulta"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "cancelar_turno",
      description:
        "Cancela un turno existente por su ID. Cambia el estado a cancelado. Usala cuando el paciente confirme que quiere cancelar.",
      parameters: {
        type: "object",
        properties: {
          id_turno: {
            type: "string",
            description: "El ID único del turno a cancelar",
          },
        },
        required: ["id_turno"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "reprogramar_turno",
      description:
        "Mueve un turno a una nueva fecha y hora. Cancela el turno viejo y crea uno nuevo con los mismos datos. Verificá disponibilidad antes.",
      parameters: {
        type: "object",
        properties: {
          id_turno: {
            type: "string",
            description: "El ID único del turno a reprogramar",
          },
          nueva_fecha: {
            type: "string",
            description: "Nueva fecha en formato YYYY-MM-DD",
          },
          nueva_hora: {
            type: "string",
            description: "Nueva hora en formato HH:MM",
          },
        },
        required: ["id_turno", "nueva_fecha", "nueva_hora"],
      },
    },
  },
]
