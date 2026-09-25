/**
 * Fisica della drag race. Copia esatta di be/.../gara/Simulatore.java: stessi
 * numeri, stesso ordine delle operazioni. Il server usa la sua copia per
 * calcolare il tempo minimo possibile e rifiutare i tempi impossibili.
 */

import type { Auto } from '@/lib/api'

export const DT = 1 / 120
export const DISTANZA = 402
export const PAUSA_CAMBIO = 0.15
export const DURATA_NITRO = 2
export const SPINTA_NITRO = 1.3
export const LIMITATORE = 0.99

export type Motore = {
  vmax: number // m/s
  a0: number // m/s^2
  marce: number
}

export function motoreDi(auto: Auto): Motore | null {
  const p = auto.prestazioni
  if (!p?.zeroCento || !p?.velocitaMax) return null
  const vmax = p.velocitaMax / 3.6
  const u = Math.min(100 / 3.6 / vmax, 0.99)
  const a0 = (vmax / (2 * p.zeroCento)) * Math.log((1 + u) / (1 - u))
  return { vmax, a0, marce: auto.alimentazione?.toLowerCase() === 'elettrica' ? 1 : 6 }
}

export const velocitaMarcia = (m: Motore, marcia: number) => m.vmax * Math.pow(marcia / m.marce, 0.75)

export function efficienza(r: number, marcia: number) {
  if (r >= LIMITATORE) return 0
  if (marcia === 1 || r >= 0.5) return 1
  return 0.55 + 0.9 * r
}

export type StatoAuto = {
  partita: boolean
  v: number
  x: number
  marcia: number
  pausa: number
  nitro: number
  nitroUsato: boolean
  arrivo: number | null // secondi dal verde
}

export const statoIniziale = (): StatoAuto => ({
  partita: false,
  v: 0,
  x: 0,
  marcia: 1,
  pausa: 0,
  nitro: 0,
  nitroUsato: false,
  arrivo: null,
})

/** Regime in [0, 1] della marcia inserita: guida il contagiri. */
export const regime = (m: Motore, s: StatoAuto) => Math.min(1, s.v / velocitaMarcia(m, s.marcia))

export function cambia(m: Motore, s: StatoAuto) {
  if (s.marcia < m.marce && s.pausa <= 0 && s.partita) {
    s.marcia++
    s.pausa = PAUSA_CAMBIO
    return true
  }
  return false
}

export function nitro(s: StatoAuto) {
  if (!s.nitroUsato && s.partita) {
    s.nitro = DURATA_NITRO
    s.nitroUsato = true
    return true
  }
  return false
}

/** Un passo di fisica. t = tempo dal verde alla fine del passo. */
export function passo(m: Motore, s: StatoAuto, t: number) {
  if (!s.partita || s.arrivo !== null) return
  if (s.pausa > 0) {
    s.pausa -= DT
  } else {
    const r = s.v / velocitaMarcia(m, s.marcia)
    const a = m.a0 * Math.max(0, 1 - (s.v / m.vmax) * (s.v / m.vmax)) * efficienza(r, s.marcia) * (s.nitro > 0 ? SPINTA_NITRO : 1)
    s.v = Math.min(s.v + a * DT, m.vmax)
  }
  if (s.nitro > 0) s.nitro -= DT
  s.x += s.v * DT
  if (s.x >= DISTANZA) s.arrivo = t - (s.x - DISTANZA) / s.v
}

/** Tempo con guida perfetta (reazione zero): lo stesso calcolo del server. */
export function tempoPerfetto(m: Motore) {
  let migliore = Infinity
  for (let i = 0; i <= 100; i++) {
    const inizioNitro = i * 0.1
    const s = { ...statoIniziale(), partita: true }
    let t = 0
    while (t < 120 && s.arrivo === null) {
      if (s.marcia < m.marce && s.pausa <= 0 && s.v / velocitaMarcia(m, s.marcia) >= LIMITATORE) {
        s.marcia++
        s.pausa = PAUSA_CAMBIO
      }
      if (!s.nitroUsato && t >= inizioNitro) {
        s.nitro = DURATA_NITRO
        s.nitroUsato = true
      }
      t += DT
      passo(m, s, t)
    }
    migliore = Math.min(migliore, s.arrivo ?? 120)
  }
  return migliore
}

/** Pilota automatico degli avversari: ogni tanto sbaglia, come un umano. */
export type Pilota = { reazione: number; cambioA: number; nitroA: number }

export const pilotaCasuale = (bravura: number): Pilota => ({
  reazione: 0.12 + Math.random() * 0.25 * (1.2 - bravura),
  cambioA: 0.84 + Math.random() * 0.14 * bravura,
  nitroA: 0.5 + Math.random() * 3,
})

export function guidaPilota(m: Motore, s: StatoAuto, p: Pilota, t: number) {
  if (!s.partita && t >= p.reazione) s.partita = true
  if (!s.partita) return
  if (s.v / velocitaMarcia(m, s.marcia) >= p.cambioA) cambia(m, s)
  if (t >= p.nitroA) nitro(s)
}

export const formatoTempo = (s: number | null) => (s == null ? '—' : `${s.toFixed(3)} s`)
