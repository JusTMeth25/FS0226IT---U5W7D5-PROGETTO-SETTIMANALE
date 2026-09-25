import { motion } from 'motion/react'
import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { Save, ShieldCheck, Trash2, TriangleAlert } from 'lucide-react'
import SpotlightCard from '@/components/bits/SpotlightCard'
import { Campo, Errore, Intestazione, Modale, Pulsante } from '@/components/ui'
import { api, ApiError } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/lib/toast'

const FRASE = 'ELIMINA'

export default function Profilo() {
  const { utente, aggiorna, esci } = useAuth()
  const naviga = useNavigate()
  const toast = useToast()
  const [nome, setNome] = useState(utente?.nome ?? '')
  const [carica, setCarica] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)
  const [conferma, setConferma] = useState(false)
  const [frase, setFrase] = useState('')
  const [elimina, setElimina] = useState(false)

  if (!utente) return null

  async function salva(e: FormEvent) {
    e.preventDefault()
    setErrore(null)
    setCarica(true)
    try {
      aggiorna(await api.aggiornaProfilo(nome))
      toast('Profilo aggiornato')
    } catch (err) {
      setErrore(err instanceof ApiError ? (err.campi.nome ?? err.message) : 'Errore')
    } finally {
      setCarica(false)
    }
  }

  async function eliminaAccount() {
    setElimina(true)
    try {
      await api.eliminaAccount()
      esci()
      toast('Account eliminato. Avvisi e preferiti sono stati cancellati.', 'info')
      naviga('/', { replace: true })
    } catch (err) {
      toast((err as Error).message, 'errore')
      setElimina(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl px-5 pt-32">
      <Intestazione sopra="Profilo" titolo={`Ciao, ${utente.nome}`} sotto="Qui gestisci i tuoi dati. L'email non si cambia: e' la tua chiave d'accesso." />

      <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <SpotlightCard className="h-full p-6" spotlightColor="rgba(34, 211, 238, 0.14)">
            <motion.div
              className="mx-auto grid size-28 place-items-center rounded-full bg-gradient-to-br from-ember via-ember-2 to-neon p-1"
              animate={{ rotate: 360 }}
              transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
            >
              <motion.span
                className="grid size-full place-items-center rounded-full bg-ink font-display text-4xl font-black"
                animate={{ rotate: -360 }}
                transition={{ duration: 12, repeat: Infinity, ease: 'linear' }}
              >
                {utente.nome.charAt(0).toUpperCase()}
              </motion.span>
            </motion.div>
            <dl className="mt-6 space-y-3 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-fog">Email</dt>
                <dd className="truncate">{utente.email}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-fog">Ruolo</dt>
                <dd className="flex items-center gap-1.5">
                  {utente.ruolo === 'ADMIN' && <ShieldCheck className="size-4 text-ember" />}
                  {utente.ruolo === 'ADMIN' ? 'Amministratore' : 'Cliente'}
                </dd>
              </div>
            </dl>
          </SpotlightCard>
        </motion.div>

        <div className="space-y-6">
          <motion.form
            onSubmit={salva}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="vetro space-y-4 rounded-3xl p-6"
          >
            <h2 className="font-display text-lg font-semibold">Dati personali</h2>
            <Campo etichetta="Nome" value={nome} onChange={(e) => setNome(e.target.value)} maxLength={80} required />
            {errore && <Errore testo={errore} />}
            <Pulsante type="submit" carica={carica} disabled={!nome.trim() || nome === utente.nome} icona={<Save className="size-4" />}>
              Salva
            </Pulsante>
          </motion.form>

          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="rounded-3xl border border-danger/30 bg-danger/5 p-6"
          >
            <h2 className="flex items-center gap-2 font-display text-lg font-semibold text-danger">
              <TriangleAlert className="size-5" /> Zona rossa
            </h2>
            <p className="mt-2 text-sm text-fog">
              Eliminando l'account cancelli profilo, preferiti e avvisi. Da quel momento non ti arriva piu' nessuna mail.
            </p>
            <Pulsante variante="pericolo" className="mt-4" onClick={() => setConferma(true)} icona={<Trash2 className="size-4" />}>
              Elimina il mio account
            </Pulsante>
          </motion.section>
        </div>
      </div>

      <Modale aperta={conferma} chiudi={() => setConferma(false)} titolo="Eliminare l'account?">
        <p className="text-sm text-fog">
          L'operazione non si puo' annullare. Scrivi <strong className="font-mono text-danger">{FRASE}</strong> per confermare.
        </p>
        <Campo etichetta="Conferma" value={frase} onChange={(e) => setFrase(e.target.value)} className="mt-4" autoComplete="off" />
        <div className="mt-6 flex justify-end gap-3">
          <Pulsante variante="fantasma" onClick={() => setConferma(false)}>
            Annulla
          </Pulsante>
          <Pulsante variante="pericolo" disabled={frase !== FRASE} carica={elimina} onClick={eliminaAccount} icona={<Trash2 className="size-4" />}>
            Elimina per sempre
          </Pulsante>
        </div>
      </Modale>
    </div>
  )
}
