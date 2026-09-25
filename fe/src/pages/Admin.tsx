import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { Check, Eye, EyeOff, Pencil, Plus, Search, Tag, Trash2, TrendingDown, TrendingUp, X } from 'lucide-react'
import CountUp from '@/components/bits/CountUp'
import Sagoma from '@/components/Sagoma'
import { Campo, Errore, Intestazione, Modale, Pulsante, Scheletro } from '@/components/ui'
import { api, ApiError, type AutoAdmin, type DatiAuto, type Pagina } from '@/lib/api'
import { euro, sagomaDi, verniceDi } from '@/lib/formato'
import { useToast } from '@/lib/toast'

// ---------- Form auto (crea / modifica) ----------

type Bozza = {
  marca: string
  modello: string
  anno: string
  descrizione: string
  prezzo: string
  prezzoAcquisto: string
  pubblicata: boolean
}

const VUOTA: Bozza = {
  marca: '',
  modello: '',
  anno: String(new Date().getFullYear()),
  descrizione: '',
  prezzo: '',
  prezzoAcquisto: '',
  pubblicata: false,
}

function daAuto(a: AutoAdmin): Bozza {
  return {
    marca: a.marca,
    modello: a.modello,
    anno: String(a.anno),
    descrizione: a.descrizione ?? '',
    prezzo: String(a.prezzo),
    prezzoAcquisto: a.prezzoAcquisto == null ? '' : String(a.prezzoAcquisto),
    pubblicata: a.pubblicata,
  }
}

function FormAuto({ auto, fatto }: { auto: AutoAdmin | null; fatto: (a: AutoAdmin) => void }) {
  const [b, setB] = useState<Bozza>(auto ? daAuto(auto) : VUOTA)
  const [carica, setCarica] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)
  const [campi, setCampi] = useState<Record<string, string>>({})
  const imposta = (k: keyof Bozza) => (v: string | boolean) => setB((x) => ({ ...x, [k]: v }))

  async function invia(e: FormEvent) {
    e.preventDefault()
    setErrore(null)
    setCampi({})
    setCarica(true)
    const dati: DatiAuto = {
      marca: b.marca,
      modello: b.modello,
      anno: Number(b.anno),
      descrizione: b.descrizione.trim() || null,
      prezzoAcquisto: b.prezzoAcquisto === '' ? null : Number(b.prezzoAcquisto),
      pubblicata: b.pubblicata,
    }
    try {
      // In modifica il prezzo di vendita non si manda: cambia solo dal suo pulsante.
      fatto(auto ? await api.admin.modifica(auto.id, dati) : await api.admin.crea({ ...dati, prezzo: Number(b.prezzo) }))
    } catch (err) {
      if (err instanceof ApiError) {
        setErrore(err.message)
        setCampi(err.campi)
      }
    } finally {
      setCarica(false)
    }
  }

  return (
    <form onSubmit={invia} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Campo etichetta="Marca" value={b.marca} onChange={(e) => imposta('marca')(e.target.value)} maxLength={60} errore={campi.marca} required />
        <Campo etichetta="Modello" value={b.modello} onChange={(e) => imposta('modello')(e.target.value)} maxLength={80} errore={campi.modello} required />
        <Campo etichetta="Anno" type="number" min={1900} max={2100} value={b.anno} onChange={(e) => imposta('anno')(e.target.value)} errore={campi.anno} required />
        <Campo
          etichetta="Prezzo d'acquisto"
          type="number"
          min={0}
          step="0.01"
          value={b.prezzoAcquisto}
          onChange={(e) => imposta('prezzoAcquisto')(e.target.value)}
          errore={campi.prezzoAcquisto}
          nota="Visibile solo in officina"
        />
        {!auto && (
          <Campo
            etichetta="Prezzo di vendita"
            type="number"
            min={0.01}
            step="0.01"
            value={b.prezzo}
            onChange={(e) => imposta('prezzo')(e.target.value)}
            errore={campi.prezzo}
            required
          />
        )}
      </div>
      <label className="block">
        <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.2em] text-fog">Descrizione</span>
        <textarea
          value={b.descrizione}
          onChange={(e) => imposta('descrizione')(e.target.value)}
          maxLength={5000}
          rows={4}
          className="w-full rounded-xl border border-line bg-ink/70 px-4 py-3 text-sm outline-none focus:border-ember"
        />
        {campi.descrizione && <span className="text-xs text-danger">{campi.descrizione}</span>}
      </label>

      <button
        type="button"
        onClick={() => imposta('pubblicata')(!b.pubblicata)}
        className="flex w-full items-center justify-between rounded-2xl border border-line px-4 py-3 text-sm"
        aria-pressed={b.pubblicata}
      >
        <span className="flex items-center gap-2">
          {b.pubblicata ? <Eye className="size-4 text-volt" /> : <EyeOff className="size-4 text-fog" />}
          {b.pubblicata ? 'Pubblicata nel catalogo' : 'Bozza: la vedi solo tu'}
        </span>
        <span className={`relative h-6 w-11 rounded-full transition ${b.pubblicata ? 'bg-volt' : 'bg-line'}`}>
          <motion.span layout className={`absolute top-1 size-4 rounded-full bg-ink ${b.pubblicata ? 'right-1' : 'left-1'}`} />
        </span>
      </button>

      {auto && (
        <p className="text-xs text-fog">Il prezzo di vendita si cambia dal pulsante con il cartellino: e' l'unico punto che fa scattare gli avvisi.</p>
      )}
      {errore && <Errore testo={errore} />}
      <Pulsante type="submit" carica={carica} className="w-full" icona={<Check className="size-4" />}>
        {auto ? 'Salva modifiche' : 'Crea auto'}
      </Pulsante>
    </form>
  )
}

// ---------- Cambio prezzo ----------

function FormPrezzo({ auto, fatto }: { auto: AutoAdmin; fatto: (a: AutoAdmin) => void }) {
  const [prezzo, setPrezzo] = useState(String(auto.prezzo))
  const [carica, setCarica] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)
  const nuovo = Number(prezzo)
  const delta = nuovo - auto.prezzo
  const margine = auto.prezzoAcquisto != null ? nuovo - auto.prezzoAcquisto : null

  async function invia(e: FormEvent) {
    e.preventDefault()
    setErrore(null)
    setCarica(true)
    try {
      fatto(await api.admin.cambiaPrezzo(auto.id, nuovo))
    } catch (err) {
      setErrore((err as Error).message)
    } finally {
      setCarica(false)
    }
  }

  return (
    <form onSubmit={invia} className="space-y-5">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="rounded-2xl bg-ink/60 p-4">
          <p className="text-fog">Attuale</p>
          <p className="font-display text-xl font-bold">{euro(auto.prezzo)}</p>
        </div>
        <div className="rounded-2xl bg-ink/60 p-4">
          <p className="text-fog">Acquisto</p>
          <p className="font-display text-xl font-bold">{euro(auto.prezzoAcquisto)}</p>
        </div>
      </div>
      <Campo etichetta="Nuovo prezzo" type="number" min={0.01} step="0.01" value={prezzo} onChange={(e) => setPrezzo(e.target.value)} autoFocus />
      <AnimatePresence>
        {nuovo > 0 && delta !== 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`flex items-center justify-between rounded-2xl px-4 py-3 text-sm ${delta < 0 ? 'bg-volt/10 text-volt' : 'bg-ember/10 text-ember'}`}
          >
            <span className="flex items-center gap-2">
              {delta < 0 ? <TrendingDown className="size-4" /> : <TrendingUp className="size-4" />}
              {delta < 0 ? 'Ribasso: gli avvisi attraversati partono dopo il salvataggio' : 'Rialzo: nessun avviso'}
            </span>
            <span className="font-mono">{delta > 0 ? '+' : ''}{euro(delta)}</span>
          </motion.div>
        )}
      </AnimatePresence>
      {margine != null && nuovo > 0 && (
        <p className="text-sm text-fog">
          Margine con il nuovo prezzo: <span className={margine < 0 ? 'text-danger' : 'text-paper'}>{euro(margine)}</span>
        </p>
      )}
      {errore && <Errore testo={errore} />}
      <Pulsante type="submit" carica={carica} disabled={!(nuovo > 0) || delta === 0} className="w-full" icona={<Tag className="size-4" />}>
        Applica prezzo
      </Pulsante>
    </form>
  )
}

// ---------- Pagina ----------

type Pannello = { tipo: 'nuova' } | { tipo: 'modifica'; auto: AutoAdmin } | { tipo: 'prezzo'; auto: AutoAdmin } | { tipo: 'elimina'; auto: AutoAdmin }

export default function Admin() {
  const toast = useToast()
  const [dati, setDati] = useState<Pagina<AutoAdmin> | null>(null)
  const [errore, setErrore] = useState<string | null>(null)
  const [q, setQ] = useState('')
  const [pannello, setPannello] = useState<Pannello | null>(null)
  const [cancella, setCancella] = useState(false)

  const carica = useCallback(() => {
    api.admin
      .elenco({ q, size: 50, sort: 'recenti' })
      .then(setDati)
      .catch((e) => setErrore(e.message))
  }, [q])

  useEffect(() => {
    const t = setTimeout(carica, 300)
    return () => clearTimeout(t)
  }, [carica])

  const sostituisci = (a: AutoAdmin) =>
    setDati((d) => (d ? { ...d, contenuto: d.contenuto.some((x) => x.id === a.id) ? d.contenuto.map((x) => (x.id === a.id ? a : x)) : [a, ...d.contenuto] } : d))

  async function elimina(a: AutoAdmin) {
    setCancella(true)
    try {
      await api.admin.elimina(a.id)
      setDati((d) => (d ? { ...d, contenuto: d.contenuto.filter((x) => x.id !== a.id), totale: d.totale - 1 } : d))
      toast(`${a.modello} eliminata`, 'info')
      setPannello(null)
    } catch (e) {
      toast((e as Error).message, 'errore')
    } finally {
      setCancella(false)
    }
  }

  const lista = dati?.contenuto ?? []
  const pubblicate = lista.filter((a) => a.pubblicata).length
  const valore = lista.filter((a) => a.pubblicata).reduce((s, a) => s + a.prezzo, 0)
  const margine = lista.reduce((s, a) => s + (a.prezzoAcquisto != null ? a.prezzo - a.prezzoAcquisto : 0), 0)

  return (
    <div className="mx-auto max-w-6xl px-5 pt-32">
      <Intestazione
        sopra="Officina · solo amministratore"
        titolo="Gestione del salone"
        sotto="Bozze, prezzi d'acquisto e cambi di prezzo. Un ribasso sotto soglia manda la mail agli utenti interessati."
        azioni={
          <Pulsante onClick={() => setPannello({ tipo: 'nuova' })} icona={<Plus className="size-4" />}>
            Nuova auto
          </Pulsante>
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-4">
        {[
          { t: 'Auto totali', v: dati?.totale ?? 0, euro: false },
          { t: 'Pubblicate', v: pubblicate, euro: false },
          { t: 'Valore in vetrina', v: Math.round(valore), euro: true },
          { t: 'Margine potenziale', v: Math.round(margine), euro: true },
        ].map((k) => (
          <div key={k.t} className="bg-ink-2 p-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-fog">{k.t}</p>
            <p className="mt-1 font-display text-2xl font-bold tabular-nums">
              {k.euro && '€ '}
              <CountUp to={k.v} separator="." duration={1} />
            </p>
          </div>
        ))}
      </div>

      <label className="relative mb-6 block">
        <span className="sr-only">Cerca</span>
        <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-fog" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cerca marca o modello, bozze comprese…"
          maxLength={100}
          className="w-full rounded-2xl border border-line bg-ink-2 py-3 pl-11 pr-4 text-sm outline-none focus:border-ember"
        />
      </label>

      {errore && <Errore testo={errore} />}
      {!errore && dati === null && <Scheletro className="h-96" />}

      <ul className="space-y-3">
        <AnimatePresence initial={false}>
          {lista.map((a, i) => {
            const v = verniceDi(a.id)
            return (
              <motion.li
                key={a.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0, transition: { delay: Math.min(i, 10) * 0.03 } }}
                exit={{ opacity: 0, x: -80 }}
                className="group flex flex-wrap items-center gap-4 rounded-2xl border border-line bg-ink-2 p-3 pr-4 transition hover:border-white/20"
              >
                <div className="w-24 shrink-0 rounded-xl p-1" style={{ background: `radial-gradient(circle at 50% 80%, ${v.colore}44, transparent 70%)` }}>
                  <Sagoma colore={v.colore} tipo={sagomaDi(a.id)} className="w-full" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-ember">{a.marca}</span>
                    <span
                      className={`rounded-full px-2 py-0.5 font-mono text-[9px] uppercase tracking-widest ${a.pubblicata ? 'bg-volt/10 text-volt' : 'bg-white/10 text-fog'}`}
                    >
                      {a.pubblicata ? 'pubblicata' : 'bozza'}
                    </span>
                  </p>
                  {a.pubblicata ? (
                    <Link to={`/auto/${a.id}`} className="block truncate font-display font-semibold hover:text-ember">
                      {a.modello} <span className="text-fog">· {a.anno}</span>
                    </Link>
                  ) : (
                    <p className="truncate font-display font-semibold">
                      {a.modello} <span className="text-fog">· {a.anno}</span>
                    </p>
                  )}
                </div>
                <div className="text-right text-sm">
                  <p className="font-display text-lg font-bold tabular-nums">{euro(a.prezzo)}</p>
                  <p className="text-xs text-fog">acquisto {euro(a.prezzoAcquisto)}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => setPannello({ tipo: 'prezzo', auto: a })} className="rounded-full p-2 text-fog hover:bg-ember/15 hover:text-ember" aria-label={`Cambia prezzo di ${a.modello}`}>
                    <Tag className="size-4" />
                  </button>
                  <button onClick={() => setPannello({ tipo: 'modifica', auto: a })} className="rounded-full p-2 text-fog hover:bg-white/10 hover:text-paper" aria-label={`Modifica ${a.modello}`}>
                    <Pencil className="size-4" />
                  </button>
                  <button onClick={() => setPannello({ tipo: 'elimina', auto: a })} className="rounded-full p-2 text-fog hover:bg-danger/15 hover:text-danger" aria-label={`Elimina ${a.modello}`}>
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </motion.li>
            )
          })}
        </AnimatePresence>
      </ul>
      {dati && lista.length === 0 && <p className="rounded-3xl border border-dashed border-line p-10 text-center text-fog">Nessuna auto. Crea la prima!</p>}

      <Modale
        aperta={pannello?.tipo === 'nuova' || pannello?.tipo === 'modifica'}
        chiudi={() => setPannello(null)}
        titolo={pannello?.tipo === 'modifica' ? `Modifica ${pannello.auto.modello}` : 'Nuova auto'}
      >
        {(pannello?.tipo === 'nuova' || pannello?.tipo === 'modifica') && (
          <FormAuto
            key={pannello.tipo === 'modifica' ? pannello.auto.id : 'nuova'}
            auto={pannello.tipo === 'modifica' ? pannello.auto : null}
            fatto={(a) => {
              sostituisci(a)
              toast(pannello.tipo === 'modifica' ? 'Auto aggiornata' : 'Auto creata')
              setPannello(null)
            }}
          />
        )}
      </Modale>

      <Modale aperta={pannello?.tipo === 'prezzo'} chiudi={() => setPannello(null)} titolo={pannello?.tipo === 'prezzo' ? `Prezzo · ${pannello.auto.modello}` : 'Prezzo'}>
        {pannello?.tipo === 'prezzo' && (
          <FormPrezzo
            auto={pannello.auto}
            fatto={(a) => {
              sostituisci(a)
              toast(`Nuovo prezzo: ${euro(a.prezzo)}`)
              setPannello(null)
            }}
          />
        )}
      </Modale>

      <Modale aperta={pannello?.tipo === 'elimina'} chiudi={() => setPannello(null)} titolo="Eliminare l'auto?">
        {pannello?.tipo === 'elimina' && (
          <>
            <p className="text-sm text-fog">
              {pannello.auto.marca} {pannello.auto.modello} sparisce dal salone insieme ai preferiti e agli avvisi collegati.
            </p>
            <div className="mt-6 flex justify-end gap-3">
              <Pulsante variante="fantasma" onClick={() => setPannello(null)} icona={<X className="size-4" />}>
                Annulla
              </Pulsante>
              <Pulsante variante="pericolo" carica={cancella} onClick={() => elimina(pannello.auto)} icona={<Trash2 className="size-4" />}>
                Elimina
              </Pulsante>
            </div>
          </>
        )}
      </Modale>
    </div>
  )
}
