
# DentalAI — Recepcionista Virtual para Clínicas Dentales

Sarah es una recepcionista virtual con IA que agenda turnos, responde consultas y atiende pacientes las 24hs, en español rioplatense natural.

## Stack

- **Next.js 14** (App Router) + **TypeScript** estricto
- **Tailwind CSS** + **shadcn/ui** para estilos
- **Groq SDK** con `llama-3.3-70b-versatile` y function calling
- **Zustand** para estado del chat (persistido en localStorage)
- **date-fns** con locale `es` para fechas
- **react-day-picker** para el calendario de turnos
- **framer-motion** para animaciones suaves
- **Zod** para validación de schemas
- Persistencia en archivos JSON (sin base de datos)

## Cómo correrlo

1. **Copiá el archivo de entorno:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Conseguí tu API key de Groq** (gratis) en https://console.groq.com/keys
   y pegala en `.env.local`:
   ```
   GROQ_API_KEY=tu_clave_acá
   ```

3. **Instalá dependencias y arrancá:**
   ```bash
   npm install
   npm run dev
   ```

4. Abrí **http://localhost:3000** en el navegador.

## Estructura de carpetas

```
dental-ai/
├── app/
│   ├── page.tsx              # Landing pública
│   ├── panel/               # Panel de administración
│   │   ├── chat/            # Chat con Sarah
│   │   ├── historial/       # Historial de mensajes
│   │   ├── turnos/          # Gestión de turnos
│   │   └── configuracion/   # Config de la clínica
│   └── api/                 # Endpoints REST
├── components/
│   ├── landing/             # Componentes de la landing
│   └── panel/               # Componentes del panel
├── lib/
│   ├── sarah/               # IA: system prompt, tools, dispatcher, cliente Groq
│   ├── storage/             # Lectura/escritura de archivos JSON
│   └── dominio/             # Tipos TypeScript + Zod + helpers de horarios
├── store/
│   └── chatStore.ts         # Zustand store del chat
└── data/
    ├── configuracion.json   # Config de la clínica (editable desde UI)
    ├── turnos.json          # Turnos agendados
    └── mensajes.json        # Historial de conversación
```

## Decisiones técnicas

- **Groq + llama-3.3-70b-versatile**: velocidad de inferencia muy alta, ideal para chat en tiempo real. El modelo soporta function calling nativo.
- **Archivos JSON con escritura atómica**: simplicidad sin DB. El escritor usa un archivo temporal + rename para evitar corrupciones.
- **Zustand + localStorage**: el historial de chat persiste entre recargas. Al montar el componente sincroniza con el servidor si no hay mensajes locales.
- **Loop de tool calls (máx 5 iteraciones)**: permite que Sarah encadene múltiples llamadas a tools en un solo turno (por ejemplo, verificar disponibilidad y luego agendar).
- **System prompt dinámico**: se genera en cada request con la configuración actual de la clínica y la fecha/hora real.

## Personalización

- **Datos de la clínica**: editables desde `/panel/configuracion` o directamente en `data/configuracion.json`.
- **Personalidad de Sarah**: `lib/sarah/systemPrompt.ts`
- **Reglas de horarios**: `lib/dominio/horarios.ts`
#
