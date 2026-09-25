import { motion } from 'motion/react'
import { useState, type FormEvent } from 'react'
import { BellPlus } from 'lucide-react'
import { Pulsante } from '@/components/ui'
import { euro } from '@/lib/formato'

/**
 * Cursore + campo numerico per scegliere la soglia. La soglia deve stare
 * sotto il prezzo attuale: e' lo stesso controllo che fa il backend.
 */
export default function SogliaForm({
  prezzo,
  invia,
  compatto = false,
}: {
  prezzo: number
  invia: (soglia: number) => Promise<void>
  compatto?: boolean
}) {
  const minimo = Math.max(1, Math.round(prezzo * 0.5))
  const massimo = Math.max(minimo, Math.floor(prezzo) - 1)
  const [soglia, setSoglia] = useState(Math.round(prezzo * 0.9))
  const [carica, setCarica] = useState(false)

  const sconto = Math.round((1 - soglia / prezzo) * 100)
  const pieno = ((soglia - minimo) / Math.max(1, massimo - minimo)) * 100
  const valida = soglia >= 1 && soglia < prezzo

  async function conferma(e: FormEvent) {
    e.preventDefault()
    if (!valida) return
    setCarica(true)
    try {
      await invia(soglia)
    } finally {
      setCarica(false)
    }
  }

  return (
    <form onSubmit={conferma} className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fog">Avvisami sotto</p>
          <motion.p
            key={soglia}
            initial={{ y: -6, opacity: 0.4 }}
            animate={{ y: 0, opacity: 1 }}
            className={`font-display font-bold tabular-nums ${compatto ? 'text-xl' : 'text-3xl'}`}
          >
            {euro(soglia)}
          </motion.p>
        </div>
        <span className="rounded-full bg-volt/10 px-3 py-1 font-mono text-xs text-volt">-{Math.max(0, sconto)}%</span>
      </div>

      <input
        type="range"
        className="cursore w-full"
        min={minimo}
        max={massimo}
        step={Math.max(1, Math.round(prezzo / 500))}
        value={Math.min(Math.max(soglia, minimo), massimo)}
        onChange={(e) => setSoglia(Number(e.target.value))}
        style={{ ['--pieno' as string]: `${pieno}%` }}
        aria-label="Soglia di prezzo"
      />

      <div className="flex gap-2">
        <label className="relative flex-1">
          <span className="sr-only">Soglia in euro</span>
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-fog">€</span>
          <input
            type="number"
            min={1}
            max={massimo}
            step="1"
            value={soglia}
            onChange={(e) => setSoglia(Number(e.target.value))}
            className="w-full rounded-xl border border-line bg-ink/70 py-2.5 pl-8 pr-3 text-sm tabular-nums outline-none focus:border-ember"
          />
        </label>
        <Pulsante type="submit" carica={carica} disabled={!valida} icona={<BellPlus className="size-4" />}>
          {compatto ? 'Attiva' : 'Attiva avviso'}
        </Pulsante>
      </div>
      {!valida && <p className="text-xs text-danger">La soglia deve essere sotto {euro(prezzo)}.</p>}
    </form>
  )
}
