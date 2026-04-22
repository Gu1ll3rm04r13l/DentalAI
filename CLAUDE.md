# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Comandos

```bash
npm run dev      # Servidor de desarrollo (requiere GROQ_API_KEY en .env.local)
npm run build    # Build de producción + chequeo de tipos TypeScript
npm run lint     # ESLint
npm run start    # Servidor de producción (después del build)
```

No hay tests automatizados. El build (`npm run build`) actúa como verificación de tipos completa.

**Requisito**: `.env.local` con `GROQ_API_KEY=<clave>` antes de correr el servidor.

Si el dev server tira errores de caché de webpack (`ENOENT ... 0.pack.gz`): `rm -rf .next && npm run dev`.

---

## Arquitectura

### Capas principales

```
Request HTTP → app/api/chat/route.ts
                 ↓
           lib/sarah/           ← cerebro de la IA
           lib/storage/         ← I/O a JSON
           lib/dominio/         ← tipos y reglas de negocio
                 ↓
           data/*.json          ← persistencia (sin DB)
```

### Flujo del chat (`POST /api/chat`)

1. Lee `data/mensajes.json` (historial) y `data/configuracion.json`
2. Construye el system prompt dinámicamente con `buildSystemPrompt(config)` — incluye fecha/hora real
3. Envía a Groq `llama-3.3-70b-versatile` con los 5 tools definidos en `lib/sarah/tools.ts`
4. **Loop de tool calls** (máx. 5 iteraciones): si el modelo responde con `tool_calls`, ejecuta `ejecutarTool()`, guarda los mensajes tool en el historial y vuelve a llamar a Groq
5. Persiste todos los mensajes (user, assistant, tool) en `data/mensajes.json`
6. Devuelve `{ mensaje: string, mensajes_nuevos: Mensaje[] }`

El historial se trunca a los últimos 30 mensajes antes de mandar a Groq para evitar context overflow.

### Storage atómico

`lib/storage/archivo.ts` escribe vía `tmp → rename` para evitar corrupción en escrituras concurrentes. En Windows, `os.tmpdir()` debe estar en el mismo volumen que el proyecto o el rename falla.

### Cliente Groq lazy

`lib/sarah/cliente.ts` expone `getGroqClient()` (no una instancia directa). El cliente se instancia solo en el primer llamado para evitar errores en build time sin API key.

### Estado del cliente

`store/chatStore.ts` (Zustand + `persist`) guarda los mensajes en `localStorage` bajo la clave `dentalai-chat`. Solo almacena mensajes `user` y `assistant` — los mensajes `tool` quedan en el servidor. Al montar el chat, sincroniza con el servidor solo si el store local está vacío.

---

## Reglas de dominio

- **Horarios**: lunes a sábado, 09:00–17:30, slots cada 30 minutos. Domingos cerrado.
- **Disponibilidad hoy**: `slotsLibresFuturos()` filtra slots con menos de 30 min de anticipación desde el momento actual.
- **Estados de turno**: `activo | cancelado | completado`. Solo los `activo` cuentan como ocupados.
- **Fechas**: internamente `YYYY-MM-DD`, pero Sarah siempre muestra y recibe en `DD/MM/YYYY`. `formatearFecha()` hace la conversión.
- **Guardrail de placeholders**: `ejecutarTool.ts` rechaza llamadas a `agendar_turno` con `nombre_paciente`, `telefono` o `tipo_consulta` que sean `"?"`, vacíos, `"desconocido"`, etc.

---

## Convenciones de código

- **Idioma**: todo en español — nombres de variables, funciones, tipos, keys de JSON, mensajes de error y copy de UI.
- **Rutas API dinámicas**: toda ruta que lee `data/*.json` necesita `export const dynamic = "force-dynamic"` para evitar que Next.js la estatiqueé.
- **Sin `any`** salvo en `tool_calls` crudos de Groq (el SDK los tipea loose y es intencional).
- **Zod en la frontera**: los schemas de `lib/dominio/tipos.ts` se usan para validar tanto la entrada de los endpoints como la lectura de los archivos JSON.
- **Voz de Sarah**: español rioplatense, tuteo siempre. Revisar que ningún texto de UI o respuesta del system prompt suene neutro o formal.

---

## Datos y configuración

- `data/configuracion.json` — editable desde `/panel/configuracion`. Sarah la lee en cada request para construir el system prompt.
- `data/turnos.json` y `data/mensajes.json` — ignorados en git (`.gitignore`). Si no existen, `listarTurnos()` / `listarMensajes()` devuelven `[]` (try/catch interno).
- Para resetear la conversación: `DELETE /api/mensajes` o el botón "Nueva conversación" del panel.

---

## Archivos clave para modificar comportamiento de Sarah

| Qué cambiar | Dónde |
|---|---|
| Personalidad, reglas, voz | `lib/sarah/systemPrompt.ts` |
| Definición de los 5 tools (schema JSON) | `lib/sarah/tools.ts` |
| Lógica de ejecución de cada tool | `lib/sarah/ejecutarTool.ts` |
| Reglas de horarios y slots | `lib/dominio/horarios.ts` |
| Modelo de Groq | `lib/sarah/cliente.ts` → `MODELO` |
