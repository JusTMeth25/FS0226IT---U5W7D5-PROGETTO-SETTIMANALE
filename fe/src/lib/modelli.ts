import type { Auto } from '@/lib/api'

/**
 * Modelli 3D reali scaricati da Sketchfab (licenze Creative Commons), compressi
 * e serviti dal nostro sito in /modelli. L'indice contiene file, crediti e le
 * correzioni per orientarli: rotazione e pezzi da ignorare nel calcolo delle misure.
 */
export type Modello = {
  file: string
  nome: string
  autore: string
  licenza: string
  fonte: string
  rotazione: number
  ignoraIngombro: string[]
}

let indice: Promise<Record<string, Modello>> | null = null

export function caricaIndice() {
  indice ??= fetch('/modelli/indice.json')
    .then((r) => (r.ok ? r.json() : {}))
    .catch(() => ({}))
  return indice
}

export const chiaveAuto = (a: Pick<Auto, 'marca' | 'modello'>) => `${a.marca}|${a.modello}`

/** Lunghezza a cui scalare il modello: le citycar sono piu' corte. */
export const lunghezzaDi = (a: Pick<Auto, 'carrozzeria'>) =>
  a.carrozzeria === 'Citycar' ? 4.0 : a.carrozzeria === 'SUV' ? 4.6 : 4.7
