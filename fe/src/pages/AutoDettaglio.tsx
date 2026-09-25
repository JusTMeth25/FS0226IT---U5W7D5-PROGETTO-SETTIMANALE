import { AnimatePresence, motion } from 'motion/react'
import { lazy, Suspense, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { ArrowLeft, BellRing, CalendarDays, CarFront, Heart, LogIn, Palette, Trash2 } from 'lucide-react'
import CountUp from '@/components/bits/CountUp'
import SogliaForm from '@/components/SogliaForm'
import { Errore, Pulsante, Scheletro, Vuoto } from '@/components/ui'
import { api, ApiError, type Auto, type Avviso, type Preferito } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { euro, VERNICI, verniceDi } from '@/lib/formato'
import { useToast } from '@/lib/toast'

const Showroom = lazy(() => import('@/components/three/Showroom'))

export default function AutoDettaglio() {
  const { id } = useParams()
  const idAuto = Number(id)
  const { utente } = useAuth()
  const toast = useToast()

  const [auto, setAuto] = useState<Auto | null>(null)
  const [errore, setErrore] = useState<ApiError | null>(null)
  const [vernice, setVernice] = useState(verniceDi(idAuto))
  const [preferito, setPreferito] = useState<Preferito | null>(null)
  const [avviso, setAvviso] = useState<Avviso | null>(null)
  const [cuore, setCuore] = useState(false)

  useEffect(() => {
    setAuto(null)
    setErrore(null)
    setVernice(verniceDi(idAuto))
    if (!Number.isInteger(idAuto) || idAuto <= 0) {
      setErrore(new ApiError(404, 'Auto non trovata'))
      return
    }
    api.auto(idAuto).then(setAuto).catch(setErrore)
  }, [idAuto])

  // Stato personale: preferito e avviso di questa auto.
  useEffect(() => {
    if (!utente) {
      setPreferito(null)
      setAvviso(null)
      return
    }
    api.preferiti().then((l) => setPreferito(l.find((p) => p.auto.id === idAuto) ?? null)).catch(() => {})
    api.avvisi().then((l) => setAvviso(l.find((a) => a.auto.id === idAuto) ?? null)).catch(() => {})
  }, [utente, idAuto])

  async function cambiaPreferito() {
    try {
      if (preferito) {
        await api.rimuoviPreferito(preferito.id)
        setPreferito(null)
        toast('Tolta dai preferiti', 'info')
      } else {
        setPreferito(await api.aggiungiPreferito(idAuto))
        setCuore(true)
        setTimeout(() => setCuore(false), 900)
        toast('Aggiunta ai preferiti')
      }
    } catch (e) {
      toast((e as Error).message, 'errore')
    }
  }

  async function creaAvviso(soglia: number) {
    try {
      setAvviso(await api.creaAvviso(idAuto, soglia))
      toast(`Avviso attivo: ti scriviamo sotto ${euro(soglia)}`)
    } catch (e) {
      toast((e as Error).message, 'errore')
    }
  }

  async function eliminaAvviso() {
    if (!avviso) return
    try {
      await api.eliminaAvviso(avviso.id)
      setAvviso(null)
      toast('Avviso eliminato', 'info')
    } catch (e) {
      toast((e as Error).message, 'errore')
    }
  }

  if (errore) {
    return (
      <div className="px-5 pt-40">
        {errore.stato === 404 ? (
          <Vuoto
            icona={<CarFront className="size-7" />}
            titolo="Auto non in vetrina"
            testo="Questa auto non esiste o non e' ancora pubblicata."
            azione={
              <Link to="/catalogo">
                <Pulsante tabIndex={-1}>Torna al catalogo</Pulsante>
              </Link>
            }
          />
        ) : (
          <div className="mx-auto max-w-md">
            <Errore testo={errore.message} />
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="relative">
      {/* scena 3D a tutta larghezza */}
      <section className="relative h-[62vh] min-h-[420px] md:h-[78vh]">
        <Suspense fallback={<Scheletro className="h-full rounded-none" />}>
          <Showroom colore={vernice.colore} compatto />
        </Suspense>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />
        <Link
          to="/catalogo"
          className="vetro absolute left-5 top-24 flex items-center gap-2 rounded-full px-4 py-2 text-sm text-fog hover:text-paper"
        >
          <ArrowLeft className="size-4" /> Catalogo
        </Link>
        <div className="absolute bottom-6 right-5 flex flex-col items-end gap-2">
          <span className="vetro flex items-center gap-2 rounded-full px-3 py-1.5 font-mono text-[10px] uppercase tracking-widest text-fog">
            <Palette className="size-3" /> {vernice.nome}
          </span>
          <div className="vetro flex gap-1.5 rounded-full p-2">
            {VERNICI.map((v) => (
              <button
                key={v.nome}
                onClick={() => setVernice(v)}
                aria-label={`Prova vernice ${v.nome}`}
                className={`size-5 rounded-full transition-transform hover:scale-125 ${v.nome === vernice.nome ? 'ring-2 ring-paper ring-offset-2 ring-offset-ink' : ''}`}
                style={{ background: v.colore }}
              />
            ))}
          </div>
        </div>
      </section>

      <div className="relative mx-auto -mt-16 grid max-w-6xl gap-8 px-5 lg:grid-cols-[1.4fr_1fr]">
        {/* scheda */}
        <div>
          {auto ? (
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}>
              <p className="font-mono text-sm uppercase tracking-[0.35em] text-ember">{auto.marca}</p>
              <h1 className="mt-2 font-display text-5xl font-black leading-none md:text-7xl">{auto.modello}</h1>
              <div className="mt-6 flex flex-wrap gap-3">
                <span className="vetro flex items-center gap-2 rounded-full px-4 py-2 text-sm">
                  <CalendarDays className="size-4 text-ember" /> {auto.anno}
                </span>
                <span className="vetro flex items-center gap-2 rounded-full px-4 py-2 text-sm">
                  <Palette className="size-4 text-ember" /> {verniceDi(auto.id).nome}
                </span>
              </div>
              {/* testo semplice: React fa l'escape, niente HTML interpretato */}
              <p className="mt-8 whitespace-pre-line text-lg leading-relaxed text-fog">
                {auto.descrizione ?? 'Nessuna descrizione: questa auto preferisce farsi guardare.'}
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              <Scheletro className="h-6 w-32" />
              <Scheletro className="h-16 w-3/4" />
              <Scheletro className="h-28" />
            </div>
          )}
        </div>

        {/* pannello prezzo e azioni */}
        <motion.aside
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="vetro bordo-luce h-fit space-y-6 rounded-3xl p-6 lg:sticky lg:top-24"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-fog">Prezzo</p>
              <p className="font-display text-4xl font-black tabular-nums">
                {auto ? (
                  <>
                    € <CountUp to={Math.round(auto.prezzo)} duration={1.2} separator="." />
                  </>
                ) : (
                  '—'
                )}
              </p>
            </div>
            {utente && auto && (
              <motion.button
                whileTap={{ scale: 0.8 }}
                onClick={cambiaPreferito}
                aria-pressed={!!preferito}
                aria-label={preferito ? 'Togli dai preferiti' : 'Aggiungi ai preferiti'}
                className={`relative grid size-12 place-items-center rounded-full border transition ${preferito ? 'border-danger bg-danger/15 text-danger' : 'border-line text-fog hover:text-paper'}`}
              >
                <Heart className={`size-5 ${preferito ? 'fill-current' : ''}`} />
                <AnimatePresence>
                  {cuore &&
                    Array.from({ length: 8 }, (_, i) => (
                      <motion.span
                        key={i}
                        className="absolute size-1.5 rounded-full bg-danger"
                        initial={{ x: 0, y: 0, opacity: 1 }}
                        animate={{
                          x: Math.cos((i / 8) * Math.PI * 2) * 34,
                          y: Math.sin((i / 8) * Math.PI * 2) * 34,
                          opacity: 0,
                        }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.6 }}
                      />
                    ))}
                </AnimatePresence>
              </motion.button>
            )}
          </div>

          {!utente && (
            <div className="space-y-3 rounded-2xl border border-dashed border-line p-5 text-sm text-fog">
              <p>Accedi per salvare questa auto e ricevere una mail quando il prezzo scende.</p>
              <Link to={`/accedi?da=/auto/${idAuto}`}>
                <Pulsante className="w-full" tabIndex={-1} icona={<LogIn className="size-4" />}>
                  Accedi
                </Pulsante>
              </Link>
            </div>
          )}

          {utente && auto && (
            <div className="border-t border-line pt-6">
              <AnimatePresence mode="wait">
                {avviso ? (
                  <motion.div key="attivo" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-4">
                    <div className="flex items-center gap-3">
                      <span className="relative grid size-10 place-items-center rounded-full bg-ember/15 text-ember">
                        <BellRing className="size-5" />
                        {!avviso.inviato && <span className="absolute inset-0 animate-ping rounded-full bg-ember/20" />}
                      </span>
                      <div>
                        <p className="font-semibold">{avviso.inviato ? 'Mail gia\' inviata' : 'Avviso attivo'}</p>
                        <p className="text-sm text-fog">Soglia {euro(avviso.soglia)}</p>
                      </div>
                    </div>
                    <Pulsante variante="pericolo" className="w-full" onClick={eliminaAvviso} icona={<Trash2 className="size-4" />}>
                      Elimina avviso
                    </Pulsante>
                  </motion.div>
                ) : (
                  <motion.div key="nuovo" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <SogliaForm prezzo={auto.prezzo} invia={creaAvviso} />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.aside>
      </div>
    </div>
  )
}
