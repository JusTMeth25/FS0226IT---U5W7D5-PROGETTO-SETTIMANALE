import { AnimatePresence, motion } from 'motion/react'
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router'
import { Flag, Gauge, RotateCcw, Search, Shuffle, Timer, Trophy, Volume2, VolumeX, X, Zap } from 'lucide-react'
import GradientText from '@/components/bits/GradientText'
import Contagiri from '@/components/gara/Contagiri'
import type { Mondo } from '@/components/gara/Pista3D'
import { FotoAuto } from '@/components/FotoAuto'
import { Intestazione, Pulsante, Scheletro } from '@/components/ui'
import { api, type Auto, type EsitoGara, type RigaClassifica } from '@/lib/api'
import { AudioMotore } from '@/lib/audioMotore'
import { useAuth } from '@/lib/auth'
import { verniceDi } from '@/lib/formato'
import {
  cambia,
  DISTANZA,
  DT,
  formatoTempo,
  guidaPilota,
  motoreDi,
  nitro,
  passo,
  pilotaCasuale,
  regime,
  statoIniziale,
  tempoPerfetto,
  velocitaMarcia,
  type Motore,
  type Pilota,
  type StatoAuto,
} from '@/lib/gara'
import { useToast } from '@/lib/toast'

const Pista3D = lazy(() => import('@/components/gara/Pista3D'))

type Fase = 'scelta' | 'pronti' | 'gara' | 'fine'
type Pilotato = { auto: Auto; motore: Motore; stato: StatoAuto; pilota: Pilota | null }
type Hud = { t: number; regime: number; marcia: number; kmh: number; nitro: number; nitroUsato: boolean; posizioni: number[]; x: number[] }
type Giudizio = { testo: string; colore: string; id: number }

// ---------- Scelta dell'auto ----------

function Barra({ valore, colore, etichetta, testo }: { valore: number; colore: string; etichetta: string; testo: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between font-mono text-[10px] uppercase tracking-widest text-fog">
        <span>{etichetta}</span>
        <span className="text-paper">{testo}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-line">
        <motion.div
          className="h-full rounded-full"
          style={{ background: colore }}
          initial={{ width: 0 }}
          animate={{ width: `${Math.max(3, Math.min(100, valore * 100))}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  )
}

function Classifica({ righe, vuota }: { righe: RigaClassifica[] | null; vuota: string }) {
  if (righe === null) return <Scheletro className="h-40" />
  if (!righe.length) return <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-fog">{vuota}</p>
  return (
    <ol className="divide-y divide-line overflow-hidden rounded-2xl border border-line">
      {righe.map((r) => (
        <li key={`${r.posizione}-${r.nome}-${r.autoId}`} className="flex items-center gap-3 bg-ink-2 px-4 py-2.5 text-sm">
          <span
            className={`grid size-7 shrink-0 place-items-center rounded-full font-mono text-xs font-bold ${r.posizione === 1 ? 'bg-ember-2 text-ink' : r.posizione === 2 ? 'bg-paper/80 text-ink' : r.posizione === 3 ? 'bg-ember/70 text-ink' : 'bg-line text-fog'}`}
          >
            {r.posizione}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold">{r.nome}</span>
            <span className="block truncate text-xs text-fog">{r.auto}</span>
          </span>
          <span className="font-mono tabular-nums">{(r.millis / 1000).toFixed(3)} s</span>
        </li>
      ))}
    </ol>
  )
}

// ---------- Pagina ----------

export default function Gara() {
  const { utente } = useAuth()
  const toast = useToast()

  const [catalogo, setCatalogo] = useState<Auto[] | null>(null)
  const [cerca, setCerca] = useState('')
  const [scelta, setScelta] = useState<Auto | null>(null)
  const [avversari, setAvversari] = useState<Auto[]>([])
  const [modo, setModo] = useState<'simili' | 'casuali'>('simili')
  const [classificaAuto, setClassificaAuto] = useState<RigaClassifica[] | null>(null)
  const [generale, setGenerale] = useState<RigaClassifica[] | null>(null)
  const [miei, setMiei] = useState<RigaClassifica[] | null>(null)

  const [fase, setFase] = useState<Fase>('scelta')
  const [luci, setLuci] = useState(0) // 1-3 gialle, 4 verde
  const [hud, setHud] = useState<Hud | null>(null)
  const [giudizio, setGiudizio] = useState<Giudizio | null>(null)
  const [falsaPartenza, setFalsaPartenza] = useState(false)
  const [risultati, setRisultati] = useState<{ auto: Auto; tempo: number | null; reazione: number | null; tu: boolean }[] | null>(null)
  const [esito, setEsito] = useState<EsitoGara | null>(null)
  const [audioAttivo, setAudioAttivo] = useState(true)

  // ---------- dati ----------

  useEffect(() => {
    Promise.all([
      api.catalogo({ sort: 'prezzo', dir: 'desc', size: 50, page: 0 }),
      api.catalogo({ sort: 'prezzo', dir: 'desc', size: 50, page: 1 }),
    ])
      .then(([a, b]) => {
        const tutte = [...a.contenuto, ...b.contenuto].filter((x) => motoreDi(x))
        setCatalogo(tutte)
        setScelta((s) => s ?? tutte.find((x) => x.modello === 'Revuelto') ?? tutte[0] ?? null)
      })
      .catch(() => setCatalogo([]))
    api.gara.classifica().then(setGenerale).catch(() => setGenerale([]))
  }, [])

  useEffect(() => {
    if (!utente) {
      setMiei(null)
      return
    }
    api.gara.miei().then(setMiei).catch(() => setMiei([]))
  }, [utente, esito])

  useEffect(() => {
    if (!scelta) return
    setClassificaAuto(null)
    api.gara.classifica(scelta.id).then(setClassificaAuto).catch(() => setClassificaAuto([]))
  }, [scelta, esito])

  const scegliAvversari = useCallback(() => {
    if (!scelta || !catalogo) return
    const altri = catalogo.filter((a) => a.id !== scelta.id)
    let rosa = altri
    if (modo === 'simili') {
      const mio = scelta.prestazioni.zeroCento ?? 10
      rosa = [...altri].sort((a, b) => Math.abs((a.prestazioni.zeroCento ?? 99) - mio) - Math.abs((b.prestazioni.zeroCento ?? 99) - mio)).slice(0, 8)
    }
    setAvversari([...rosa].sort(() => Math.random() - 0.5).slice(0, 3))
  }, [scelta, catalogo, modo])

  useEffect(scegliAvversari, [scegliAvversari])

  const motoreScelto = useMemo(() => (scelta ? motoreDi(scelta) : null), [scelta])
  const perfetto = useMemo(() => (motoreScelto ? tempoPerfetto(motoreScelto) : null), [motoreScelto])

  const filtrate = useMemo(() => {
    const q = cerca.trim().toLowerCase()
    return (catalogo ?? []).filter((a) => !q || `${a.marca} ${a.modello}`.toLowerCase().includes(q))
  }, [catalogo, cerca])

  // ---------- motore della gara ----------

  const faseRif = useRef<Fase>('scelta')
  const piloti = useRef<Pilotato[]>([])
  const tempo = useRef({ t: 0, acc: 0, fineIn: -1, ultimoHud: 0, limitatore: 0 })
  const mondo = useRef<Mondo>({ auto: [], vmax: 1, fase: 'scelta' })
  const audio = useRef<AudioMotore | null>(null)
  const timer = useRef<number[]>([])

  const impostaFase = (f: Fase) => {
    faseRif.current = f
    mondo.current.fase = f
    setFase(f)
  }

  const pulisciTimer = () => {
    timer.current.forEach((id) => clearTimeout(id))
    timer.current = []
  }

  const esci = useCallback(() => {
    pulisciTimer()
    audio.current?.ferma()
    audio.current = null
    impostaFase('scelta')
    setRisultati(null)
    setHud(null)
  }, [])

  useEffect(() => () => {
    pulisciTimer()
    audio.current?.ferma()
  }, [])

  function avviaGara() {
    if (!scelta || avversari.length === 0) return
    const tutte = [scelta, ...avversari]
    piloti.current = tutte.map((a, i) => ({
      auto: a,
      motore: motoreDi(a)!,
      stato: statoIniziale(),
      pilota: i === 0 ? null : pilotaCasuale(0.6 + Math.random() * 0.4),
    }))
    const corsie = [1, 0, 2, 3]
    mondo.current = {
      auto: tutte.map((a, i) => ({ x: 0, v: 0, nitro: false, colore: verniceDi(a.id).colore, corsia: corsie[i] })),
      vmax: piloti.current[0].motore.vmax,
      fase: 'pronti',
    }
    tempo.current = { t: 0, acc: 0, fineIn: -1, ultimoHud: 0, limitatore: 0 }
    falsaPartenzaRif.current = false
    reazioneRif.current = null
    setRisultati(null)
    setEsito(null)
    setFalsaPartenza(false)
    setGiudizio(null)
    setLuci(0)
    audio.current?.ferma()
    audio.current = audioAttivo ? new AudioMotore(piloti.current[0].motore.marce === 1) : null
    impostaFase('pronti')

    // semaforo: tre gialle, poi il verde dopo un'attesa casuale (niente partenze a memoria)
    pulisciTimer()
    ;[1, 2, 3].forEach((n) => timer.current.push(window.setTimeout(() => setLuci(n), 900 + n * 650)))
    timer.current.push(
      window.setTimeout(() => {
        setLuci(4)
        tempo.current.t = 0
        impostaFase('gara')
      }, 900 + 3 * 650 + 400 + Math.random() * 1100),
    )
  }

  function mostraGiudizio(testo: string, colore: string) {
    setGiudizio({ testo, colore, id: Date.now() })
  }

  function concludi() {
    const g = piloti.current[0]
    const lista = piloti.current.map((p, i) => ({
      auto: p.auto,
      tempo: i === 0 && falsaPartenzaRif.current ? null : p.stato.arrivo,
      reazione: i === 0 ? reazioneRif.current : (p.pilota?.reazione ?? null),
      tu: i === 0,
    }))
    lista.sort((a, b) => (a.tempo ?? 999) - (b.tempo ?? 999))
    setRisultati(lista)
    impostaFase('fine')
    audio.current?.ferma()
    audio.current = null
    const t = g.stato.arrivo
    if (utente && t && !falsaPartenzaRif.current) {
      api.gara
        .registra(g.auto.id, Math.round(t * 1000))
        .then((e) => {
          setEsito(e)
          if (e.nuovoRecord) toast(`Record personale! ${formatoTempo(e.record / 1000)}`)
        })
        .catch((e) => toast((e as Error).message, 'errore'))
    }
  }

  const falsaPartenzaRif = useRef(false)
  const reazioneRif = useRef<number | null>(null)
  // aggiorna() nasce una volta sola: chiama sempre l'ultima versione di concludi
  const concludiRif = useRef(concludi)
  concludiRif.current = concludi

  /** Chiamata dalla scena a ogni frame: fisica a passo fisso da 1/120 s. */
  const aggiorna = useCallback((dt: number) => {
    const f = faseRif.current
    const ps = piloti.current
    if (f !== 'gara' || !ps.length) return
    const tm = tempo.current
    tm.acc += dt
    while (tm.acc >= DT) {
      tm.acc -= DT
      ps.forEach((p) => p.pilota && guidaPilota(p.motore, p.stato, p.pilota, tm.t))
      tm.t += DT
      ps.forEach((p) => passo(p.motore, p.stato, tm.t))
      const g = ps[0]
      if (g.stato.partita && g.stato.pausa <= 0 && g.stato.v / velocitaMarcia(g.motore, g.stato.marcia) >= 0.99 && g.stato.marcia < g.motore.marce) {
        tm.limitatore += DT
      }
    }
    ps.forEach((p, i) => {
      const a = mondo.current.auto[i]
      a.x = Math.min(p.stato.x, DISTANZA + 60)
      a.v = p.stato.v
      a.nitro = p.stato.nitro > 0
    })

    const g = ps[0]
    audio.current?.aggiorna(regime(g.motore, g.stato), g.stato.v / g.motore.vmax, g.stato.nitro > 0)

    // fine: il giocatore e' arrivato (o squalificato) e gli altri pure, o sono passati 60 s
    const tuttiArrivati = ps.every((p, i) => p.stato.arrivo !== null || (i === 0 && falsaPartenzaRif.current))
    if (tm.fineIn < 0 && (tuttiArrivati || tm.t > 60 || (g.stato.arrivo !== null && tm.t > g.stato.arrivo + 4))) {
      tm.fineIn = tm.t + 1.2
    }
    if (tm.fineIn > 0 && tm.t >= tm.fineIn) {
      tm.fineIn = Infinity
      // chi non e' ancora arrivato finisce la corsa "in silenzio"
      let t = tm.t
      while (ps.some((p, i) => p.stato.arrivo === null && !(i === 0 && (falsaPartenzaRif.current || !p.stato.partita))) && t < 90) {
        ps.forEach((p) => p.pilota && guidaPilota(p.motore, p.stato, p.pilota, t))
        t += DT
        ps.forEach((p) => passo(p.motore, p.stato, t))
      }
      concludiRif.current()
    }

    if (tm.t - tm.ultimoHud > 0.05) {
      tm.ultimoHud = tm.t
      const ordine = ps.map((p, i) => ({ i, x: p.stato.x })).sort((a, b) => b.x - a.x).map((o) => o.i)
      setHud({
        t: tm.t,
        regime: regime(g.motore, g.stato),
        marcia: g.stato.marcia,
        kmh: g.stato.v * 3.6,
        nitro: Math.max(0, g.stato.nitro),
        nitroUsato: g.stato.nitroUsato,
        posizioni: ordine,
        x: ps.map((p) => p.stato.x),
      })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // ---------- comandi ----------

  const premiVia = useCallback(() => {
    const f = faseRif.current
    const g = piloti.current[0]
    if (!g) return
    if (f === 'pronti') {
      if (!falsaPartenzaRif.current) {
        falsaPartenzaRif.current = true
        setFalsaPartenza(true)
        mostraGiudizio('FALSA PARTENZA', '#ff3b5c')
      }
      return
    }
    if (f !== 'gara' || falsaPartenzaRif.current) return
    if (!g.stato.partita) {
      g.stato.partita = true
      reazioneRif.current = tempo.current.t
      audio.current?.avvia()
      const r = tempo.current.t
      mostraGiudizio(r < 0.2 ? `REAZIONE ${r.toFixed(3)}!` : `REAZIONE ${r.toFixed(3)}`, r < 0.2 ? '#a3ff12' : '#ffb347')
      return
    }
    const r = regime(g.motore, g.stato)
    const limitatore = tempo.current.limitatore
    if (cambia(g.motore, g.stato)) {
      if (limitatore > 0.08) mostraGiudizio('TARDI', '#ff3b5c')
      else if (r >= 0.9) mostraGiudizio('CAMBIATA PERFETTA', '#3b82f6')
      else if (r >= 0.8) mostraGiudizio('BUONA', '#a3ff12')
      else mostraGiudizio('PRESTO', '#ffb347')
      tempo.current.limitatore = 0
    }
  }, [])

  const premiNitro = useCallback(() => {
    const g = piloti.current[0]
    if (faseRif.current === 'gara' && g && !falsaPartenzaRif.current && nitro(g.stato)) mostraGiudizio('NITRO!', '#22d3ee')
  }, [])

  useEffect(() => {
    if (fase === 'scelta') return
    const tasto = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
        e.preventDefault()
        premiVia()
      } else if (e.code === 'KeyN' || e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
        premiNitro()
      } else if (e.code === 'Escape') {
        esci()
      }
    }
    window.addEventListener('keydown', tasto)
    return () => window.removeEventListener('keydown', tasto)
  }, [fase, premiVia, premiNitro, esci])

  // ---------- UI ----------

  const elettrica = motoreScelto?.marce === 1

  return (
    <div className="mx-auto max-w-6xl px-5 pt-32">
      <Intestazione
        sopra="Drag race · 402 metri"
        titolo="Scegli l'auto, brucia l'asfalto"
        sotto="Prestazioni reali, fisica vera: 0-100 e velocità massima della casa. Parti al verde, cambia al momento giusto, spara il nitro."
      />

      <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr]">
        {/* elenco auto */}
        <div>
          <label className="relative mb-4 block">
            <span className="sr-only">Cerca un'auto</span>
            <Search className="absolute left-4 top-1/2 size-4 -translate-y-1/2 text-fog" />
            <input
              value={cerca}
              onChange={(e) => setCerca(e.target.value)}
              maxLength={60}
              placeholder="Cerca nel garage…"
              className="w-full rounded-2xl border border-line bg-ink-2 py-3 pl-11 pr-4 text-sm outline-none focus:border-ember"
            />
          </label>
          <div className="grid max-h-[560px] grid-cols-2 gap-3 overflow-y-auto pr-1 sm:grid-cols-3" data-lenis-prevent>
            {catalogo === null && Array.from({ length: 9 }, (_, i) => <Scheletro key={i} className="h-32" />)}
            {filtrate.map((a) => (
              <button
                key={a.id}
                onClick={() => setScelta(a)}
                className={`group overflow-hidden rounded-2xl border text-left transition ${scelta?.id === a.id ? 'border-ember shadow-[0_0_24px_-6px_var(--color-ember)]' : 'border-line hover:border-white/30'}`}
              >
                <div className="h-20 overflow-hidden">
                  <FotoAuto auto={a} className="size-full transition-transform duration-500 group-hover:scale-110" />
                </div>
                <div className="bg-ink-2 p-2.5">
                  <p className="truncate font-mono text-[9px] uppercase tracking-widest text-ember">{a.marca}</p>
                  <p className="truncate text-sm font-semibold">{a.modello}</p>
                  <p className="font-mono text-[10px] text-fog">0-100 {a.prestazioni.zeroCento} s</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* auto scelta */}
        <div className="space-y-5">
          {scelta ? (
            <motion.div key={scelta.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="vetro bordo-luce overflow-hidden rounded-3xl">
              <div className="relative h-52">
                <FotoAuto auto={scelta} grande className="size-full" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-2 via-transparent" />
                <div className="absolute bottom-4 left-5">
                  <p className="font-mono text-xs uppercase tracking-[0.3em] text-ember">{scelta.marca}</p>
                  <p className="font-display text-3xl font-black">{scelta.modello}</p>
                  <p className="text-xs text-fog">{scelta.prestazioni.versione}</p>
                </div>
              </div>
              <div className="grid gap-4 p-5 sm:grid-cols-2">
                <Barra etichetta="Potenza" testo={`${scelta.prestazioni.cv} CV`} valore={(scelta.prestazioni.cv ?? 0) / 1015} colore="linear-gradient(90deg,#ff6a1a,#ffb347)" />
                <Barra etichetta="0-100 km/h" testo={`${scelta.prestazioni.zeroCento} s`} valore={2.5 / (scelta.prestazioni.zeroCento ?? 30)} colore="linear-gradient(90deg,#22d3ee,#a3ff12)" />
                <Barra etichetta="Velocità max" testo={`${scelta.prestazioni.velocitaMax} km/h`} valore={(scelta.prestazioni.velocitaMax ?? 0) / 350} colore="linear-gradient(90deg,#7b2ff7,#22d3ee)" />
                <Barra etichetta="Peso" testo={`${scelta.prestazioni.pesoKg} kg`} valore={(scelta.prestazioni.pesoKg ?? 0) / 2700} colore="linear-gradient(90deg,#5b6270,#f4f4f8)" />
              </div>
              <div className="flex items-center justify-between gap-3 border-t border-line px-5 py-3 text-sm">
                <span className="flex items-center gap-2 text-fog">
                  <Timer className="size-4 text-ember" /> Guida perfetta sui 402 m
                </span>
                <span className="font-mono tabular-nums">{formatoTempo(perfetto)}</span>
              </div>
            </motion.div>
          ) : (
            <Scheletro className="h-96" />
          )}

          {/* avversari */}
          <div className="rounded-3xl border border-line bg-ink-2 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fog">Avversari</p>
              <div className="flex items-center gap-2">
                {(['simili', 'casuali'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setModo(m)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${modo === m ? 'bg-neon/15 text-neon' : 'text-fog hover:text-paper'}`}
                  >
                    {m === 'simili' ? 'Alla pari' : 'A caso'}
                  </button>
                ))}
                <button onClick={scegliAvversari} className="rounded-full p-2 text-fog hover:bg-white/10 hover:text-paper" aria-label="Rimescola avversari">
                  <Shuffle className="size-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <AnimatePresence mode="popLayout">
                {avversari.map((a) => (
                  <motion.div key={a.id} layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="overflow-hidden rounded-xl border border-line">
                    <div className="h-16">
                      <FotoAuto auto={a} className="size-full" />
                    </div>
                    <p className="truncate px-2 py-1.5 text-xs">
                      <span className="text-fog">{a.marca}</span> {a.modello}
                    </p>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>

          <Pulsante onClick={avviaGara} disabled={!scelta || !avversari.length} className="w-full py-4 text-base" icona={<Flag className="size-5" />}>
            In pista!
          </Pulsante>
          <p className="text-center font-mono text-[10px] uppercase tracking-widest text-fog">
            Spazio / ↑ = partenza e cambiata · N / Shift = nitro · Esc = esci
          </p>
          {!utente && (
            <p className="text-center text-xs text-fog">
              <Link to="/accedi?da=/gara" className="text-ember hover:underline">
                Accedi
              </Link>{' '}
              per salvare i tuoi tempi in classifica.
            </p>
          )}
        </div>
      </div>

      {/* classifiche */}
      <div className="mt-16 grid gap-8 md:grid-cols-3">
        <div>
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
            <Gauge className="size-5 text-ember" /> {scelta ? `${scelta.marca} ${scelta.modello}` : 'Auto scelta'}
          </h2>
          <Classifica righe={classificaAuto} vuota="Nessun tempo con questa auto. Il primo posto e' libero!" />
        </div>
        <div>
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
            <Trophy className="size-5 text-ember-2" /> Classifica generale
          </h2>
          <Classifica righe={generale} vuota="Ancora nessun tempo registrato." />
        </div>
        <div>
          <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
            <Timer className="size-5 text-neon" /> I miei tempi
          </h2>
          {utente ? <Classifica righe={miei} vuota="Corri la tua prima gara!" /> : <p className="rounded-2xl border border-dashed border-line p-6 text-center text-sm text-fog">Accedi per vedere i tuoi record.</p>}
        </div>
      </div>

      {/* ---------- gara a tutto schermo (portal: sopra navbar e pagina) ---------- */}
      {createPortal(
      <AnimatePresence>
        {fase !== 'scelta' && (
          <motion.div className="fixed inset-0 z-[58] bg-ink" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} data-lenis-prevent>
            <Suspense fallback={<div className="grid h-full place-items-center font-mono text-xs text-fog">scaldo le gomme…</div>}>
              <Pista3D key={piloti.current.map((p) => p.auto.id).join('-')} mondo={mondo} aggiorna={aggiorna} />
            </Suspense>

            {/* barra alta: tempo, posizioni, uscita */}
            <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-4 p-4">
              <div className="vetro rounded-2xl px-4 py-2">
                <p className="font-mono text-[10px] uppercase tracking-widest text-fog">Tempo</p>
                <p className="font-display text-2xl font-bold tabular-nums">{(fase === 'gara' || fase === 'fine') && hud ? hud.t.toFixed(2) : '0.00'}</p>
              </div>
              <div className="vetro hidden w-[min(50vw,520px)] rounded-2xl px-4 py-3 md:block">
                <div className="relative h-2 rounded-full bg-line">
                  {piloti.current.map((p, i) => (
                    <span
                      key={p.auto.id}
                      className={`absolute top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-ink ${i === 0 ? 'size-4 z-10' : 'size-3'}`}
                      style={{ left: `${Math.min(100, ((hud?.x[i] ?? 0) / DISTANZA) * 100)}%`, background: i === 0 ? '#ff6a1a' : verniceDi(p.auto.id).colore }}
                    />
                  ))}
                  <Flag className="absolute -right-1 -top-5 size-4 text-paper" />
                </div>
                <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-widest text-fog">
                  {hud ? `${hud.posizioni.indexOf(0) + 1}° posto · ${Math.max(0, DISTANZA - hud.x[0]).toFixed(0)} m al traguardo` : '402 m'}
                </p>
              </div>
              <div className="pointer-events-auto flex gap-2">
                <button
                  onClick={() => {
                    setAudioAttivo((a) => !a)
                    if (audioAttivo) {
                      audio.current?.ferma()
                      audio.current = null
                    }
                  }}
                  className="vetro rounded-full p-3 text-fog hover:text-paper"
                  aria-label={audioAttivo ? 'Disattiva audio' : 'Attiva audio'}
                >
                  {audioAttivo ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
                </button>
                <button onClick={esci} className="vetro rounded-full p-3 text-fog hover:text-paper" aria-label="Esci dalla gara">
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* semaforo */}
            <AnimatePresence>
              {(fase === 'pronti' || (fase === 'gara' && (hud?.t ?? 0) < 1)) && (
                <motion.div
                  initial={{ y: -80, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -80, opacity: 0 }}
                  className="pointer-events-none absolute left-1/2 top-24 flex -translate-x-1/2 gap-3 rounded-3xl border border-white/10 bg-black/70 px-5 py-4 backdrop-blur"
                >
                  {[1, 2, 3, 4].map((n) => {
                    const verde = n === 4
                    const accesa = verde ? luci === 4 : luci >= n && luci < 4
                    const colore = verde ? '#a3ff12' : '#ffb347'
                    return (
                      <span
                        key={n}
                        className="size-10 rounded-full transition-all duration-100"
                        style={{ background: accesa ? colore : '#1a1a22', boxShadow: accesa ? `0 0 30px ${colore}, 0 0 60px ${colore}` : 'none' }}
                      />
                    )
                  })}
                </motion.div>
              )}
            </AnimatePresence>

            {/* giudizi al volo */}
            <AnimatePresence>
              {giudizio && (
                <motion.p
                  key={giudizio.id}
                  initial={{ scale: 0.4, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 1.6, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 18 }}
                  onAnimationComplete={() => setTimeout(() => setGiudizio((g) => (g?.id === giudizio.id ? null : g)), 500)}
                  className="pointer-events-none absolute left-1/2 top-[40%] -translate-x-1/2 whitespace-nowrap font-display text-4xl font-black italic md:text-6xl"
                  style={{ color: giudizio.colore, textShadow: `0 0 30px ${giudizio.colore}` }}
                >
                  {giudizio.testo}
                </motion.p>
              )}
            </AnimatePresence>

            {fase === 'pronti' && !falsaPartenza && (
              <p className="pointer-events-none absolute left-1/2 top-48 -translate-x-1/2 animate-pulse font-mono text-xs uppercase tracking-[0.3em] text-fog">
                Aspetta il verde…
              </p>
            )}

            {/* cruscotto */}
            {(fase === 'pronti' || fase === 'gara') && (
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-4 p-4">
                <div className="hidden w-48 md:block">
                  <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-fog">Nitro</p>
                  <div className="h-3 overflow-hidden rounded-full bg-line">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-neon to-paper transition-all"
                      style={{ width: `${hud?.nitroUsato ? (hud.nitro / 2) * 100 : 100}%`, boxShadow: '0 0 16px #22d3ee' }}
                    />
                  </div>
                </div>
                <Contagiri regime={hud?.regime ?? 0} marcia={hud?.marcia ?? 1} kmh={hud?.kmh ?? 0} elettrica={elettrica} />
                <div className="flex flex-col gap-2">
                  <button
                    onPointerDown={premiNitro}
                    disabled={hud?.nitroUsato}
                    className="rounded-2xl border border-neon/50 bg-neon/15 px-5 py-4 font-display font-bold text-neon active:scale-95 disabled:opacity-30"
                  >
                    <Zap className="mx-auto size-6" /> NITRO
                  </button>
                  <button
                    onPointerDown={premiVia}
                    className="rounded-2xl bg-ember px-5 py-5 font-display text-lg font-black text-ink shadow-[0_0_40px_-6px_var(--color-ember)] active:scale-95"
                  >
                    {piloti.current[0]?.stato.partita ? (elettrica ? 'GAS' : 'CAMBIA') : 'VIA'}
                  </button>
                </div>
              </div>
            )}

            {/* risultati */}
            <AnimatePresence>
              {fase === 'fine' && risultati && (
                <motion.div className="absolute inset-0 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <motion.div
                    initial={{ y: 60, scale: 0.9, rotateX: 20 }}
                    animate={{ y: 0, scale: 1, rotateX: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="vetro bordo-luce w-full max-w-lg rounded-3xl p-6"
                    data-lenis-prevent
                  >
                    <div className="mb-5 text-center">
                      <GradientText colors={['#ff6a1a', '#ffb347', '#22d3ee']} className="font-display text-3xl font-black">
                        {falsaPartenza ? 'Squalificato' : risultati[0].tu ? 'Vittoria!' : `${risultati.findIndex((r) => r.tu) + 1}° posto`}
                      </GradientText>
                    </div>
                    <ol className="space-y-2">
                      {risultati.map((r, i) => (
                        <motion.li
                          key={r.auto.id}
                          initial={{ opacity: 0, x: -30 }}
                          animate={{ opacity: 1, x: 0, transition: { delay: 0.2 + i * 0.12 } }}
                          className={`flex items-center gap-3 rounded-2xl px-3 py-2 ${r.tu ? 'bg-ember/15 ring-1 ring-ember' : 'bg-ink/60'}`}
                        >
                          <span className="w-6 text-center font-display font-bold">{r.tempo ? i + 1 : '—'}</span>
                          <span className="h-10 w-16 shrink-0 overflow-hidden rounded-lg">
                            <FotoAuto auto={r.auto} className="size-full" />
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold">
                              {r.tu ? 'Tu · ' : ''}
                              {r.auto.marca} {r.auto.modello}
                            </span>
                            <span className="font-mono text-[10px] text-fog">reazione {r.reazione != null ? r.reazione.toFixed(3) : '—'}</span>
                          </span>
                          <span className="font-mono text-sm tabular-nums">{r.tempo ? formatoTempo(r.tempo) : 'DQ'}</span>
                        </motion.li>
                      ))}
                    </ol>
                    <div className="mt-4 rounded-2xl bg-ink/60 px-4 py-3 text-sm text-fog">
                      Guida perfetta con questa auto: <span className="font-mono text-paper">{formatoTempo(perfetto)}</span>
                      {esito && (
                        <span className="mt-1 block text-paper">
                          {esito.nuovoRecord ? 'Nuovo record personale! ' : `Il tuo record resta ${formatoTempo(esito.record / 1000)}. `}
                          Sei {esito.posizione}° in classifica con questa auto.
                        </span>
                      )}
                      {!utente && !falsaPartenza && <span className="mt-1 block">Accedi per salvare il tempo in classifica.</span>}
                    </div>
                    <div className="mt-5 flex gap-3">
                      <Pulsante className="flex-1" onClick={avviaGara} icona={<RotateCcw className="size-4" />}>
                        Rivincita
                      </Pulsante>
                      <Pulsante variante="secondario" className="flex-1" onClick={esci}>
                        Cambia auto
                      </Pulsante>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>,
      document.body,
      )}
    </div>
  )
}
