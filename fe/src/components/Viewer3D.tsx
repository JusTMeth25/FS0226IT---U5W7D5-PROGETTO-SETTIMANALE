import { AnimatePresence, motion } from 'motion/react'
import { useState } from 'react'
import { Box, ExternalLink, LoaderCircle, Play } from 'lucide-react'
import type { Auto } from '@/lib/api'

// Il viewer si carica solo dopo un clic: e' un servizio esterno (Sketchfab,
// Epic Games) e la Privacy Policy lo dice. La scelta vale finche' la pagina
// resta aperta, senza salvare niente nel browser.
let consensoSessione = false

const UID = /^[a-f0-9]{32}$/

/**
 * Modello 3D reale da Sketchfab. L'indirizzo dell'iframe si costruisce qui
 * dall'uid validato: dal server arriva solo l'identificativo, mai un URL.
 */
export default function Viewer3D({ auto, className = '' }: { auto: Auto; className?: string }) {
  const [attivo, setAttivo] = useState(consensoSessione)
  const [pronto, setPronto] = useState(false)
  const uid = auto.media?.modello3dUid

  if (!uid || !UID.test(uid)) return null

  const src =
    `https://sketchfab.com/models/${uid}/embed?autostart=1&preload=1&dnt=1&transparent=1` +
    '&ui_theme=dark&ui_infos=0&ui_watermark_link=0&ui_hint=2&ui_help=0&ui_settings=0&ui_vr=0&ui_ar=0'

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <AnimatePresence mode="wait">
        {!attivo ? (
          <motion.div
            key="consenso"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.05 }}
            className="absolute inset-0 grid place-items-center p-6"
          >
            <div className="vetro max-w-sm rounded-3xl p-6 text-center">
              <Box className="mx-auto size-10 text-ember" />
              <p className="mt-3 font-display text-lg font-semibold">Modello 3D reale</p>
              <p className="mt-2 text-sm text-fog">
                Il modello e' ospitato da Sketchfab. Caricandolo, il browser si collega ai loro server (vedi Privacy Policy).
              </p>
              <button
                onClick={() => {
                  consensoSessione = true
                  setAttivo(true)
                }}
                className="mt-5 inline-flex items-center gap-2 rounded-full bg-ember px-5 py-2.5 text-sm font-semibold text-ink shadow-[0_0_30px_-6px_var(--color-ember)] transition hover:bg-ember-2"
              >
                <Play className="size-4" /> Carica il 3D
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div key="viewer" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0">
            {!pronto && (
              <div className="absolute inset-0 grid place-items-center">
                <LoaderCircle className="size-8 animate-spin text-ember" />
              </div>
            )}
            <iframe
              title={`${auto.marca} ${auto.modello} in 3D`}
              src={src}
              onLoad={() => setPronto(true)}
              allow="autoplay; fullscreen; xr-spatial-tracking"
              referrerPolicy="no-referrer"
              sandbox="allow-scripts allow-same-origin allow-popups allow-popups-to-escape-sandbox"
              className="size-full border-0"
            />
          </motion.div>
        )}
      </AnimatePresence>
      {auto.media.modello3dAutore && (
        <p className="pointer-events-auto absolute right-28 top-4 z-10 font-mono text-[10px] text-fog/80">
          Modello 3D:{' '}
          {auto.media.modello3dFonte?.startsWith('https://sketchfab.com/') ? (
            <a href={auto.media.modello3dFonte} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-paper">
              {auto.media.modello3dAutore} su Sketchfab <ExternalLink className="size-2.5" />
            </a>
          ) : (
            auto.media.modello3dAutore
          )}
        </p>
      )}
    </div>
  )
}
