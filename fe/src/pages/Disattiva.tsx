import { motion } from 'motion/react'
import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { BellOff, CircleX, LoaderCircle } from 'lucide-react'
import { Pulsante } from '@/components/ui'
import { api } from '@/lib/api'

type Stato = 'attesa' | 'fatto' | 'errore'

/**
 * Pagina del link "disattiva avviso" della mail. Il token e' casuale e
 * monouso: la seconda apertura dello stesso link risponde "gia' usato".
 */
export default function Disattiva() {
  const [parametri] = useSearchParams()
  const tokenMail = parametri.get('token') ?? ''
  const [stato, setStato] = useState<Stato>('attesa')
  const [messaggio, setMessaggio] = useState('')
  const inviato = useRef(false)

  useEffect(() => {
    // StrictMode monta due volte gli effetti: il token si consuma una volta sola.
    if (inviato.current) return
    inviato.current = true
    if (!tokenMail || tokenMail.length > 64) {
      setStato('errore')
      setMessaggio('Link incompleto.')
      return
    }
    api
      .disattivaAvviso(tokenMail)
      .then(() => setStato('fatto'))
      .catch((e) => {
        setStato('errore')
        setMessaggio(e.message)
      })
  }, [tokenMail])

  return (
    <div className="grid min-h-dvh place-items-center px-5 pt-24">
      <motion.div
        initial={{ opacity: 0, scale: 0.9, rotateX: 15 }}
        animate={{ opacity: 1, scale: 1, rotateX: 0 }}
        className="vetro bordo-luce w-full max-w-md rounded-3xl p-8 text-center"
      >
        <motion.div
          key={stato}
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 14 }}
          className={`mx-auto grid size-20 place-items-center rounded-3xl ${stato === 'fatto' ? 'bg-volt/15 text-volt' : stato === 'errore' ? 'bg-danger/15 text-danger' : 'bg-white/5 text-fog'}`}
        >
          {stato === 'attesa' && <LoaderCircle className="size-9 animate-spin" />}
          {stato === 'fatto' && <BellOff className="size-9" />}
          {stato === 'errore' && <CircleX className="size-9" />}
        </motion.div>
        <h1 className="mt-6 font-display text-2xl font-bold">
          {stato === 'attesa' && 'Disattivo l\'avviso…'}
          {stato === 'fatto' && 'Avviso disattivato'}
          {stato === 'errore' && 'Link non valido'}
        </h1>
        <p className="mt-3 text-fog">
          {stato === 'fatto' && 'Non riceverai altre mail per questa auto. Il link non e\' piu\' utilizzabile.'}
          {stato === 'errore' && `${messaggio.replace(/\.$/, '')}. Forse l'avviso e' gia' stato disattivato.`}
        </p>
        {stato !== 'attesa' && (
          <Link to="/catalogo" className="mt-8 inline-block">
            <Pulsante tabIndex={-1}>Torna al catalogo</Pulsante>
          </Link>
        )}
      </motion.div>
    </div>
  )
}
