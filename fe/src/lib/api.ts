// Ogni fetch dell'applicazione passa da qui.
// In sviluppo BASE e' vuota e il proxy di Vite inoltra /api alla 8080.
// In produzione arriva da VITE_API_URL, iniettata durante la build.
const BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '')

// Il token sta nel localStorage: e' scritto nella Cookie Policy.
const CHIAVE_TOKEN = 'vetrina.token'
export const EVENTO_USCITA = 'vetrina:uscita'

// ---------- Tipi (specchio dei DTO del backend) ----------

export type Ruolo = 'USER' | 'ADMIN'

export type Utente = { id: number; email: string; nome: string; ruolo: Ruolo }

export type Accesso = { token: string; utente: Utente }

export type Media = {
  fotoUrl: string | null
  fotoAutore: string | null
  fotoLicenza: string | null
  fotoFonte: string | null
  modello3dUid: string | null
  modello3dAutore: string | null
  modello3dFonte: string | null
}

export type Prestazioni = {
  versione: string | null
  cv: number | null
  zeroCento: number | null
  velocitaMax: number | null
  pesoKg: number | null
}

export type Auto = {
  id: number
  marca: string
  modello: string
  anno: number
  descrizione: string | null
  prezzo: number
  carrozzeria: string | null
  alimentazione: string | null
  media: Media
  prestazioni: Prestazioni
}

export type AutoAdmin = Auto & {
  prezzoAcquisto: number | null
  pubblicata: boolean
  creataIl: string
  aggiornataIl: string
}

export type Pagina<T> = {
  contenuto: T[]
  pagina: number
  dimensione: number
  totale: number
  pagineTotali: number
}

export type RigaClassifica = { posizione: number; nome: string; autoId: number; auto: string; millis: number; data: string }
export type EsitoGara = { millis: number; record: number; nuovoRecord: boolean; posizione: number }

export type Preferito = { id: number; auto: Auto; creatoIl: string }

export type Avviso = { id: number; auto: Auto; soglia: number; inviato: boolean; creatoIl: string }

export type DatiAuto = {
  marca: string
  modello: string
  anno: number
  descrizione: string | null
  prezzoAcquisto: number | null
  pubblicata: boolean
  carrozzeria: string | null
  alimentazione: string | null
  media: Media
  prestazioni: Prestazioni
}

export type Ordinamento = 'recenti' | 'prezzo' | 'anno' | 'marca' | 'modello'

// Stessi valori ammessi dal backend (enum Carrozzeria).
export type Carrozzeria = 'citycar' | 'berlina' | 'suv' | 'coupe' | 'cabrio' | 'station_wagon'

export type Ricerca = {
  q?: string
  carrozzeria?: Carrozzeria
  sort?: Ordinamento
  dir?: 'asc' | 'desc'
  page?: number
  size?: number
}

// ---------- Errori ----------

export class ApiError extends Error {
  readonly stato: number
  readonly campi: Record<string, string>

  constructor(stato: number, messaggio: string, campi: Record<string, string> = {}) {
    super(messaggio)
    this.stato = stato
    this.campi = campi
  }
}

// ---------- Token ----------

export const token = {
  leggi(): string | null {
    try {
      return localStorage.getItem(CHIAVE_TOKEN)
    } catch {
      return null
    }
  },
  salva(valore: string) {
    try {
      localStorage.setItem(CHIAVE_TOKEN, valore)
    } catch {
      /* navigazione privata: la sessione dura quanto la pagina */
    }
  },
  cancella() {
    try {
      localStorage.removeItem(CHIAVE_TOKEN)
    } catch {
      /* niente da fare */
    }
  },
}

// ---------- Chiamata base ----------

async function chiama<T>(percorso: string, opzioni: RequestInit = {}): Promise<T> {
  const t = token.leggi()
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (t) headers.Authorization = `Bearer ${t}`

  let risposta: Response
  try {
    risposta = await fetch(`${BASE}${percorso}`, { ...opzioni, headers })
  } catch {
    throw new ApiError(0, 'Server non raggiungibile. Riprova tra qualche secondo.')
  }

  if (!risposta.ok) {
    let messaggio = `${risposta.status} ${risposta.statusText}`
    let campi: Record<string, string> = {}
    try {
      const corpo = await risposta.json()
      if (corpo?.messaggio) messaggio = String(corpo.messaggio)
      if (corpo?.campi) campi = corpo.campi
    } catch {
      /* corpo non JSON */
    }
    // Token scaduto o non piu' valido: si esce e l'interfaccia torna ospite.
    if (risposta.status === 401 && t) {
      token.cancella()
      window.dispatchEvent(new Event(EVENTO_USCITA))
    }
    throw new ApiError(risposta.status, messaggio, campi)
  }

  return risposta.status === 204 ? (undefined as T) : ((await risposta.json()) as T)
}

const json = (corpo: unknown) => JSON.stringify(corpo)

function query(r: Ricerca): string {
  const p = new URLSearchParams()
  if (r.q?.trim()) p.set('q', r.q.trim())
  if (r.carrozzeria) p.set('carrozzeria', r.carrozzeria)
  if (r.sort) p.set('sort', r.sort)
  if (r.dir) p.set('dir', r.dir)
  if (r.page !== undefined) p.set('page', String(r.page))
  if (r.size !== undefined) p.set('size', String(r.size))
  const s = p.toString()
  return s ? `?${s}` : ''
}

// ---------- Endpoint ----------

export const api = {
  indirizzo: BASE || '(stessa origine, proxy di Vite)',

  // accesso
  registrazione: (email: string, nome: string, password: string) =>
    chiama<Accesso>('/api/auth/registrazione', { method: 'POST', body: json({ email, nome, password }) }),
  login: (email: string, password: string) =>
    chiama<Accesso>('/api/auth/login', { method: 'POST', body: json({ email, password }) }),

  // profilo
  profilo: () => chiama<Utente>('/api/profilo'),
  aggiornaProfilo: (nome: string) => chiama<Utente>('/api/profilo', { method: 'PUT', body: json({ nome }) }),
  eliminaAccount: () => chiama<void>('/api/profilo', { method: 'DELETE' }),

  // catalogo pubblico
  catalogo: (r: Ricerca = {}) => chiama<Pagina<Auto>>(`/api/auto${query(r)}`),
  auto: (id: number) => chiama<Auto>(`/api/auto/${id}`),

  // preferiti
  preferiti: () => chiama<Preferito[]>('/api/preferiti'),
  aggiungiPreferito: (autoId: number) =>
    chiama<Preferito>('/api/preferiti', { method: 'POST', body: json({ autoId }) }),
  rimuoviPreferito: (id: number) => chiama<void>(`/api/preferiti/${id}`, { method: 'DELETE' }),

  // avvisi
  avvisi: () => chiama<Avviso[]>('/api/avvisi'),
  creaAvviso: (autoId: number, soglia: number) =>
    chiama<Avviso>('/api/avvisi', { method: 'POST', body: json({ autoId, soglia }) }),
  eliminaAvviso: (id: number) => chiama<void>(`/api/avvisi/${id}`, { method: 'DELETE' }),
  disattivaAvviso: (tokenMail: string) =>
    chiama<void>('/api/avvisi/disattiva', { method: 'POST', body: json({ token: tokenMail }) }),

  // drag race
  gara: {
    classifica: (autoId?: number) =>
      chiama<RigaClassifica[]>(`/api/gara/classifica${autoId ? `?autoId=${autoId}` : ''}`),
    miei: () => chiama<RigaClassifica[]>('/api/gara/miei'),
    registra: (autoId: number, millis: number) =>
      chiama<EsitoGara>('/api/gara/tempi', { method: 'POST', body: json({ autoId, millis }) }),
  },

  // amministrazione
  admin: {
    elenco: (r: Ricerca = {}) => chiama<Pagina<AutoAdmin>>(`/api/admin/auto${query(r)}`),
    crea: (dati: DatiAuto & { prezzo: number }) =>
      chiama<AutoAdmin>('/api/admin/auto', { method: 'POST', body: json(dati) }),
    modifica: (id: number, dati: DatiAuto) =>
      chiama<AutoAdmin>(`/api/admin/auto/${id}`, { method: 'PUT', body: json(dati) }),
    cambiaPrezzo: (id: number, prezzo: number) =>
      chiama<AutoAdmin>(`/api/admin/auto/${id}/prezzo`, { method: 'PATCH', body: json({ prezzo }) }),
    elimina: (id: number) => chiama<void>(`/api/admin/auto/${id}`, { method: 'DELETE' }),
  },
}
