/**
 * Contagiri a lancetta con luci di cambiata: si accendono verde-giallo-rosso
 * e lampeggiano blu nella finestra perfetta. Al limitatore diventano rosse fisse.
 */
export default function Contagiri({ regime, marcia, kmh, elettrica }: { regime: number; marcia: number; kmh: number; elettrica: boolean }) {
  const angolo = -210 + regime * 240
  const rad = (a: number) => (a * Math.PI) / 180
  const tacche = Array.from({ length: 9 }, (_, i) => -210 + i * 30)
  const luci = 10
  const perfetto = regime >= 0.9 && regime < 0.99

  return (
    <div className="flex flex-col items-center">
      {/* barra delle luci di cambiata */}
      {!elettrica && (
        <div className="mb-2 flex gap-1">
          {Array.from({ length: luci }, (_, i) => {
            const soglia = 0.6 + (i / luci) * 0.38
            const accesa = regime >= soglia
            const colore = perfetto ? '#3b82f6' : i < 4 ? '#a3ff12' : i < 7 ? '#ffb347' : '#ff3b5c'
            return (
              <span
                key={i}
                className={`size-3 rounded-full transition-all duration-75 ${perfetto && accesa ? 'animate-pulse' : ''}`}
                style={{
                  background: accesa ? colore : '#23232f',
                  boxShadow: accesa ? `0 0 12px ${colore}` : 'none',
                }}
              />
            )
          })}
        </div>
      )}
      <svg viewBox="-110 -110 220 170" className="w-64 drop-shadow-[0_0_24px_rgb(0_0_0/0.8)]">
        <circle r="100" fill="rgb(7 7 11 / 0.75)" stroke="rgb(255 255 255 / 0.1)" />
        {/* zona rossa */}
        <path
          d={`M ${Math.cos(rad(-210 + 0.85 * 240)) * 90} ${Math.sin(rad(-210 + 0.85 * 240)) * 90} A 90 90 0 0 1 ${Math.cos(rad(30)) * 90} ${Math.sin(rad(30)) * 90}`}
          stroke="#ff3b5c"
          strokeWidth="8"
          fill="none"
          opacity={elettrica ? 0 : 0.8}
        />
        {tacche.map((a, i) => (
          <g key={a}>
            <line x1={Math.cos(rad(a)) * 78} y1={Math.sin(rad(a)) * 78} x2={Math.cos(rad(a)) * 92} y2={Math.sin(rad(a)) * 92} stroke="#f4f4f8" strokeWidth="2" />
            <text x={Math.cos(rad(a)) * 64} y={Math.sin(rad(a)) * 64 + 4} fill="#8a8aa0" fontSize="11" textAnchor="middle" fontFamily="JetBrains Mono Variable">
              {i}
            </text>
          </g>
        ))}
        <line x1="0" y1="0" x2={Math.cos(rad(angolo)) * 84} y2={Math.sin(rad(angolo)) * 84} stroke="#ff6a1a" strokeWidth="4" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 6px #ff6a1a)' }} />
        <circle r="8" fill="#ff6a1a" />
        <text y="38" fill="#f4f4f8" fontSize="30" fontWeight="900" textAnchor="middle" fontFamily="Unbounded Variable">
          {elettrica ? 'D' : marcia}
        </text>
        <text y="-30" fill="#f4f4f8" fontSize="20" fontWeight="700" textAnchor="middle" fontFamily="Unbounded Variable">
          {Math.round(kmh)}
        </text>
        <text y="-14" fill="#8a8aa0" fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono Variable">
          KM/H
        </text>
      </svg>
    </div>
  )
}
