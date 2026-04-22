import { leerConfiguracion } from "@/lib/storage/configuracion"
import FormularioConfig from "@/components/panel/FormularioConfig"

export default async function ConfiguracionPage() {
  const config = await leerConfiguracion()

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Configuración de la clínica</h1>
        <p className="text-slate-500 text-sm mt-1">
          Datos que Sarah usa para responder a los pacientes.
        </p>
      </div>

      <FormularioConfig initialConfig={config} />
    </div>
  )
}
