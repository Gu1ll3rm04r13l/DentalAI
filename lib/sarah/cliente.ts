import Groq from "groq-sdk"

export const MODELO = "llama-3.1-8b-instant"

let _client: Groq | null = null

export function getGroqClient(): Groq {
  if (!_client) {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) {
      throw new Error("GROQ_API_KEY no está configurada. Revisá el archivo .env.local.")
    }
    _client = new Groq({ apiKey })
  }
  return _client
}
