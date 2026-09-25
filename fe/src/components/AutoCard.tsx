import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'
import type { MouseEvent } from 'react'
import { Link } from 'react-router'
import { ArrowUpRight, Box, Fuel } from 'lucide-react'
import SpotlightCard from '@/components/bits/SpotlightCard'
import { FotoAuto } from '@/components/FotoAuto'
import { euro } from '@/lib/formato'
import type { Auto } from '@/lib/api'

/**
 * Card del catalogo con la foto vera: si inclina seguendo il mouse e la foto
 * scorre in parallasse. La descrizione e' testo React normale, mai HTML.
 */
export default function AutoCard({ auto, indice = 0 }: { auto: Auto; indice?: number }) {
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const rx = useSpring(useTransform(my, [-0.5, 0.5], [7, -7]), { stiffness: 200, damping: 18 })
  const ry = useSpring(useTransform(mx, [-0.5, 0.5], [-9, 9]), { stiffness: 200, damping: 18 })
  const fx = useSpring(useTransform(mx, [-0.5, 0.5], [10, -10]), { stiffness: 150, damping: 20 })
  const fy = useSpring(useTransform(my, [-0.5, 0.5], [8, -8]), { stiffness: 150, damping: 20 })

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
        onMouseLeave={() => {
          mx.set(0)
          my.set(0)
        }}
      >
        <Link to={`/auto/${auto.id}`} className="group block rounded-3xl focus-visible:outline-2 focus-visible:outline-ember">
          <SpotlightCard className="h-full" spotlightColor="rgba(255, 106, 26, 0.18)">
            <div className="relative h-52 overflow-hidden">
              <motion.div className="absolute -inset-4" style={{ x: fx, y: fy }}>
                <FotoAuto auto={auto} className="size-full transition-transform duration-700 ease-out group-hover:scale-110" />
              </motion.div>
              <div className="absolute inset-0 bg-gradient-to-t from-ink-2 via-ink-2/10 to-transparent" />
              <div className="absolute left-4 top-4 flex gap-1.5">
                <span className="rounded-full border border-white/10 bg-black/50 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-paper backdrop-blur">
                  {auto.anno}
                </span>
                {auto.media?.modello3dUid && (
                  <span className="flex items-center gap-1 rounded-full bg-ember/90 px-2.5 py-1 font-mono text-[10px] uppercase tracking-widest text-ink">
                    <Box className="size-3" /> 3D
                  </span>
                )}
              </div>
              <ArrowUpRight className="absolute right-4 top-4 size-5 text-paper/80 transition-all duration-300 group-hover:rotate-45 group-hover:text-ember" />
            </div>

            <div className="space-y-3 p-5" style={{ transform: 'translateZ(30px)' }}>
              <div>
                <p className="font-mono text-xs uppercase tracking-[0.25em] text-ember">{auto.marca}</p>
                <h3 className="mt-1 truncate font-display text-xl font-semibold">{auto.modello}</h3>
              </div>
              {auto.descrizione && <p className="line-clamp-2 text-sm text-fog">{auto.descrizione}</p>}
              <div className="flex items-end justify-between gap-3 border-t border-line pt-3">
                <span className="flex items-center gap-1.5 text-xs text-fog">
                  {auto.alimentazione && <Fuel className="size-3.5" />}
                  {[auto.carrozzeria, auto.alimentazione].filter(Boolean).join(' · ')}
                </span>
                <span className="text-right">
                  <span className="block font-mono text-[9px] uppercase tracking-widest text-fog">da</span>
                  <span className="font-display text-lg font-bold tabular-nums">{euro(auto.prezzo)}</span>
                </span>
              </div>
            </div>
          </SpotlightCard>
        </Link>
      </motion.div>
    </motion.div>
  )
}
