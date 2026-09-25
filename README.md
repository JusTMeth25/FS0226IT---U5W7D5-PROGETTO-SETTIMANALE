# Salone auto - BE + FE (TSX) + PostgreSQL

Mini salone di automobili. Chi non ha fatto l'accesso sfoglia le auto pubblicate, con ricerca e ordinamento.
L'utente registrato aggiunge auto ai preferiti e imposta una soglia di prezzo.
L'amministratore gestisce le auto, bozze comprese, e cambia i prezzi.
Se il nuovo prezzo scende sotto la soglia di un utente, a quell'utente parte una mail.

| Parte | Tecnologia | In locale | Su Render |
|---|---|---|---|
| Backend | Spring Boot 4.1.1, Java 25, Spring Security + JWT, Mail | `be` sulla 8080 | Web Service (Docker) |
| Frontend | React 19, Vite, TypeScript, Tailwind 4, Three.js (R3F + drei + postprocessing), Motion, GSAP, React Bits, Lenis | `fe` sulla 5173 | Static Site |
| Database | PostgreSQL | `U5W7D5-PROGETTO-SETTIMANALE` sulla 5432 | Render PostgreSQL |

## Endpoint

| Accesso | Metodo | Percorso | Cosa fa |
|---|---|---|---|
| pubblico | POST | `/api/auth/registrazione` | `{email, nome, password}`: crea un utente con ruolo USER e restituisce il token |
| pubblico | POST | `/api/auth/login` | `{email, password}`: restituisce il token |
| pubblico | GET | `/api/auto?q=&carrozzeria=&sort=&dir=&page=&size=` | catalogo delle auto pubblicate |
| pubblico | GET | `/api/auto/{id}` | dettaglio (404 se l'auto è una bozza) |
| pubblico | POST | `/api/avvisi/disattiva` | `{token}` dal link della mail: cancella l'avviso |
| pubblico | GET | `/api/gara/classifica?autoId=` | classifica della drag race (per auto o generale) |
| pubblico | GET | `/actuator/health`, `/api/stato` | health check, stato del DB |
| utente | GET / PUT / DELETE | `/api/profilo` | legge il profilo, cambia il nome, elimina l'account |
| utente | GET / POST | `/api/preferiti` | elenco, aggiunta `{autoId}` |
| utente | DELETE | `/api/preferiti/{id}` | rimozione |
| utente | GET / POST | `/api/avvisi` | elenco, creazione `{autoId, soglia}` |
| utente | DELETE | `/api/avvisi/{id}` | rimozione |
| utente | POST | `/api/gara/tempi` | `{autoId, millis}`: registra un tempo (tiene il record personale) |
| utente | GET | `/api/gara/miei` | i miei record |
| admin | GET / POST | `/api/admin/auto` | elenco (bozze e prezzo d'acquisto compresi), creazione |
| admin | GET / PUT / DELETE | `/api/admin/auto/{id}` | dettaglio, modifica (senza prezzo), eliminazione |
| admin | PATCH | `/api/admin/auto/{id}/prezzo` | `{prezzo}`: unico punto dove cambia il prezzo di vendita |

Parametri del catalogo:
- `sort`: `prezzo`, `anno`, `marca`, `modello` o `recenti` (default).
- `dir`: `asc` o `desc`.
- `size`: massimo 50.

Il token va nell'header `Authorization: Bearer <token>`.

## Variabili d'ambiente del backend

| Variabile | Obbligatoria | Note |
|---|---|---|
| `JWT_SECRET` | sì | Almeno 32 caratteri. Senza, il BE non parte. |
| `ADMIN_PASSWORD` | per avere un admin | Almeno 8 caratteri. L'admin si crea al primo avvio. |
| `ADMIN_EMAIL` | no | Default `admin@salone.local`. |
| `MAIL_USERNAME` | per le mail | Indirizzo Gmail mittente. |
| `MAIL_PASSWORD` | per le mail | Password per le app di Google. Mai in `application.yml`. |
| `FRONTEND_URL` | no | Default `http://localhost:5173`. Serve per il link della mail. |
| `ALLOWED_ORIGIN` | in produzione | Origine del FE per il CORS. |
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | no | Default: DB locale, `postgres` / `1234`. |

Per creare la password per le app di Gmail:
1. Attiva la verifica in 2 passaggi sull'account Google.
2. Apri https://myaccount.google.com/apppasswords.
3. Crea una password (16 caratteri) e salvala in `MAIL_PASSWORD`.

## Avvio in locale

1. Avvia PostgreSQL sulla 5432 con il database `U5W7D5-PROGETTO-SETTIMANALE` già creato.
2. Imposta le variabili (PowerShell, solo per la sessione corrente):
   ```
   $env:JWT_SECRET = "una-stringa-casuale-di-almeno-32-caratteri"
   $env:ADMIN_PASSWORD = "..."
   ```
3. Avvia con doppio clic su `avvia.cmd` (Windows) o `./avvia.sh` (macOS/Linux), oppure:
   ```
   cd be && .\mvnw.cmd spring-boot:run
   cd fe && npm install && npm run dev
   ```

## Deploy su Render

1. Metti `be/`, `fe/` e `render.yaml` nella radice della repository.
2. Da **New > Blueprint** scegli la repository. Nascono `salone-db`, `salone-be` e `salone-fe`.
3. Imposta le variabili `sync: false`, senza `/` finale. `JWT_SECRET` la genera Render.

   | Servizio | Variabile | Valore |
   |---|---|---|
   | `salone-be` | `ALLOWED_ORIGIN` | `https://salone-fe.onrender.com` |
   | `salone-be` | `FRONTEND_URL` | `https://salone-fe.onrender.com` |
   | `salone-be` | `ADMIN_EMAIL`, `ADMIN_PASSWORD` | credenziali dell'amministratore |
   | `salone-be` | `MAIL_USERNAME`, `MAIL_PASSWORD` | Gmail e password per le app |
   | `salone-fe` | `VITE_API_URL` | `https://salone-be.onrender.com` |

4. Esegui **Manual Deploy** di entrambi i servizi. `VITE_API_URL` viene letta in fase di build.

## Scelte

**Quando parte la mail.**
- Un avviso scatta quando il prezzo attraversa la soglia: prima `soglia < vecchio`, adesso `soglia >= nuovo`.
- Se il prezzo resta uguale o scende ancora, nessuna soglia entra in questo intervallo, quindi non parte niente.
- Ogni avviso manda una sola mail. Dopo resta `inviato = true`, anche se il prezzo risale e poi riscende.
- Le bozze non fanno scattare avvisi.

**Dopo il commit, senza doppioni.**
- `AutoService.cambiaPrezzo` pubblica `PrezzoScesoEvent` dentro la transazione.
- `AvvisoMailListener` lo riceve con `@TransactionalEventListener(phase = AFTER_COMMIT)` e `@Async`.
- Se il salvataggio fallisce, l'evento viene scartato. L'amministratore non aspetta Gmail.
- Il segno si prende con `UPDATE avvisi SET inviato = true WHERE id = ? AND inviato = false`, in una transazione separata.
- Spedisce solo il thread che ha aggiornato una riga.
- La riga dell'auto viene letta con un lock (`PESSIMISTIC_WRITE`), quindi due cambi di prezzo ravvicinati vedono il prezzo "vecchio" giusto.

**Se Gmail non risponde, l'avviso resta inviato e la mail è persa.**
- Rimettere `inviato = false` porterebbe al doppione: un timeout dal nostro lato può arrivare anche quando Gmail ha già consegnato la mail.
- Una mail in meno è preferibile a due mail uguali. L'errore finisce nel log con il solo id dell'avviso.

**Input.**
- Registrazione, profilo, preferiti e avvisi ricevono record DTO, mai l'entità.
- Se il JSON contiene `ruolo`, `inviato`, `utenteId` o `token`, quei campi vengono ignorati.
- L'utente arriva sempre dal JWT.
- Il testo di ricerca è un parametro legato. I caratteri `%` e `_` scritti dall'utente sono neutralizzati.
- Il campo di ordinamento si confronta con un elenco chiuso (`OrdinamentoAuto`). Un valore fuori elenco dà 400.
- Il template della mail fa l'escape HTML di nome, marca, modello e link.

**Autorizzazioni.**
- `/api/admin/**` richiede ADMIN in `SecurityConfig` e con `@PreAuthorize`. Un utente normale riceve 403.
- Il ruolo lo decide il server: la registrazione crea sempre USER e l'admin nasce solo da `AdminSeeder`.
- Il JWT contiene solo l'id dell'utente e il ruolo.
- Preferiti e avvisi si cercano per id e proprietario insieme. Quelli di un altro utente danno 404.
- Il link della mail porta un token casuale di 256 bit, non l'id.
- Il token è monouso: disattivare l'avviso lo cancella.
- Nei log non finiscono password né indirizzi email.

**Eliminazione dell'account.**
- `DELETE /api/profilo` cancella avvisi, preferiti e utente.
- Se una mail era già in coda, l'UPDATE trova 0 righe e non spedisce.

## Frontend "Vetrina"

| Pagina | Percorso | Accesso |
|---|---|---|
| Home con tunnel di luci 3D e vetrina di supercar | `/` | tutti |
| Catalogo con ricerca, filtro carrozzeria, ordinamento e paginazione nell'URL | `/catalogo` | tutti |
| Dettaglio con foto reale, modello 3D Sketchfab, preferito e soglia | `/auto/:id` | tutti (azioni da utente) |
| Accedi / Registrati | `/accedi` | ospiti |
| Preferiti con soglia per ogni auto | `/preferiti` | utente |
| Avvisi con stato "in attesa / mail inviata" | `/avvisi` | utente |
| Drag race 3D sui 402 m con classifica | `/gara` | tutti (salvataggio da utente) |
| Profilo, cambio nome, eliminazione account | `/profilo` | utente |
| Officina: bozze, prezzo d'acquisto, cambio prezzo | `/admin` | admin |
| Disattivazione dal link della mail | `/avvisi/disattiva?token=` | tutti |
| Privacy Policy / Cookie Policy (link nel footer di ogni pagina) | `/privacy`, `/cookie` | tutti |

- **Catalogo reale**: 76 modelli venduti in Italia, importati all'avvio da `be/src/main/resources/catalogo/auto.json` (`CatalogoSeeder`).
  - Prezzi: listino italiano "da", verificato a settembre 2026 su Quattroruote e sui listini ufficiali.
  - Foto: Wikimedia Commons, con autore e licenza Creative Commons mostrati sotto ogni foto.
  - Modelli 3D: visualizzatore Sketchfab, caricato solo dopo un clic (servizio esterno, citato nella Privacy Policy).
  - Un riavvio aggiorna foto e 3D ma non tocca i prezzi: li gestisce l'admin, e cambiarli farebbe scattare gli avvisi.
- La home ha un tunnel di luci in Three.js (R3F + bloom), con effetto turbo al passaggio sul pulsante.
- Three.js si carica solo in home (`React.lazy`).
- I componenti React Bits (SplitText, Aurora, ClickSpark, SpotlightCard, CountUp, ShinyText, Magnet, GradientText) si trovano in `fe/src/components/bits`.
- I font sono self-hosted con `@fontsource`: il browser non contatta terze parti.
- Ogni `fetch` passa da `fe/src/lib/api.ts`.
- Il token si salva nel localStorage con la chiave `vetrina.token`, come dichiarato nella Cookie Policy.
- Nessun `dangerouslySetInnerHTML`: descrizioni e nomi si mostrano sempre come testo.

## Drag race

- Si sceglie un'auto del catalogo e si corre contro 3 avversari guidati dal computer, "alla pari" (0-100 simile) o a caso.
- Ogni auto ha CV, 0-100, velocita' massima e peso reali della versione indicata, verificati sul web (settembre 2026).
- Comandi: Spazio o ↑ per partire al verde e cambiare marcia, N o Shift per il nitro, Esc per uscire. Su mobile ci sono i pulsanti.
- La fisica e' in `fe/src/lib/gara.ts` ed e' copiata identica in `be/.../gara/Simulatore.java`:
  - accelerazione ricavata dallo 0-100 e dalla velocita' massima dichiarate;
  - 6 marce con limitatore (1 marcia per le elettriche), 0,15 s per cambiata;
  - nitro +30% per 2 s, passo fisso 1/120 s.
- **Antitruffa**: il server ricalcola il tempo con guida perfetta (reazione zero, cambiate al limitatore, nitro nel momento migliore). Un tempo piu' basso di quel minimo (tolleranza 30 ms) viene rifiutato con 400.
- In classifica compare solo il nome dell'utente, mai l'email. Eliminando l'account si cancellano anche i tempi.

## Struttura

```
render.yaml                 blueprint: database + backend + frontend
avvia.cmd / avvia.sh        avvio locale (Windows / macOS-Linux)
be/src/main/java/it/epicode/base/
  config/     DatabaseUrl, CorsConfig, AsyncConfig, AdminSeeder
  security/   SecurityConfig, JwtService, JwtFilter, UtenteCorrente
  errore/     GlobalExceptionHandler e eccezioni applicative
  utente/     registrazione, login, profilo
  auto/       catalogo pubblico e gestione admin, OrdinamentoAuto
  preferito/  preferiti dell'utente
  avviso/     avvisi, PrezzoScesoEvent, AvvisoMailListener, MailAvvisi
  gara/       Simulatore (fisica), Tempo, classifica e controllo antitruffa
fe/src/
  lib/          api.ts (tutte le fetch), auth.tsx, toast.tsx, formato.ts, gara.ts (fisica), audioMotore.ts
  components/   Layout, AutoCard, FotoAuto, Viewer3D, Sagoma (SVG di riserva), SogliaForm, ui, three/Tunnel, bits/ (React Bits)
  pages/        Home, Catalogo, AutoDettaglio, Accedi, Preferiti, Avvisi, Profilo, Admin, Disattiva, Legale, NonTrovata
```
