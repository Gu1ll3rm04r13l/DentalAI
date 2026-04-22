import Link from "next/link"
import Hero from "@/components/landing/Hero"
import ChatPreview from "@/components/landing/ChatPreview"
import Beneficios from "@/components/landing/Beneficios"
import CTAFinal from "@/components/landing/CTAFinal"

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-slate-900">
          <span className="text-2xl">🦷</span>
          <span>DentalAI</span>
        </Link>
        <Link
          href="/panel/chat"
          className="px-5 py-2 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors"
        >
          Entrar al panel
        </Link>
      </nav>

      <main>
        <Hero />
        <ChatPreview />
        <Beneficios />
        <CTAFinal />
      </main>

      <footer className="py-8 text-center border-t border-slate-100">
        <p className="text-slate-400 text-sm">Hecho con 🦷 por DentalAI — 2026</p>
      </footer>
    </div>
  )
}
