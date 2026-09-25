const EURO = new Intl.NumberFormat('it-IT', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })
const DATA = new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: 'short', year: 'numeric' })

export const euro = (n: number | null | undefined) => (n == null ? '—' : EURO.format(n))
export const data = (iso: string) => DATA.format(new Date(iso))

/** Vernici del salone: ogni auto riceve la sua, sempre la stessa, dall'id. */
export const VERNICI = [
  { nome: 'Rosso Corsa', colore: '#d91a1a' },
  { nome: 'Arancio Brace', colore: '#ff6a1a' },
  { nome: 'Giallo Modena', colore: '#f5c518' },
  { nome: 'Verde Volt', colore: '#7ed321' },
  { nome: 'Blu Notte', colore: '#1d3bff' },
  { nome: 'Ciano Neon', colore: '#16c4dc' },
  { nome: 'Viola Ametista', colore: '#7b2ff7' },
  { nome: 'Bianco Ghiaccio', colore: '#e8ecf2' },
  { nome: 'Grigio Titanio', colore: '#5b6270' },
  { nome: 'Nero Ossidiana', colore: '#15151b' },
] as const

export const verniceDi = (id: number) => VERNICI[Math.abs(id * 7 + 3) % VERNICI.length]

/** Carrozzeria "tipo" in base all'id: cambia la silhouette disegnata nelle card. */
export const sagomaDi = (id: number) => (['coupe', 'suv', 'berlina'] as const)[Math.abs(id) % 3]
