import { motion, useScroll, useTransform } from 'motion/react'
import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router'
import { ArrowRight, BellRing, Heart, MousePointer2, Search } from 'lucide-react'
import AutoCard from '@/components/AutoCard'
import CountUp from '@/components/bits/CountUp'
import GradientText from '@/components/bits/GradientText'
import Magnet from '@/components/bits/Magnet'
import ShinyText from '@/components/bits/ShinyText'
import SplitText from '@/components/bits/SplitText'
import SpotlightCard from '@/components/bits/SpotlightCard'
import { Pulsante, Scheletro } from '@/components/ui'
import { api, type Auto } from '@/lib/api'
import { VERNICI } from '@/lib/formato'

// Three.js pesa: si scarica solo quando serve.
const Showroom = lazy(() => import('@/components/three/Showroom'))

function Hero() {
  const [vernice, setVernice] = useState<(typeof VERNICI)[number]>(VERNICI[1])
  const rif = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: rif, offset: ['start start', 'end start'] })
  const y = useTransform(scrollYProgress, [0, 1], [0, 160])
  const opacita = useTransform(scrollYProgress, [0, 0.8], [1, 0])

  return (
    <section ref={rif} className="relative h-[100dvh] min-h-[640px] overflow-hidden">
      {/* su schermi larghi la scena occupa la parte destra: il titolo resta leggibile */}
      <div className="absolute inset-0 lg:left-[36%] lg:[mask-image:linear-gradient(to_right,transparent,black_22%)]">
        <Suspense fallback={<div className="grid h-full place-items-center font-mono text-xs text-fog">accensione motore…</div>}>
          <Showroom colore={vernice.colore} />
        </Suspense>
      </div>

      {/* sfumatura per leggere il testo sopra la scena */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-ink via-ink/40 to-transparent md:via-ink/20" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-ink to-transparent" />

      <motion.div style={{ y, opacity: opacita }} className="pointer-events-none relative mx-auto flex h-full max-w-6xl flex-col justify-center px-5">
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-5 flex items-center gap-3 font-mono text-xs uppercase tracking-[0.4em] text-ember"
        >
          <span className="h-px w-10 bg-ember" /> Salone · Collezione {new Date().getFullYear()}
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
            text="Scegli l'auto, fissa la tua soglia. Quando il prezzo la scavalca, ti arriva una mail. Una sola."
            color="#8a8aa0"
            shineColor="#f4f4f8"
            speed={3}
          />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
          className="pointer-events-auto mt-9 flex flex-wrap items-center gap-4"
        >
          <Magnet padding={60} magnetStrength={3}>
            <Link to="/catalogo">
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
      </motion.div>

      {/* selettore vernice: cambia il colore dell'auto in 3D */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-6 left-1/2 w-[min(94vw,560px)] -translate-x-1/2"
      >
        <div className="vetro flex items-center gap-3 rounded-full px-4 py-2.5">
          <span className="hidden shrink-0 font-mono text-[10px] uppercase tracking-widest text-fog sm:block">Vernice</span>
          <div className="flex flex-1 justify-between gap-1.5">
            {VERNICI.map((v) => (
              <button
                key={v.nome}
                onClick={() => setVernice(v)}
                title={v.nome}
                aria-label={`Vernice ${v.nome}`}
                aria-pressed={vernice.nome === v.nome}
                className="relative size-7 rounded-full transition-transform hover:scale-125"
                style={{ background: v.colore, boxShadow: `0 0 14px ${v.colore}88` }}
              >
                {vernice.nome === v.nome && (
                  <motion.span layoutId="vernice-scelta" className="absolute -inset-1.5 rounded-full border-2 border-paper" />
                )}
              </button>
            ))}
          </div>
        </div>
        <p className="mt-2 flex items-center justify-center gap-1.5 text-center font-mono text-[10px] uppercase tracking-widest text-fog">
          <MousePointer2 className="size-3" /> {vernice.nome} · trascina per girare l'auto
        </p>
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

  useEffect(() => {
    api
      .catalogo({ sort: 'recenti', size: 6 })
      .then((p) => {
        setAuto(p.contenuto)
        setTotale(p.totale)
      })
      .catch(() => setAuto([]))
  }, [])

  return (
    <>
      <Hero />
      <div className="space-y-28 pt-12">
        <div className="px-5">
          <Numeri totale={totale} />
        </div>

        <section className="mx-auto max-w-6xl px-5">
          <div className="mb-8 flex items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.35em] text-ember">Appena arrivate</p>
              <h2 className="mt-2 font-display text-3xl font-bold md:text-5xl">In vetrina ora</h2>
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
