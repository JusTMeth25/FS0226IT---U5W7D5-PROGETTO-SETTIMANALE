import { AnimatePresence, motion } from 'motion/react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router'
import { Eye, EyeOff, KeyRound, UserPlus } from 'lucide-react'
import Sagoma from '@/components/Sagoma'
import SplitText from '@/components/bits/SplitText'
import { Campo, Errore, Pulsante } from '@/components/ui'
import { ApiError } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useToast } from '@/lib/toast'

type Modo = 'accedi' | 'registrati'

/** Solo percorsi interni: "?da=https://altro.sito" non porta fuori dal salone. */
function destinazioneSicura(da: string | null) {
  return da && da.startsWith('/') && !da.startsWith('//') ? da : '/catalogo'
}

export default function Accedi() {
  const { utente, accedi, registrati } = useAuth()
  const [parametri, setParametri] = useSearchParams()
  const naviga = useNavigate()
  const toast = useToast()
  const modo: Modo = parametri.get('modo') === 'registrati' ? 'registrati' : 'accedi'
  const destinazione = destinazioneSicura(parametri.get('da'))

  const [email, setEmail] = useState('')
  const [nome, setNome] = useState('')
  const [password, setPassword] = useState('')
  const [vedi, setVedi] = useState(false)
  const [carica, setCarica] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)
  const [campi, setCampi] = useState<Record<string, string>>({})

  if (utente) return <Navigate to={destinazione} replace />

  function cambiaModo(m: Modo) {
    const p = new URLSearchParams(parametri)
    if (m === 'registrati') p.set('modo', 'registrati')
    else p.delete('modo')
    setParametri(p, { replace: true })
    setErrore(null)
    setCampi({})
  }

  async function invia(e: FormEvent) {
    e.preventDefault()
    setErrore(null)
    setCampi({})
    setCarica(true)
    try {
      const u = modo === 'accedi' ? await accedi(email, password) : await registrati(email, nome, password)
      toast(modo === 'accedi' ? `Bentornato, ${u.nome}` : `Benvenuto in salone, ${u.nome}`)
      naviga(destinazione, { replace: true })
    } catch (err) {
      if (err instanceof ApiError) {
        setErrore(err.message)
        setCampi(err.campi)
      } else setErrore('Qualcosa e\' andato storto')
    } finally {
      setCarica(false)
    }
  }

  return (
    <div className="mx-auto grid min-h-dvh max-w-6xl items-center gap-12 px-5 pb-10 pt-32 lg:grid-cols-2">
      <div className="hidden lg:block">
        <SplitText
          key={modo}
          text={modo === 'accedi' ? 'Bentornato al volante.' : 'Prendi posto in salone.'}
          tag="h1"
          textAlign="left"
          className="font-display text-6xl font-black leading-[1.02]"
          delay={30}
          rootMargin="0px"
        />
        <p className="mt-6 max-w-sm text-fog">
          Preferiti, soglie di prezzo e una mail quando e' il momento giusto. Niente spam: una mail per avviso, mai due.
        </p>
        <motion.div
          className="relative mt-12"
          animate={{ x: [0, 12, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="absolute inset-x-10 bottom-0 h-16 rounded-full bg-ember/30 blur-3xl" />
          <Sagoma colore={modo === 'accedi' ? '#ff6a1a' : '#16c4dc'} tipo="coupe" corre className="relative w-full max-w-md" />
        </motion.div>
      </div>

      <motion.div
        layout
        className="vetro bordo-luce mx-auto w-full max-w-md rounded-3xl p-6 md:p-8"
        transition={{ type: 'spring', stiffness: 200, damping: 26 }}
      >
        <div className="relative mb-8 grid grid-cols-2 rounded-full bg-ink/70 p-1" role="tablist">
          {(['accedi', 'registrati'] as const).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={modo === m}
              onClick={() => cambiaModo(m)}
              className="relative rounded-full py-2.5 text-sm font-semibold"
            >
              {modo === m && <motion.span layoutId="modo-accesso" className="absolute inset-0 rounded-full bg-ember" />}
              <span className={`relative ${modo === m ? 'text-ink' : 'text-fog'}`}>{m === 'accedi' ? 'Accedi' : 'Registrati'}</span>
            </button>
          ))}
        </div>

        <form onSubmit={invia} className="space-y-4" noValidate>
          <AnimatePresence initial={false}>
            {modo === 'registrati' && (
              <motion.div
                key="nome"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <Campo
                  etichetta="Nome"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  maxLength={80}
                  autoComplete="name"
                  errore={campi.nome}
                  required
                />
              </motion.div>
            )}
          </AnimatePresence>
          <Campo
            etichetta="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            maxLength={254}
            autoComplete="email"
            errore={campi.email}
            required
          />
          <div className="relative">
            <Campo
              etichetta="Password"
              type={vedi ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              maxLength={72}
              autoComplete={modo === 'accedi' ? 'current-password' : 'new-password'}
              errore={campi.password}
              nota={modo === 'registrati' ? 'Almeno 8 caratteri.' : undefined}
              required
            />
            <button
              type="button"
              onClick={() => setVedi((v) => !v)}
              className="absolute right-3 top-[38px] rounded-lg p-1 text-fog hover:text-paper"
              aria-label={vedi ? 'Nascondi password' : 'Mostra password'}
            >
              {vedi ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>

          {errore && <Errore testo={errore} />}

          <Pulsante
            type="submit"
            carica={carica}
            className="w-full py-3"
            icona={modo === 'accedi' ? <KeyRound className="size-4" /> : <UserPlus className="size-4" />}
          >
            {modo === 'accedi' ? 'Accedi' : 'Crea account'}
          </Pulsante>

          {modo === 'registrati' && (
            <p className="text-center text-xs text-fog">
              Registrandoti dichiari di aver letto la{' '}
              <Link to="/privacy" className="text-ember underline-offset-2 hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          )}
        </form>
      </motion.div>
    </div>
  )
}
