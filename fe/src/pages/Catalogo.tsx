import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router'
import { ArrowDownWideNarrow, ArrowUpNarrowWide, ChevronLeft, ChevronRight, SearchX, Search } from 'lucide-react'
import AutoCard from '@/components/AutoCard'
import { Errore, Intestazione, Scheletro, Vuoto } from '@/components/ui'
import { api, type Auto, type Carrozzeria, type Ordinamento, type Pagina } from '@/lib/api'

// Stessi valori ammessi dal backend (OrdinamentoAuto): nient'altro esce da qui.
const ORDINI: { valore: Ordinamento; testo: string }[] = [
  { valore: 'recenti', testo: 'Novita\'' },
  { valore: 'prezzo', testo: 'Prezzo' },
  { valore: 'anno', testo: 'Anno' },
  { valore: 'marca', testo: 'Marca' },
  { valore: 'modello', testo: 'Modello' },
]

const CARROZZERIE: { valore: Carrozzeria; testo: string }[] = [
  { valore: 'citycar', testo: 'Citycar' },
  { valore: 'berlina', testo: 'Berlina' },
  { valore: 'suv', testo: 'SUV' },
  { valore: 'coupe', testo: 'Coupé' },
  { valore: 'cabrio', testo: 'Cabrio' },
  { valore: 'station_wagon', testo: 'Station wagon' },
]

const DIMENSIONE = 12

export default function Catalogo() {
  const [parametri, setParametri] = useSearchParams()
  const q = parametri.get('q') ?? ''
  const sortGrezzo = parametri.get('sort')
  const sort: Ordinamento = ORDINI.some((o) => o.valore === sortGrezzo) ? (sortGrezzo as Ordinamento) : 'recenti'
  const dir = parametri.get('dir') === 'asc' ? 'asc' : parametri.get('dir') === 'desc' ? 'desc' : undefined
  const pagina = Math.max(0, Number(parametri.get('page')) || 0)
  const carGrezza = parametri.get('carrozzeria')
  const carrozzeria = CARROZZERIE.find((c) => c.valore === carGrezza)?.valore

  const [testo, setTesto] = useState(q)
  const [dati, setDati] = useState<Pagina<Auto> | null>(null)
  const [errore, setErrore] = useState<string | null>(null)

  // Il campo di ricerca aggiorna l'URL dopo una breve pausa.
  useEffect(() => {
    const t = setTimeout(() => {
      if (testo !== q) aggiorna({ q: testo || null, page: null })
    }, 350)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [testo])

  useEffect(() => {
    let attivo = true
    setDati(null)
    setErrore(null)
    api
      .catalogo({ q, carrozzeria, sort, dir, page: pagina, size: DIMENSIONE })
      .then((d) => attivo && setDati(d))
      .catch((e) => attivo && setErrore(e.message))
    return () => {
      attivo = false
    }
  }, [q, carrozzeria, sort, dir, pagina])

  function aggiorna(modifiche: Record<string, string | null>) {
    const nuovi = new URLSearchParams(parametri)
    Object.entries(modifiche).forEach(([k, v]) => (v === null ? nuovi.delete(k) : nuovi.set(k, v)))
    setParametri(nuovi, { replace: true })
  }

  const direzioneEffettiva = dir ?? (sort === 'recenti' ? 'desc' : 'asc')

  return (
    <div className="mx-auto max-w-6xl px-5 pt-32">
      <Intestazione
        sopra="Catalogo"
        titolo="Tutte le auto in vetrina"
        sotto="Cerca per marca o modello, ordina come preferisci. Clicca un'auto per vederla in 3D."
      />

      <div className="vetro sticky top-20 z-30 mb-10 flex flex-col gap-3 rounded-2xl p-3 md:flex-row md:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Cerca</span>
          <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-fog" />
          <input
            value={testo}
            onChange={(e) => setTesto(e.target.value)}
            maxLength={100}
            placeholder="Cerca: Panda, Giulia, Ferrari…"
            className="w-full rounded-xl border border-line bg-ink/60 py-3 pl-11 pr-4 text-sm outline-none transition focus:border-ember"
          />
        </label>
        <div className="flex items-center gap-1 overflow-x-auto" role="group" aria-label="Ordina per">
          {ORDINI.map((o) => (
            <button
              key={o.valore}
              onClick={() => aggiorna({ sort: o.valore === 'recenti' ? null : o.valore, dir: null, page: null })}
              className="relative shrink-0 rounded-full px-3.5 py-2 text-xs font-semibold"
              aria-pressed={sort === o.valore}
            >
              {sort === o.valore && (
                <motion.span layoutId="ordine" className="absolute inset-0 rounded-full bg-ember" transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
              )}
              <span className={`relative ${sort === o.valore ? 'text-ink' : 'text-fog hover:text-paper'}`}>{o.testo}</span>
            </button>
          ))}
          <button
            onClick={() => aggiorna({ dir: direzioneEffettiva === 'asc' ? 'desc' : 'asc', page: null })}
            className="ml-1 shrink-0 rounded-full border border-line p-2 text-fog transition hover:border-ember hover:text-ember"
            aria-label={direzioneEffettiva === 'asc' ? 'Ordine crescente, passa a decrescente' : 'Ordine decrescente, passa a crescente'}
          >
            <motion.span key={direzioneEffettiva} initial={{ rotate: -180, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} className="block">
              {direzioneEffettiva === 'asc' ? <ArrowUpNarrowWide className="size-4" /> : <ArrowDownWideNarrow className="size-4" />}
            </motion.span>
          </button>
        </div>
      </div>

      <div className="-mt-6 mb-10 flex flex-wrap gap-2" role="group" aria-label="Filtra per carrozzeria">
        {[{ valore: undefined, testo: 'Tutte' }, ...CARROZZERIE].map((c) => {
          const attiva = carrozzeria === c.valore
          return (
            <motion.button
              key={c.testo}
              whileTap={{ scale: 0.92 }}
              onClick={() => aggiorna({ carrozzeria: c.valore ?? null, page: null })}
              aria-pressed={attiva}
              className={`rounded-full border px-4 py-1.5 text-xs font-semibold transition ${attiva ? 'border-neon bg-neon/15 text-neon' : 'border-line text-fog hover:border-white/30 hover:text-paper'}`}
            >
              {c.testo}
            </motion.button>
          )
        })}
      </div>

      {errore && <Errore testo={errore} />}

      {!errore && dati === null && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, i) => (
            <Scheletro key={i} className="h-80" />
          ))}
        </div>
      )}

      {dati && dati.contenuto.length === 0 && (
        <Vuoto
          icona={<SearchX className="size-7" />}
          titolo="Nessuna auto trovata"
          testo={q ? `Niente in vetrina per "${q}". Prova con un'altra marca.` : 'Il salone e\' vuoto per ora.'}
        />
      )}

      {dati && dati.contenuto.length > 0 && (
        <>
          <p className="mb-5 font-mono text-xs uppercase tracking-widest text-fog">
            {dati.totale} {dati.totale === 1 ? 'auto' : 'auto'} · pagina {dati.pagina + 1} di {dati.pagineTotali}
          </p>
          <AnimatePresence mode="popLayout">
            <motion.div layout className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {dati.contenuto.map((a, i) => (
                <AutoCard key={a.id} auto={a} indice={i} />
              ))}
            </motion.div>
          </AnimatePresence>

          {dati.pagineTotali > 1 && (
            <nav className="mt-12 flex items-center justify-center gap-2" aria-label="Pagine">
              <button
                disabled={pagina === 0}
                onClick={() => aggiorna({ page: String(pagina - 1) })}
                className="rounded-full border border-line p-2.5 text-fog hover:border-ember hover:text-ember disabled:opacity-30"
                aria-label="Pagina precedente"
              >
                <ChevronLeft className="size-4" />
              </button>
              {Array.from({ length: dati.pagineTotali }, (_, i) => i)
                .filter((i) => i === 0 || i === dati.pagineTotali - 1 || Math.abs(i - pagina) <= 1)
                .map((i, k, arr) => (
                <span key={i} className="flex items-center gap-2">
                {k > 0 && i - arr[k - 1] > 1 && <span className="text-fog">…</span>}
                <button
                  key={i}
                  onClick={() => aggiorna({ page: i === 0 ? null : String(i) })}
                  aria-current={i === pagina ? 'page' : undefined}
                  className={`size-10 rounded-full font-mono text-sm transition ${i === pagina ? 'bg-ember text-ink' : 'text-fog hover:bg-white/10'}`}
                >
                  {i + 1}
                </button>
                </span>
              ))}
              <button
                disabled={pagina >= dati.pagineTotali - 1}
                onClick={() => aggiorna({ page: String(pagina + 1) })}
                className="rounded-full border border-line p-2.5 text-fog hover:border-ember hover:text-ember disabled:opacity-30"
                aria-label="Pagina successiva"
              >
                <ChevronRight className="size-4" />
              </button>
            </nav>
          )}
        </>
      )}
    </div>
  )
}
