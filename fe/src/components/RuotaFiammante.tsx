import { motion } from 'motion/react'
import { createPortal } from 'react-dom'

/**
 * Transizione dopo l'accesso: una ruota in fiamme che gira come un burnout,
 * cresce fino a coprire lo schermo e "consegna" la pagina del catalogo.
 * Dura ~1,3 s; chi la usa naviga quando termina (onFine).
 */
export default function RuotaFiammante({ onFine }: { onFine: () => void }) {
  const lingue = Array.from({ length: 14 }, (_, i) => (i / 14) * 360)
  const razze = [0, 72, 144, 216, 288]

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[90] grid place-items-center overflow-hidden"
      initial={{ backgroundColor: 'rgba(7,7,11,0)' }}
      animate={{ backgroundColor: 'rgba(7,7,11,1)' }}
      transition={{ duration: 0.35 }}
      aria-hidden="true"
    >
      {/* bagliore caldo dietro la ruota */}
      <motion.div
        className="absolute size-[70vmin] rounded-full"
        style={{ background: 'radial-gradient(circle, rgb(255 106 26 / 0.55), rgb(255 43 43 / 0.15) 45%, transparent 70%)' }}
        initial={{ scale: 0.2, opacity: 0 }}
        animate={{ scale: [0.2, 1.2, 1], opacity: 1 }}
        transition={{ duration: 0.6 }}
      />

      <motion.div
        className="relative size-[46vmin]"
        initial={{ scale: 0.15, rotate: -90 }}
        animate={{ scale: [0.15, 1, 1, 16] }}
        transition={{ duration: 1.3, times: [0, 0.35, 0.6, 1], ease: ['backOut', 'linear', 'easeIn'] }}
        onAnimationComplete={onFine}
      >
        {/* lingue di fuoco che girano intorno al copertone */}
        <motion.div
          className="absolute inset-0"
          animate={{ rotate: -360 }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
        >
          {lingue.map((a, i) => (
            <motion.span
              key={a}
              className="absolute left-1/2 top-1/2 block h-[34%] w-[13%] origin-bottom rounded-[50%_50%_40%_40%/70%_70%_30%_30%]"
              style={{
                rotate: a,
                translateX: '-50%',
                translateY: '-118%',
                background: 'linear-gradient(to top, #ff2b2b, #ff6a1a 45%, #ffb347 75%, #fff4c2)',
                filter: 'blur(1.5px) drop-shadow(0 0 12px #ff6a1a)',
              }}
              animate={{ scaleY: [0.7, 1.15, 0.8, 1.05], opacity: [0.85, 1, 0.9, 1] }}
              transition={{ duration: 0.18 + (i % 4) * 0.05, repeat: Infinity, repeatType: 'mirror' }}
            />
          ))}
        </motion.div>

        {/* la ruota: gira a tutta velocita' (burnout) */}
        <motion.svg
          viewBox="-100 -100 200 200"
          className="absolute inset-[12%] drop-shadow-[0_0_30px_rgb(255_106_26/0.9)]"
          animate={{ rotate: 360 }}
          transition={{ duration: 0.22, repeat: Infinity, ease: 'linear' }}
        >
          <circle r="96" fill="#0b0b0e" stroke="#ff6a1a" strokeWidth="3" />
          <circle r="84" fill="none" stroke="#1d1d24" strokeWidth="10" strokeDasharray="6 8" />
          <circle r="62" fill="#c9ccd4" />
          <circle r="56" fill="#8a8f9a" />
          {razze.map((a) => (
            <rect key={a} x="-7" y="-58" width="14" height="52" rx="4" fill="#e6e8ee" transform={`rotate(${a})`} />
          ))}
          <circle r="14" fill="#ff6a1a" />
          <circle r="5" fill="#07070b" />
          {/* striscia di movimento: fa percepire la rotazione */}
          <path d="M -80 -40 A 90 90 0 0 1 -20 -88" stroke="#fff" strokeOpacity="0.35" strokeWidth="6" fill="none" strokeLinecap="round" />
        </motion.svg>
      </motion.div>

      {/* scintille */}
      {Array.from({ length: 16 }, (_, i) => {
        const ang = (i / 16) * Math.PI * 2
        return (
          <motion.span
            key={i}
            className="absolute size-1.5 rounded-full bg-ember-2"
            style={{ boxShadow: '0 0 10px #ffb347' }}
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{ x: Math.cos(ang) * 420, y: Math.sin(ang) * 420, opacity: [0, 1, 0] }}
            transition={{ duration: 0.8, delay: 0.25 + (i % 4) * 0.05, ease: 'easeOut' }}
          />
        )
      })}
    </motion.div>,
    document.body,
  )
}
