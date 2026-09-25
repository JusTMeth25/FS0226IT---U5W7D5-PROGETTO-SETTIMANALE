import { AnimatePresence, motion, useScroll, useSpring } from 'motion/react'
import { ReactLenis } from 'lenis/react'
import { useEffect, useState, type ReactNode } from 'react'
import { Link, NavLink, useLocation, useNavigate, useOutlet } from 'react-router'
import { Bell, CarFront, Heart, LogOut, Menu, ShieldCheck, UserRound, X } from 'lucide-react'
import Aurora from '@/components/bits/Aurora'
import ClickSpark from '@/components/bits/ClickSpark'
import Magnet from '@/components/bits/Magnet'
import { Pulsante } from '@/components/ui'
import { useAuth } from '@/lib/auth'

function Logo() {
  return (
    <Link to="/" className="group flex items-center gap-2.5" aria-label="Vetrina, home">
      <span className="relative grid size-9 place-items-center overflow-hidden rounded-xl bg-ember text-ink">
        <span className="font-display text-lg font-black">V</span>
        <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/70 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
      </span>
      <span className="font-display text-lg font-bold tracking-tight">
        VETRINA<span className="text-ember">.</span>
      </span>
    </Link>
  )
}

type Voce = { a: string; testo: string; icona: ReactNode }

function Navbar() {
  const { utente, esci } = useAuth()
  const naviga = useNavigate()
  const { pathname } = useLocation()
  const [aperto, setAperto] = useState(false)
  const [scorso, setScorso] = useState(false)

  useEffect(() => {
    setAperto(false)
  }, [pathname])
  useEffect(() => {
    const f = () => setScorso(window.scrollY > 20)
    f()
    window.addEventListener('scroll', f, { passive: true })
    return () => window.removeEventListener('scroll', f)
  }, [])

  const voci: Voce[] = [{ a: '/catalogo', testo: 'Catalogo', icona: <CarFront className="size-4" /> }]
  if (utente) {
    voci.push({ a: '/preferiti', testo: 'Preferiti', icona: <Heart className="size-4" /> })
    voci.push({ a: '/avvisi', testo: 'Avvisi', icona: <Bell className="size-4" /> })
  }
  if (utente?.ruolo === 'ADMIN') voci.push({ a: '/admin', testo: 'Officina', icona: <ShieldCheck className="size-4" /> })

  const uscita = () => {
    esci()
    naviga('/')
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-3 pt-3">
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 120, damping: 18 }}
        className={`mx-auto flex max-w-6xl items-center justify-between gap-4 rounded-2xl px-4 py-2.5 transition-all duration-500 ${scorso ? 'vetro shadow-2xl' : 'border border-transparent'}`}
      >
        <Logo />

        <ul className="hidden items-center gap-1 md:flex">
          {voci.map((v) => (
            <li key={v.a}>
              <NavLink to={v.a} end className="relative block rounded-full px-4 py-2 text-sm font-medium">
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <motion.span
                        layoutId="voce-attiva"
                        className="absolute inset-0 rounded-full bg-white/10"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className={`relative flex items-center gap-2 ${isActive ? 'text-paper' : 'text-fog hover:text-paper'}`}>
                      {v.icona}
                      {v.testo}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2 md:flex">
          {utente ? (
            <>
              <Link
                to="/profilo"
                className="flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-sm hover:border-ember"
              >
                <span className="grid size-6 place-items-center rounded-full bg-gradient-to-br from-ember to-neon font-display text-[11px] font-bold text-ink">
                  {utente.nome.charAt(0).toUpperCase()}
                </span>
                <span className="max-w-32 truncate">{utente.nome}</span>
              </Link>
              <button onClick={uscita} className="rounded-full p-2 text-fog hover:bg-white/10 hover:text-paper" aria-label="Esci">
                <LogOut className="size-4" />
              </button>
            </>
          ) : (
            <Magnet padding={40} magnetStrength={4}>
              <Link to="/accedi">
                <Pulsante tabIndex={-1}>Entra in salone</Pulsante>
              </Link>
            </Magnet>
          )}
        </div>

        <button
          className="rounded-xl p-2 text-paper md:hidden"
          onClick={() => setAperto((a) => !a)}
          aria-label={aperto ? 'Chiudi menu' : 'Apri menu'}
          aria-expanded={aperto}
        >
          {aperto ? <X /> : <Menu />}
        </button>
      </motion.nav>

      <AnimatePresence>
        {aperto && (
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10 }}
            className="vetro mx-auto mt-2 max-w-6xl rounded-2xl p-3 md:hidden"
          >
            {[...voci, ...(utente ? [{ a: '/profilo', testo: 'Profilo', icona: <UserRound className="size-4" /> }] : [])].map(
              (v, i) => (
                <motion.div key={v.a} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <NavLink
                    to={v.a}
                    end
                    className={({ isActive }) =>
                      `flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${isActive ? 'bg-white/10 text-paper' : 'text-fog'}`
                    }
                  >
                    {v.icona}
                    {v.testo}
                  </NavLink>
                </motion.div>
              ),
            )}
            <div className="mt-2 border-t border-line pt-3">
              {utente ? (
                <Pulsante variante="secondario" className="w-full" onClick={uscita} icona={<LogOut className="size-4" />}>
                  Esci
                </Pulsante>
              ) : (
                <Link to="/accedi">
                  <Pulsante className="w-full" tabIndex={-1}>
                    Entra in salone
                  </Pulsante>
                </Link>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}

function Footer() {
  const marche = ['FIAT', 'ALFA ROMEO', 'LANCIA', 'MASERATI', 'FERRARI', 'LAMBORGHINI', 'PAGANI', 'ABARTH']
  return (
    <footer className="relative mt-32 overflow-hidden border-t border-line">
      <div className="overflow-hidden border-b border-line py-5" aria-hidden="true">
        <div className="ticker flex w-max gap-12 whitespace-nowrap font-display text-5xl font-black text-transparent md:text-7xl" style={{ WebkitTextStroke: '1px rgb(255 255 255 / 0.15)' }}>
          {[...marche, ...marche].map((m, i) => (
            <span key={i} className="flex items-center gap-12">
              {m}
              <span className="text-ember" style={{ WebkitTextStroke: 0 }}>
                ✦
              </span>
            </span>
          ))}
        </div>
      </div>
      <div className="mx-auto grid max-w-6xl gap-10 px-5 py-12 md:grid-cols-3">
        <div className="space-y-3">
          <Logo />
          <p className="max-w-xs text-sm text-fog">
            Mini salone di automobili. Sfoglia, salva i preferiti, fissa una soglia: ti scriviamo noi quando il prezzo scende.
          </p>
        </div>
        <nav aria-label="Link del sito" className="grid grid-cols-2 gap-2 text-sm">
          <Link to="/catalogo" className="text-fog hover:text-ember">Catalogo</Link>
          <Link to="/accedi" className="text-fog hover:text-ember">Accedi</Link>
          <Link to="/privacy" className="text-fog hover:text-ember">Privacy Policy</Link>
          <Link to="/cookie" className="text-fog hover:text-ember">Cookie Policy</Link>
        </nav>
        <p className="text-sm text-fog md:text-right">
          Progetto didattico Epicode · {new Date().getFullYear()}
          <br />
          Nessuna auto e' stata maltrattata durante lo sviluppo.
        </p>
      </div>
    </footer>
  )
}

/** Barra di avanzamento dello scroll in cima alla pagina. */
function BarraScroll() {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 })
  return (
    <motion.div
      className="fixed inset-x-0 top-0 z-[55] h-0.5 origin-left bg-gradient-to-r from-ember via-ember-2 to-neon"
      style={{ scaleX }}
    />
  )
}

export default function Layout() {
  const { pathname } = useLocation()
  // useOutlet invece di {pagina}: la pagina che esce resta quella vecchia
  // durante l'animazione, invece di diventare subito la nuova.
  const pagina = useOutlet()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  return (
    <ReactLenis root options={{ lerp: 0.1, smoothWheel: true }}>
      <ClickSpark sparkColor="#ff6a1a" sparkSize={9} sparkRadius={22} sparkCount={10} duration={450}>
        <div className="grana relative min-h-dvh">
          {/* Aurora in cima a ogni pagina, sfumata verso il basso */}
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[70vh] opacity-40"
            style={{ maskImage: 'linear-gradient(to bottom, black, transparent)' }}
            aria-hidden="true"
          >
            <Aurora colorStops={['#ff6a1a', '#7b2ff7', '#22d3ee']} amplitude={1.1} blend={0.6} speed={0.6} />
          </div>
          <BarraScroll />
          <Navbar />
          <AnimatePresence mode="wait">
            <motion.main
              key={pathname}
              initial={{ opacity: 0, y: 24, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -16, filter: 'blur(6px)' }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="relative"
            >
              {pagina}
            </motion.main>
          </AnimatePresence>
          <Footer />
        </div>
      </ClickSpark>
    </ReactLenis>
  )
}
