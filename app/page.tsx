import LandingNav from "@/components/landing/LandingNav"
import Hero from "@/components/landing/Hero"
import ChatPreview from "@/components/landing/ChatPreview"
import Beneficios from "@/components/landing/Beneficios"
import CTAFinal from "@/components/landing/CTAFinal"

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <LandingNav />

      <main>
        <Hero />
        <ChatPreview />
        <Beneficios />
        <CTAFinal />
      </main>

      <footer className="py-8 text-center border-t border-slate-100 dark:border-slate-800">
        <p className="text-slate-400 dark:text-slate-500 text-sm">Hecho con 🦷 por DentalAI — 2026</p>
      </footer>
    </div>
  )
}
