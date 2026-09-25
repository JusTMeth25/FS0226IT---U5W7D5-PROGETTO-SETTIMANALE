import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import { BellOff, BellRing, CheckCheck, Trash2 } from 'lucide-react'
import { Errore, Intestazione, Pulsante, Scheletro, Vuoto } from '@/components/ui'
import { api, type Avviso } from '@/lib/api'
import { data, euro } from '@/lib/formato'
import { useToast } from '@/lib/toast'

/** Distanza tra prezzo attuale e soglia, come una barra del carburante. */
function Distanza({ prezzo, soglia, inviato }: { prezzo: number; soglia: number; inviato: boolean }) {
  const quota = inviato ? 100 : Math.max(4, Math.min(100, (soglia / prezzo) * 100))
  return (
    <div className="h-2 overflow-hidden rounded-full bg-line">
      <motion.div
        className={`h-full rounded-full ${inviato ? 'bg-volt' : 'bg-gradient-to-r from-ember to-ember-2'}`}
        initial={{ width: 0 }}
        animate={{ width: `${quota}%` }}
        transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  )
}

export default function Avvisi() {
  const toast = useToast()
  const [avvisi, setAvvisi] = useState<Avviso[] | null>(null)
  const [errore, setErrore] = useState<string | null>(null)

  useEffect(() => {
    api.avvisi().then(setAvvisi).catch((e) => setErrore(e.message))
  }, [])

  async function elimina(a: Avviso) {
    try {
      await api.eliminaAvviso(a.id)
      setAvvisi((l) => l?.filter((x) => x.id !== a.id) ?? null)
      toast('Avviso eliminato', 'info')
    } catch (e) {
      toast((e as Error).message, 'errore')
    }
  }

  const attivi = avvisi?.filter((a) => !a.inviato).length ?? 0

  return (
    <div className="mx-auto max-w-4xl px-5 pt-32">
      <Intestazione
        sopra="Radar prezzi"
        titolo="I tuoi avvisi"
        sotto={
          avvisi
            ? `${attivi} in attesa, ${avvisi.length - attivi} gia' scattati. Ogni avviso manda una sola mail.`
            : 'Le soglie che hai fissato.'
        }
      />

      {errore && <Errore testo={errore} />}
      {!errore && avvisi === null && (
        <div className="space-y-4">
          {[0, 1, 2].map((i) => (
            <Scheletro key={i} className="h-28" />
          ))}
        </div>
      )}

      {avvisi?.length === 0 && (
        <Vuoto
          icona={<BellOff className="size-7" />}
          titolo="Nessun avviso"
          testo="Apri un'auto o i tuoi preferiti e fissa una soglia di prezzo."
          azione={
            <Link to="/preferiti">
              <Pulsante tabIndex={-1}>Vai ai preferiti</Pulsante>
            </Link>
          }
        />
      )}

      <ul className="space-y-4">
        <AnimatePresence>
          {avvisi?.map((a, i) => (
            <motion.li
              key={a.id}
              layout
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0, transition: { delay: i * 0.06 } }}
              exit={{ opacity: 0, x: 60, height: 0, marginTop: 0 }}
              className="vetro rounded-3xl p-5"
            >
              <div className="flex flex-wrap items-center gap-4">
                <span
                  className={`relative grid size-12 shrink-0 place-items-center rounded-2xl ${a.inviato ? 'bg-volt/15 text-volt' : 'bg-ember/15 text-ember'}`}
                >
                  {a.inviato ? <CheckCheck className="size-5" /> : <BellRing className="size-5" />}
                  {!a.inviato && <span className="absolute inset-0 animate-ping rounded-2xl bg-ember/10" />}
                </span>
                <div className="min-w-0 flex-1">
                  <Link to={`/auto/${a.auto.id}`} className="block truncate font-display text-lg font-semibold hover:text-ember">
                    {a.auto.marca} {a.auto.modello}
                  </Link>
                  <p className="text-sm text-fog">
                    Prezzo {euro(a.auto.prezzo)} · soglia <span className="text-paper">{euro(a.soglia)}</span> · dal {data(a.creatoIl)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-widest ${a.inviato ? 'bg-volt/10 text-volt' : 'bg-ember/10 text-ember'}`}
                >
                  {a.inviato ? 'Mail inviata' : 'In attesa'}
                </span>
                <button
                  onClick={() => elimina(a)}
                  className="rounded-full p-2 text-fog transition hover:bg-danger/15 hover:text-danger"
                  aria-label={`Elimina avviso per ${a.auto.modello}`}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>
              <div className="mt-4">
                <Distanza prezzo={a.auto.prezzo} soglia={a.soglia} inviato={a.inviato} />
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  )
}
