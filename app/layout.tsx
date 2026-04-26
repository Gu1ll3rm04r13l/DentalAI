import type { Metadata } from "next"
import "./globals.css"
import ThemeProvider from "@/components/ThemeProvider"

export const metadata: Metadata = {
  title: "DentalAI — Recepcionista Virtual para Clínicas Dentales",
  description:
    "Sarah, tu recepcionista virtual con IA. Agenda turnos, responde consultas y atiende a tus pacientes las 24hs.",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  )
}
