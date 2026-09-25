import { useId } from 'react'

/** Silhouette laterale in SVG: leggera, una per card, niente WebGL. */

const CARROZZERIE = {
  coupe: {
    corpo: 'M18 88 L26 70 Q58 62 100 60 L136 40 Q176 30 216 38 L256 58 Q294 62 302 76 L302 88 Z',
    vetro: 'M142 44 L128 58 L246 58 L216 42 Q180 34 142 44 Z',
  },
  suv: {
    corpo: 'M18 90 L20 62 Q24 50 42 48 L86 46 L114 24 L232 24 L264 48 Q298 52 302 70 L302 90 Z',
    vetro: 'M120 30 L98 46 L252 46 L228 30 Z',
  },
  berlina: {
    corpo: 'M18 88 L24 68 Q50 60 92 58 L126 36 Q172 28 222 36 L260 58 Q296 62 302 76 L302 88 Z',
    vetro: 'M132 42 L112 56 L254 56 L222 40 Q176 32 132 42 Z',
  },
} as const

type Props = {
  colore: string
  tipo: keyof typeof CARROZZERIE
  className?: string
  /** Ruote che girano (hover della card). */
  corre?: boolean
}

function Ruota({ cx, corre }: { cx: number; corre: boolean }) {
  return (
    <g
      style={{
        transformOrigin: `${cx}px 88px`,
        animation: corre ? 'ruota 0.5s linear infinite' : undefined,
      }}
    >
      <circle cx={cx} cy={88} r={19} fill="#0b0b0e" />
      <circle cx={cx} cy={88} r={12} fill="#c9ccd4" />
      {[0, 72, 144, 216, 288].map((a) => (
        <rect key={a} x={cx - 1.5} y={77} width={3} height={11} fill="#6b7280" transform={`rotate(${a} ${cx} 88)`} />
      ))}
      <circle cx={cx} cy={88} r={3} fill="#ff6a1a" />
    </g>
  )
}

export default function Sagoma({ colore, tipo, className = '', corre = false }: Props) {
  const id = useId().replace(/:/g, '')
  const c = CARROZZERIE[tipo]
  return (
    <svg viewBox="0 0 320 120" className={className} role="img" aria-hidden="true">
      <defs>
        <linearGradient id={`v${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={colore} stopOpacity="1" />
          <stop offset="0.55" stopColor={colore} stopOpacity="0.85" />
          <stop offset="1" stopColor="#000" stopOpacity="0.7" />
        </linearGradient>
        <linearGradient id={`r${id}`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      <ellipse cx="160" cy="108" rx="140" ry="6" fill="#000" opacity="0.6" />
      <path d={c.corpo} fill={`url(#v${id})`} stroke="rgb(255 255 255 / 0.18)" strokeWidth="1" />
      <path d={c.vetro} fill="#0a0c12" opacity="0.92" />
      {/* riflesso sulla fiancata */}
      <path d="M40 72 L290 72" stroke={`url(#r${id})`} strokeWidth="2" />
      <rect x="296" y="66" width="7" height="4" rx="2" fill="#dff6ff" />
      <rect x="16" y="70" width="6" height="4" rx="2" fill="#ff2b2b" />
      <Ruota cx={78} corre={corre} />
      <Ruota cx={246} corre={corre} />
    </svg>
  )
}
