import { motion, useScroll, useTransform } from 'motion/react'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, BellRing, Heart, MousePointer2, Search } from 'lucide-react'
import AutoCard from '@/components/AutoCard'
import { FotoAuto } from '@/components/FotoAuto'
import CountUp from '@/components/bits/CountUp'
import GradientText from '@/components/bits/GradientText'
import Magnet from '@/components/bits/Magnet'
import ShinyText from '@/components/bits/ShinyText'
import SplitText from '@/components/bits/SplitText'
import SpotlightCard from '@/components/bits/SpotlightCard'
import { Pulsante, Scheletro } from '@/components/ui'
import { api, type Auto } from '@/lib/api'
import { euro } from '@/lib/formato'

// Three.js pesa: si scarica solo quando serve.
const Tunnel = lazy(() => import('@/components/three/Tunnel'))

/** Vetrina girevole con le foto vere delle auto più esclusive del salone. */
function Vetrina({ auto }: { auto: Auto[] }) {
  const [attiva, setAttiva] = useState(0)
  const [pausa, setPausa] = useState(false)

  useEffect(() => {
    if (pausa || auto.length < 2) return
    const t = setInterval(() => setAttiva((i) => (i + 1) % auto.length), 4200)
    return () => clearInterval(t)
  }, [pausa, auto.length])

  if (!auto.length) return null
  return (
    <div className="relative h-[380px] w-full" style={{ perspective: 1400 }} onMouseEnter={() => setPausa(true)} onMouseLeave={() => setPausa(false)}>
      {auto.map((a, i) => {
        const pos = (i - attiva + auto.length) % auto.length
        const visibile = pos < 3
        return (
          <motion.div
            key={a.id}
            className="absolute inset-x-0 top-0"
            initial={false}
            animate={{
              x: pos * 38,
              y: pos * -26,
              z: pos * -120,
              rotateY: -14,
              rotateX: 4,
              opacity: visibile ? 1 - pos * 0.28 : 0,
              scale: 1 - pos * 0.04,
            }}
            transition={{ type: 'spring', stiffness: 90, damping: 18 }}
            style={{ zIndex: 10 - pos, pointerEvents: pos === 0 ? 'auto' : 'none' }}
          >
            <Link to={`/auto/${a.id}`} className="group block overflow-hidden rounded-3xl border border-white/10 bg-ink-2 shadow-[0_40px_80px_-20px_rgb(0_0_0/0.8)]">
              <div className="relative h-64 overflow-hidden">
                <FotoAuto auto={a} grande className="size-full transition-transform duration-700 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
                <span className="absolute right-4 top-4 rounded-full bg-black/60 px-3 py-1 font-mono text-[10px] uppercase tracking-widest backdrop-blur">
                  {a.carrozzeria}
                </span>
              </div>
              <div className="flex items-end justify-between gap-4 p-5">
                <div className="min-w-0">
                  <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-ember">{a.marca}</p>
                  <p className="truncate font-display text-2xl font-bold">{a.modello}</p>
                </div>
                <p className="shrink-0 font-display text-xl font-bold tabular-nums">{euro(a.prezzo)}</p>
              </div>
            </Link>
          </motion.div>
        )
      })}
      <div className="absolute -bottom-2 left-0 flex gap-1.5">
        {auto.map((a, i) => (
          <button
            key={a.id}
            onClick={() => setAttiva(i)}
            aria-label={`Mostra ${a.marca} ${a.modello}`}
            className={`h-1.5 rounded-full transition-all ${i === attiva ? 'w-8 bg-ember' : 'w-3 bg-white/20 hover:bg-white/40'}`}
          />
        ))}
      </div>
    </div>
  )
}

function Hero({ vetrina }: { vetrina: Auto[] }) {
  const [turbo, setTurbo] = useState(false)
  const rif = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: rif, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [0, 160])
  const opacita = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  return (
    <section ref={rif} className="relative h-[100dvh] min-h-[680px] overflow-hidden">
      <div className="absolute inset-0">
        <Suspense fallback={null}>
          <Tunnel turbo={turbo} />
        </Suspense>
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink/90 via-ink/40 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />

      <motion.div
        style={{ y, opacity: opacita }}
        className="relative mx-auto grid h-full max-w-6xl items-center gap-10 px-5 pt-20 lg:grid-cols-[1.1fr_1fr]"
      >
        <div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mb-5 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.4em] text-ember"
          >
            <span className="h-px w-10 bg-ember" /> Listini {new Date().getFullYear()} · auto reali
          </motion.p>
          <SplitText
            text="Il prezzo giusto"
            tag="h1"
            textAlign="left"
            className="font-display text-5xl font-black leading-[0.95] md:text-7xl"
            delay={40}
            rootMargin="0px"
          />
          <SplitText
            text="arriva da solo."
            tag="h1"
            textAlign="left"
            className="font-display text-5xl font-black leading-[0.95] text-ember md:text-7xl"
            delay={40}
            rootMargin="0px"
          />
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1 }} className="mt-6 max-w-md text-lg">
            <ShinyText
              text="Dalla Pandina alla Revuelto: prezzi di listino veri, foto vere, modelli 3D. Fissa la soglia e ti scriviamo noi."
              color="#8a8aa0"
              shineColor="#f4f4f8"
              speed={3}
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
            className="mt-9 flex flex-wrap items-center gap-4"
          >
            <Magnet padding={60} magnetStrength={3}>
              <Link
                to="/catalogo"
                onMouseEnter={() => setTurbo(true)}
                onMouseLeave={() => setTurbo(false)}
                onFocus={() => setTurbo(true)}
                onBlur={() => setTurbo(false)}
              >
                <Pulsante tabIndex={-1} className="px-7 py-3.5 text-base" icona={<Search className="size-4" />}>
                  Sfoglia il catalogo
                </Pulsante>
              </Link>
            </Magnet>
            <Link to="/accedi?modo=registrati" className="group flex items-center gap-2 text-sm text-fog hover:text-paper">
              Crea un account
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            className="mt-10 hidden items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-fog md:flex"
          >
            <MousePointer2 className="size-3" /> muovi il mouse · passa sul pulsante per il turbo
          </motion.p>
        </div>

        <motion.div
          className="hidden lg:block"
          initial={{ opacity: 0, x: 80, rotateY: -30 }}
          animate={{ opacity: 1, x: 0, rotateY: 0 }}
          transition={{ delay: 0.8, duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
        >
          <Vetrina auto={vetrina} />
        </motion.div>
      </motion.div>
    </section>
  )
}

function Numeri({ totale }: { totale: number | null }) {
  const voci = [
    { n: totale ?? 0, testo: 'auto in vetrina', suffisso: '' },
    { n: 1, testo: 'mail per avviso, mai due', suffisso: '' },
    { n: 256, testo: 'bit di token nel link della mail', suffisso: '' },
    { n: 0, testo: 'password nei log', suffisso: '' },
  ]
  return (
    <section className="mx-auto grid max-w-6xl grid-cols-2 gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-4">
      {voci.map((v) => (
        <div key={v.testo} className="bg-ink-2 p-6 md:p-8">
          <p className="font-display text-4xl font-black text-paper md:text-5xl">
            <CountUp to={v.n} duration={1.6} separator="." />
            {v.suffisso}
          </p>
          <p className="mt-2 text-sm text-fog">{v.testo}</p>
        </div>
      ))}
    </section>
  )
}

function ComeFunziona() {
  const passi = [
    { icona: <Search />, titolo: 'Cerca', testo: 'Filtra per marca o modello, ordina per prezzo, anno o novita\'.' },
    { icona: <Heart />, titolo: 'Salva', testo: 'Metti il cuore alle auto che ti interessano: restano nei tuoi preferiti.' },
    { icona: <BellRing />, titolo: 'Aspetta', testo: 'Fissa una soglia. Quando il prezzo ci scende sotto, parte una mail.' },
  ]
  return (
    <section className="mx-auto max-w-6xl px-5">
      <div className="mb-10 text-center">
        <GradientText colors={['#ff6a1a', '#ffb347', '#22d3ee', '#7b2ff7']} animationSpeed={6} className="font-display text-3xl font-bold md:text-5xl">
          Tre mosse, zero ansia
        </GradientText>
      </div>
      <div className="grid gap-5 md:grid-cols-3">
        {passi.map((p, i) => (
          <motion.div
            key={p.titolo}
            initial={{ opacity: 0, y: 40, rotateX: 20 }}
            whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ delay: i * 0.12, duration: 0.7 }}
          >
            <SpotlightCard className="h-full p-8" spotlightColor="rgba(34, 211, 238, 0.15)">
              <span className="font-mono text-6xl font-bold text-white/5">0{i + 1}</span>
              <div className="-mt-6 mb-5 grid size-12 place-items-center rounded-2xl bg-ember/15 text-ember">{p.icona}</div>
              <h3 className="font-display text-2xl font-semibold">{p.titolo}</h3>
              <p className="mt-2 text-fog">{p.testo}</p>
            </SpotlightCard>
          </motion.div>
        ))}
      </div>
    </section>
  )
}

export default function Home() {
  const [auto, setAuto] = useState<Auto[] | null>(null)
  const [totale, setTotale] = useState<number | null>(null)
  const [vetrina, setVetrina] = useState<Auto[]>([])

  useEffect(() => {
    api
      .catalogo({ sort: 'prezzo', dir: 'asc', size: 6 })
      .then((p) => {
        setAuto(p.contenuto)
        setTotale(p.totale)
      })
      .catch(() => setAuto([]))
    // le sei piu' care, solo se hanno una foto vera
    api
      .catalogo({ sort: 'prezzo', dir: 'desc', size: 12 })
      .then((p) => setVetrina(p.contenuto.filter((a) => a.media?.fotoUrl).slice(0, 6)))
      .catch(() => setVetrina([]))
  }, [])

  return (
    <>
      <Hero vetrina={vetrina} />
      <div className="space-y-28 pt-12">
        <div className="px-5">
          <Numeri totale={totale} />
        </div>

        <section className="mx-auto max-w-6xl px-5">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.35em] text-ember">Per tutte le tasche</p>
              <h2 className="mt-2 font-display text-3xl font-bold md:text-5xl">Si parte da qui</h2>
            </div>
            <Link to="/catalogo" className="group hidden items-center gap-2 text-sm text-fog hover:text-ember sm:flex">
              Tutto il catalogo <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {auto === null
              ? Array.from({ length: 3 }, (_, i) => <Scheletro key={i} className="h-80" />)
              : auto.map((a, i) => <AutoCard key={a.id} auto={a} indice={i} />)}
          </div>
          {auto?.length === 0 && (
            <p className="rounded-3xl border border-dashed border-line p-10 text-center text-fog">
              Il salone e' ancora vuoto: l'amministratore sta lucidando le prime auto.
            </p>
          )}
        </section>

        <ComeFunziona />
      </div>
    </>
  )
}
