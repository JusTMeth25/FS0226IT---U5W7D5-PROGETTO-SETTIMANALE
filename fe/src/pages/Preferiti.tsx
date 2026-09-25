import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { BellRing, CheckCheck, HeartCrack, HeartOff, Trash2 } from 'lucide-react'
import { FotoAuto } from '@/components/FotoAuto'
import SogliaForm from '@/components/SogliaForm'
import SpotlightCard from '@/components/bits/SpotlightCard'
import { Errore, Intestazione, Pulsante, Scheletro, Vuoto } from '@/components/ui'
import { api, type Avviso, type Preferito } from '@/lib/api'
import { euro } from '@/lib/formato'
import { useToast } from '@/lib/toast'

/** Ogni preferito ha il suo avviso: si fissa la soglia direttamente da qui. */
export default function Preferiti() {
  const toast = useToast()
  const [preferiti, setPreferiti] = useState<Preferito[] | null>(null)
  const [avvisi, setAvvisi] = useState<Avviso[]>([])
  const [errore, setErrore] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([api.preferiti(), api.avvisi()])
      .then(([p, a]) => {
        setPreferiti(p)
        setAvvisi(a)
      })
      .catch((e) => setErrore(e.message))
  }, [])

  const avvisoDi = (autoId: number) => avvisi.find((a) => a.auto.id === autoId)

  async function rimuovi(p: Preferito) {
    try {
      await api.rimuoviPreferito(p.id)
      setPreferiti((l) => l?.filter((x) => x.id !== p.id) ?? null)
      toast(`${p.auto.modello} tolta dai preferiti`, 'info')
    } catch (e) {
      toast((e as Error).message, 'errore')
    }
  }

  async function creaAvviso(autoId: number, soglia: number) {
    try {
      const a = await api.creaAvviso(autoId, soglia)
      setAvvisi((l) => [...l, a])
      toast(`Avviso attivo sotto ${euro(soglia)}`)
    } catch (e) {
      toast((e as Error).message, 'errore')
    }
  }

  async function eliminaAvviso(a: Avviso) {
    try {
      await api.eliminaAvviso(a.id)
      setAvvisi((l) => l.filter((x) => x.id !== a.id))
      toast('Avviso eliminato', 'info')
    } catch (e) {
      toast((e as Error).message, 'errore')
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-5 pt-32">
      <Intestazione
        sopra="Il tuo garage"
        titolo="Preferiti"
        sotto="Le auto che hai messo da parte. Per ognuna puoi fissare una soglia: sotto quella cifra ti scriviamo."
      />

      {errore && <Errore testo={errore} />}

      {!errore && preferiti === null && (
        <div className="grid gap-5 md:grid-cols-2">
          {[0, 1].map((i) => (
            <Scheletro key={i} className="h-72" />
          ))}
        </div>
      )}

      {preferiti?.length === 0 && (
        <Vuoto
          icona={<HeartCrack className="size-7" />}
          titolo="Garage vuoto"
          testo="Non hai ancora preferiti. Apri un'auto dal catalogo e premi il cuore."
          azione={
            <Link to="/catalogo">
              <Pulsante tabIndex={-1}>Vai al catalogo</Pulsante>
            </Link>
          }
        />
      )}

      <motion.div layout className="grid gap-5 md:grid-cols-2">
        <AnimatePresence>
          {preferiti?.map((p, i) => {
            const avviso = avvisoDi(p.auto.id)
            return (
              <motion.div
                key={p.id}
                layout
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0, transition: { delay: i * 0.06 } }}
                exit={{ opacity: 0, scale: 0.9, x: -60, transition: { duration: 0.3 } }}
              >
                <SpotlightCard className="h-full p-6" spotlightColor="rgba(255, 106, 26, 0.14)">
                  <div className="flex gap-5">
                    <Link to={`/auto/${p.auto.id}`} className="group w-36 shrink-0">
                      <div className="h-24 overflow-hidden rounded-2xl">
                        <FotoAuto auto={p.auto} className="size-full transition-transform duration-500 group-hover:scale-110" />
                      </div>
                    </Link>
                    <div className="min-w-0 flex-1">
                      <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-ember">{p.auto.marca}</p>
                      <Link to={`/auto/${p.auto.id}`} className="block truncate font-display text-xl font-semibold hover:text-ember">
                        {p.auto.modello}
                      </Link>
                      <p className="mt-1 font-display text-lg tabular-nums">{euro(p.auto.prezzo)}</p>
                    </div>
                    <button
                      onClick={() => rimuovi(p)}
                      className="h-fit rounded-full p-2 text-fog transition hover:bg-danger/15 hover:text-danger"
                      aria-label={`Togli ${p.auto.modello} dai preferiti`}
                    >
                      <HeartOff className="size-4" />
                    </button>
                  </div>

                  <div className="mt-5 border-t border-line pt-5">
                    {avviso ? (
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span className={`grid size-9 place-items-center rounded-full ${avviso.inviato ? 'bg-volt/15 text-volt' : 'bg-ember/15 text-ember'}`}>
                            {avviso.inviato ? <CheckCheck className="size-4" /> : <BellRing className="size-4" />}
                          </span>
                          <div className="text-sm">
                            <p className="font-semibold">{avviso.inviato ? 'Mail inviata' : 'In attesa'}</p>
                            <p className="text-fog">sotto {euro(avviso.soglia)}</p>
                          </div>
                        </div>
                        <Pulsante variante="fantasma" onClick={() => eliminaAvviso(avviso)} icona={<Trash2 className="size-4" />}>
                          Elimina
                        </Pulsante>
                      </div>
                    ) : (
                      <SogliaForm prezzo={p.auto.prezzo} invia={(s) => creaAvviso(p.auto.id, s)} compatto />
                    )}
                  </div>
                </SpotlightCard>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
