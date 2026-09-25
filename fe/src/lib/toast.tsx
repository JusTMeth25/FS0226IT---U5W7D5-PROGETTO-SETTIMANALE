import { AnimatePresence, motion } from 'motion/react'
import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'
import { CircleAlert, CircleCheck, Info } from 'lucide-react'

type Tipo = 'ok' | 'errore' | 'info'
type Toast = { id: number; tipo: Tipo; testo: string }

const Contesto = createContext<(testo: string, tipo?: Tipo) => void>(() => {})

let prossimo = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [lista, setLista] = useState<Toast[]>([])

  const mostra = useCallback((testo: string, tipo: Tipo = 'ok') => {
    const id = prossimo++
    setLista((l) => [...l, { id, tipo, testo }])
    setTimeout(() => setLista((l) => l.filter((t) => t.id !== id)), 4200)
  }, [])

  return (
    <Contesto.Provider value={mostra}>
      {children}
      <div
        className="pointer-events-none fixed bottom-4 left-1/2 z-[70] flex w-[min(92vw,420px)] -translate-x-1/2 flex-col gap-2"
        aria-live="polite"
      >
        <AnimatePresence>
          {lista.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, x: 80, transition: { duration: 0.2 } }}
              className="vetro pointer-events-auto flex items-start gap-3 rounded-2xl px-4 py-3 text-sm shadow-2xl"
            >
              {t.tipo === 'ok' && <CircleCheck className="mt-0.5 size-4 shrink-0 text-volt" />}
              {t.tipo === 'errore' && <CircleAlert className="mt-0.5 size-4 shrink-0 text-danger" />}
              {t.tipo === 'info' && <Info className="mt-0.5 size-4 shrink-0 text-neon" />}
              <span>{t.testo}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Contesto.Provider>
  )
}

export const useToast = () => useContext(Contesto)
