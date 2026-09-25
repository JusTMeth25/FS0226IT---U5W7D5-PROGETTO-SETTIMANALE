import { useState } from 'react'
import Sagoma from '@/components/Sagoma'
import type { Auto } from '@/lib/api'
import { sagomaDi, verniceDi } from '@/lib/formato'

/**
 * Foto reale dell'auto (Wikimedia Commons). Se manca o non si carica, torna
 * la sagoma disegnata. referrerPolicy="no-referrer": Wikimedia non sa da
 * quale pagina del salone arriva la richiesta.
 */
export function FotoAuto({ auto, className = '', grande = false }: { auto: Auto; className?: string; grande?: boolean }) {
  const [rotta, setRotta] = useState(false)
  const url = auto.media?.fotoUrl
  if (!url || rotta || !url.startsWith('https://')) {
    const v = verniceDi(auto.id)
    return (
      <div className={`grid place-items-center bg-ink-2 ${className}`} style={{ background: `radial-gradient(circle at 50% 80%, ${v.colore}44, transparent 70%)` }}>
        <Sagoma colore={v.colore} tipo={sagomaDi(auto.id)} className="w-4/5" />
      </div>
    )
  }
  return (
    <img
      src={grande ? url : url.replace('/1280px-', '/500px-')}
      alt={`${auto.marca} ${auto.modello}`}
      loading="lazy"
      decoding="async"
      referrerPolicy="no-referrer"
      onError={() => setRotta(true)}
      className={`object-cover ${className}`}
    />
  )
}

/** Crediti richiesti dalle licenze Creative Commons: autore, licenza, link alla fonte. */
export function CreditoFoto({ auto, className = '' }: { auto: Auto; className?: string }) {
  const m = auto.media
  if (!m?.fotoUrl) return null
  return (
    <p className={`truncate font-mono text-[10px] text-fog/80 ${className}`}>
      Foto:{' '}
      {m.fotoFonte?.startsWith('https://') ? (
        <a href={m.fotoFonte} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:text-paper hover:underline">
          {m.fotoAutore ?? 'Wikimedia Commons'}
        </a>
      ) : (
        (m.fotoAutore ?? 'Wikimedia Commons')
      )}
      {m.fotoLicenza && ` · ${m.fotoLicenza}`}
    </p>
  )
}
