import { motion } from 'motion/react'
import { Link } from 'react-router'
import Sagoma from '@/components/Sagoma'
import { Pulsante } from '@/components/ui'

export default function NonTrovata() {
  return (
    <div className="grid min-h-dvh place-items-center px-5 pt-24 text-center">
      <div>
        <p className="font-display text-[28vw] font-black leading-none text-transparent md:text-[14rem]" style={{ WebkitTextStroke: '2px rgb(255 106 26 / 0.6)' }}>
          404
        </p>
        <motion.div
          className="mx-auto -mt-10 w-72"
          initial={{ x: -400, opacity: 0 }}
          animate={{ x: 0, opacity: 1, rotate: [0, -2, 2, 0] }}
          transition={{ type: 'spring', stiffness: 60, damping: 10 }}
        >
          <Sagoma colore="#ff6a1a" tipo="coupe" corre className="w-full" />
        </motion.div>
        <h1 className="mt-6 font-display text-2xl font-bold">Strada senza uscita</h1>
        <p className="mt-2 text-fog">Questa pagina non e' in vetrina.</p>
        <Link to="/" className="mt-8 inline-block">
          <Pulsante tabIndex={-1}>Inversione a U</Pulsante>
        </Link>
      </div>
    </div>
  )
}
