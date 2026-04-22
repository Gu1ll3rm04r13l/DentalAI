export default function IndicadorEscribiendo() {
  return (
    <div className="flex items-end gap-2">
      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-base flex-shrink-0">
        🦷
      </div>
      <div className="px-4 py-3 rounded-2xl rounded-bl-sm bg-slate-100">
        <div className="flex gap-1.5 items-center h-4">
          <span
            className="w-2 h-2 rounded-full bg-slate-400 animate-bounce3"
            style={{ animationDelay: "0ms" }}
          />
          <span
            className="w-2 h-2 rounded-full bg-slate-400 animate-bounce3"
            style={{ animationDelay: "150ms" }}
          />
          <span
            className="w-2 h-2 rounded-full bg-slate-400 animate-bounce3"
            style={{ animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  )
}
