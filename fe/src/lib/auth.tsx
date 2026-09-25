import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { api, EVENTO_USCITA, token, type Utente } from '@/lib/api'

type StatoAuth = {
  utente: Utente | null
  pronto: boolean
  accedi: (email: string, password: string) => Promise<Utente>
  registrati: (email: string, nome: string, password: string) => Promise<Utente>
  esci: () => void
  aggiorna: (u: Utente) => void
}

const Contesto = createContext<StatoAuth | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [utente, setUtente] = useState<Utente | null>(null)
  const [pronto, setPronto] = useState(false)

  // All'avvio: se c'e' un token, si chiede al server chi siamo.
  useEffect(() => {
    if (!token.leggi()) {
      setPronto(true)
      return
    }
    api
      .profilo()
      .then(setUtente)
      .catch(() => token.cancella())
      .finally(() => setPronto(true))
  }, [])

  // Un 401 da qualunque chiamata fa uscire l'utente.
  useEffect(() => {
    const suUscita = () => setUtente(null)
    window.addEventListener(EVENTO_USCITA, suUscita)
    return () => window.removeEventListener(EVENTO_USCITA, suUscita)
  }, [])

  const accedi = useCallback(async (email: string, password: string) => {
    const r = await api.login(email, password)
    token.salva(r.token)
    setUtente(r.utente)
    return r.utente
  }, [])

  const registrati = useCallback(async (email: string, nome: string, password: string) => {
    const r = await api.registrazione(email, nome, password)
    token.salva(r.token)
    setUtente(r.utente)
    return r.utente
  }, [])

  const esci = useCallback(() => {
    token.cancella()
    setUtente(null)
  }, [])

  const valore = useMemo(
    () => ({ utente, pronto, accedi, registrati, esci, aggiorna: setUtente }),
    [utente, pronto, accedi, registrati, esci],
  )

  return <Contesto.Provider value={valore}>{children}</Contesto.Provider>
}

export function useAuth() {
  const c = useContext(Contesto)
  if (!c) throw new Error('useAuth fuori da AuthProvider')
  return c
}
