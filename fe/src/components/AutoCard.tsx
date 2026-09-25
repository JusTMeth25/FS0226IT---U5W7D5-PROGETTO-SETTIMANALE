import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import { useState, type MouseEvent } from 'react'
import { Link } from 'react-router'
import { ArrowUpRight } from 'lucide-react'
import SpotlightCard from '@/components/bits/SpotlightCard'
import Sagoma from '@/components/Sagoma'
import { euro, sagomaDi, verniceDi } from '@/lib/formato'
import type { Auto } from '@/lib/api'

/**
 * Card del catalogo: si inclina seguendo il mouse, l'auto "parte" e le ruote
 * girano. La descrizione e' testo React normale: mai HTML interpretato.
 */
export default function AutoCard({ auto, indice = 0 }: { auto: Auto; indice?: number }) {
  const vernice = verniceDi(auto.id)
  const [sopra, setSopra] = useState(false)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 200, damping: 18 })
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-10, 10]), { stiffness: 200, damping: 18 })

  const muovi = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    mx.set((e.clientX - r.left) / r.width - 0.5)
    my.set((e.clientY - r.top) / r.height - 0.5)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6, delay: (indice % 6) * 0.07, ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: 1000 }}
    >
      <motion.div
        style={{ rotateX: rx, rotateY: ry, transformStyle: 'preserve-3d' }}
        onMouseMove={muovi}
        onMouseEnter={() => setSopra(true)}
        onMouseLeave={() => {
          setSopra(false)
          mx.set(0)
          my.set(0)
        }}
      >
        <Link to={`/auto/${auto.id}`} className="group block rounded-3xl focus-visible:outline-2 focus-visible:outline-ember">
          <SpotlightCard className="h-full" spotlightColor="rgba(255, 106, 26, 0.18)">
            <div className="relative h-44 overflow-hidden">
              <div
                className="absolute inset-0 opacity-60 transition-opacity duration-500 group-hover:opacity-100"
                style={{ background: `radial-gradient(ellipse at 50% 90%, ${vernice.colore}55, transparent 65%)` }}
              />
              <div className="griglia absolute inset-0 opacity-50" />
              <motion.div
                className="absolute inset-x-4 bottom-2"
                animate={{ x: sopra ? 14 : 0 }}
                transition={{ type: 'spring', stiffness: 120, damping: 12 }}
                style={{ translateZ: 40 }}
              >
                <Sagoma colore={vernice.colore} tipo={sagomaDi(auto.id)} corre={sopra} className="w-full drop-shadow-2xl" />
              </motion.div>
              <span className="absolute left-4 top-4 rounded-full border border-white/10 bg-black/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-fog backdrop-blur">
                {auto.anno}
              </span>
              <ArrowUpRight className="absolute right-4 top-4 size-5 text-fog transition-all duration-300 group-hover:rotate-45 group-hover:text-ember" />
            </div>

            <div className="space-y-3 p-5" style={{ transform: 'translateZ(30px)' }}>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.25em] text-ember">{auto.marca}</p>
                <h3 className="mt-1 truncate font-display text-xl font-semibold">{auto.modello}</h3>
              </div>
              {auto.descrizione && <p className="line-clamp-2 text-sm text-fog">{auto.descrizione}</p>}
              <div className="flex items-end justify-between border-t border-line pt-3">
                <span className="text-xs text-fog">{vernice.nome}</span>
                <span className="font-display text-lg font-bold tabular-nums">{euro(auto.prezzo)}</span>
              </div>
            </div>
          </SpotlightCard>
        </Link>
      </motion.div>
    </motion.div>
  )
}
