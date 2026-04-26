"use client"

import { createContext, useContext, useEffect, useState } from "react"

type Tema = "light" | "dark"

interface ThemeContextValue {
  tema: Tema
  toggleTema: () => void
}

const ThemeContext = createContext<ThemeContextValue>({
  tema: "light",
  toggleTema: () => {},
})

export function useTheme() {
  return useContext(ThemeContext)
}

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [tema, setTema] = useState<Tema>("light")

  useEffect(() => {
    const guardado = localStorage.getItem("tema") as Tema | null
    const inicial = guardado ?? "light"
    setTema(inicial)
    if (inicial === "dark") {
      document.documentElement.classList.add("dark")
    }
  }, [])

  function toggleTema() {
    const nuevo: Tema = tema === "light" ? "dark" : "light"
    setTema(nuevo)
    localStorage.setItem("tema", nuevo)
    document.documentElement.classList.toggle("dark", nuevo === "dark")
  }

  return (
    <ThemeContext.Provider value={{ tema, toggleTema }}>
      {children}
    </ThemeContext.Provider>
  )
}
