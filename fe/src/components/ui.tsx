import { AnimatePresence, motion } from 'motion/react'
import { forwardRef, type ButtonHTMLAttributes, type InputHTMLAttributes, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { LoaderCircle, X } from 'lucide-react'
import SplitText from '@/components/bits/SplitText'

// ---------- Pulsante ----------

type Variante = 'primario' | 'secondario' | 'fantasma' | 'pericolo'

const STILI: Record<Variante, string> = {
  primario:
    'bg-ember text-ink hover:bg-ember-2 shadow-[0_0_30px_-6px_var(--color-ember)] hover:shadow-[0_0_44px_-4px_var(--color-ember)]',
  secondario: 'vetro text-paper hover:border-white/25',
  fantasma: 'text-fog hover:text-paper hover:bg-white/5',
  pericolo: 'bg-danger/15 text-danger border border-danger/30 hover:bg-danger hover:text-ink',
}

type PropsPulsante = ButtonHTMLAttributes<HTMLButtonElement> & {
  variante?: Variante
  carica?: boolean
  icona?: ReactNode
}

export const Pulsante = forwardRef<HTMLButtonElement, PropsPulsante>(function Pulsante(
  { variante = 'primario', carica = false, icona, className = '', children, disabled, ...resto },
  ref,
) {
  return (
    <button
      ref={ref}
      disabled={disabled || carica}
      className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 active:scale-95 disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ember ${STILI[variante]} ${className}`}
      {...resto}
    >
      {carica ? <LoaderCircle className="size-4 animate-spin" /> : icona}
      {children}
    </button>
  )
})

// ---------- Campo ----------

type PropsCampo = InputHTMLAttributes<HTMLInputElement> & { etichetta: string; errore?: string; nota?: string }

export const Campo = forwardRef<HTMLInputElement, PropsCampo>(function Campo(
  { etichetta, errore, nota, className = '', id, ...resto },
  ref,
) {
  const idCampo = id ?? `campo-${etichetta.toLowerCase().replace(/\W+/g, '-')}`
  return (
    <label htmlFor={idCampo} className={`block ${className}`}>
      <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.2em] text-fog">{etichetta}</span>
      <input
        ref={ref}
        id={idCampo}
        aria-invalid={!!errore}
        className={`w-full rounded-xl border bg-ink/70 px-4 py-3 text-sm text-paper outline-none transition placeholder:text-fog/50 focus:border-ember focus:shadow-[0_0_0_4px_rgb(255_106_26/0.15)] ${errore ? 'border-danger' : 'border-line'}`}
        {...resto}
      />
      {errore ? (
        <span className="mt-1 block text-xs text-danger">{errore}</span>
      ) : nota ? (
        <span className="mt-1 block text-xs text-fog">{nota}</span>
      ) : null}
    </label>
  )
})

// ---------- Intestazione di pagina ----------

export function Intestazione({ sopra, titolo, sotto, azioni }: { sopra: string; titolo: string; sotto?: string; azioni?: ReactNode }) {
  return (
    <header className="mb-10 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
      <div>
        <motion.p
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-3 font-mono text-xs uppercase tracking-[0.35em] text-ember"
        >
          {sopra}
        </motion.p>
        <SplitText
          key={titolo}
          text={titolo}
          tag="h1"
          textAlign="left"
          className="font-display text-4xl font-bold leading-[1.05] md:text-6xl"
          delay={25}
          duration={0.8}
          rootMargin="0px"
        />
        {sotto && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-4 max-w-xl text-fog"
          >
            {sotto}
          </motion.p>
        )}
      </div>
      {azioni && <div className="flex flex-wrap gap-3">{azioni}</div>}
    </header>
  )
}

// ---------- Stati vuoti e caricamento ----------

export function Vuoto({ icona, titolo, testo, azione }: { icona: ReactNode; titolo: string; testo: string; azione?: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="vetro mx-auto flex max-w-md flex-col items-center gap-4 rounded-3xl px-8 py-14 text-center"
    >
      <motion.div
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        className="grid size-16 place-items-center rounded-2xl bg-ember/10 text-ember"
      >
        {icona}
      </motion.div>
      <h2 className="font-display text-xl font-semibold">{titolo}</h2>
      <p className="text-sm text-fog">{testo}</p>
      {azione}
    </motion.div>
  )
}

export function Scheletro({ className = '' }: { className?: string }) {
  return (
    <div className={`relative overflow-hidden rounded-3xl border border-line bg-ink-2 ${className}`}>
      <motion.div
        className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-white/5 to-transparent"
        animate={{ x: ['-100%', '250%'] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  )
}

export function Errore({ testo }: { testo: string }) {
  return (
    <motion.p
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      role="alert"
      className="rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger"
    >
      {testo}
    </motion.p>
  )
}

// ---------- Modale ----------

export function Modale({
  aperta,
  chiudi,
  titolo,
  children,
}: {
  aperta: boolean
  chiudi: () => void
  titolo: string
  children: ReactNode
}) {
  return createPortal(
    <AnimatePresence>
      {aperta && (
        <motion.div
          className="fixed inset-0 z-[80] grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          role="dialog"
          aria-modal="true"
          aria-label={titolo}
          onKeyDown={(e) => e.key === 'Escape' && chiudi()}
        >
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={chiudi} />
          <motion.div
            className="vetro bordo-luce relative max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-3xl p-6 md:p-8"
            initial={{ y: 40, scale: 0.94, rotateX: 12 }}
            animate={{ y: 0, scale: 1, rotateX: 0 }}
            exit={{ y: 20, scale: 0.96, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            data-lenis-prevent
          >
            <div className="mb-6 flex items-center justify-between gap-4">
              <h2 className="font-display text-xl font-semibold">{titolo}</h2>
              <button onClick={chiudi} className="rounded-full p-2 text-fog hover:bg-white/10 hover:text-paper" aria-label="Chiudi">
                <X className="size-5" />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
