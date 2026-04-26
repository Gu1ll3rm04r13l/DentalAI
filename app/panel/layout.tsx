import Sidebar from "@/components/panel/Sidebar"

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50/30 dark:bg-slate-950 transition-colors duration-200">
      <Sidebar />
      <main className="flex-1 ml-[260px] min-h-screen">
        {children}
      </main>
    </div>
  )
}
