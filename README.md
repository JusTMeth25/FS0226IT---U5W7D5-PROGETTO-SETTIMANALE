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
| `MAIL_USERNAME` | per le mail | Indirizzo mittente (Gmail in locale, verificato su Mailjet in produzione). |
| `MAIL_PASSWORD` | in locale | Password per le app di Google, per l'SMTP. Mai in `application.yml`. |
| `MAILJET_API_KEY`, `MAILJET_SECRET_KEY` | su Render | Se presenti, le mail partono dall'API HTTPS di Mailjet invece che via SMTP. |
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
   | `salone-be` | `MAILJET_API_KEY`, `MAILJET_SECRET_KEY`, `MAIL_USERNAME` | chiavi API Mailjet e mittente verificato |
   | `salone-fe` | `VITE_API_URL` | `https://salone-be.onrender.com` |

4. Esegui **Manual Deploy** di entrambi i servizi. `VITE_API_URL` viene letta in fase di build.

**Perche' Mailjet su Render:** dal 26/09/2025 i web service gratuiti di Render bloccano le porte SMTP in uscita (25, 465, 587). L'API di Mailjet usa HTTPS sulla porta 443 e il piano gratuito basta (200 mail al giorno). In locale, senza chiavi Mailjet, resta Gmail via SMTP.

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

## Modelli 3D in gara

39 auto usano in gara un modello 3D reale scaricato da Sketchfab con licenza Creative Commons; le altre usano un modello stilizzato.
- Scaricati una volta con l'API di download di Sketchfab (token personale, mai nel repo).
- Compressi con gltf-transform: texture 1024 px WebP, circa 150-250 mila vertici, meshopt. Da 5-127 MB a 1-4 MB l'uno (77 MB in tutto).
- In `fe/public/modelli/`, con `indice.json`: file, crediti e correzioni (rotazione, pezzi da ignorare nel calcolo delle misure).
- Esclusi modelli con licenza Standard, Editorial o NoDerivs: non permettono di ridistribuire il file compresso.
- Molti modelli sono CC BY-NC: vanno bene per questo progetto didattico, non per un uso commerciale.

| Auto | Modello | Autore | Licenza |
|---|---|---|---|
| Alfa Romeo Junior | [2024 Alfa Romeo Junior](https://sketchfab.com/3d-models/2024-alfa-romeo-junior-9a7af50eb8bb4b3eba07b80133616856) | tonielpro520 | CC BY |
| Alfa Romeo Tonale | [2023 Alfa Romeo Tonale Veloce](https://sketchfab.com/3d-models/2023-alfa-romeo-tonale-veloce-19e572df8609438e83d1583cad9a20d4) | tonielpro520 | CC BY |
| Alfa Romeo Giulia | [2016 Alfa Romeo Giulia Quadrifoglio](https://sketchfab.com/3d-models/2016-alfa-romeo-giulia-quadrifoglio-8985b52ac8a84aaf90ccaa5669697001) | Ddiaz Design | CC BY-NonCommercial-ShareAlike |
| Alfa Romeo Stelvio | [2017 Alfa Romeo Stelvio Quadrifoglio](https://sketchfab.com/3d-models/2017-alfa-romeo-stelvio-quadrifoglio-b6e382aee4a44fb3b1222d7191470640) | tonielpro520 | CC BY |
| Ferrari 296 GTB | [2022 Ferrari 296 GTB](https://sketchfab.com/3d-models/2022-ferrari-296-gtb-269f4fd01b584dd38f7e512de60c4645) | Ddiaz Design | CC BY-NonCommercial-ShareAlike |
| Ferrari 296 GTS | [2023 Ferrari 296 GTS](https://sketchfab.com/3d-models/2023-ferrari-296-gts-9a596b9d09414adfad64fc1f5fd019f9) | Ddiaz Design | CC BY-NonCommercial-ShareAlike |
| Ferrari Purosangue | [2023 Ferrari Purosangue](https://sketchfab.com/3d-models/2023-ferrari-purosangue-541dc84c37174356a7b0efd44904593d) | Ddiaz Design | CC BY-NonCommercial-ShareAlike |
| Ferrari 12Cilindri | [2025 Ferrari 12Cilindri](https://sketchfab.com/3d-models/2025-ferrari-12cilindri-cb0b42a5bda844bd8ccd62451f1db427) | Ddiaz Design | CC BY |
| Lamborghini Urus | [2023 Lamborghini Urus Performante](https://sketchfab.com/3d-models/2023-lamborghini-urus-performante-23dd7730fc244eba997cf60afa70177e) | Outlaw Games™ | CC BY-NonCommercial |
| Lamborghini Temerario | [2025 Lamborghini Temerario](https://sketchfab.com/3d-models/2025-lamborghini-temerario-223504eacee54eaf9169cc60db1c0a70) | Ddiaz Design | CC BY-NonCommercial-ShareAlike |
| Lamborghini Revuelto | [Lamborghini Revuelto](https://sketchfab.com/3d-models/lamborghini-revuelto-4258ff5b559c45f2a470344f0e04c8cd) | Outlaw Games™ | CC BY-NonCommercial |
| Porsche Taycan | [2025 Porsche Taycan Turbo GT Weissach Package](https://sketchfab.com/3d-models/2025-porsche-taycan-turbo-gt-weissach-package-4e1abafe7cf5413587a421377624ba08) | Ddiaz Design | CC BY-NonCommercial-ShareAlike |
| Porsche Cayenne | [2022 Porsche Cayenne Turbo GT](https://sketchfab.com/3d-models/2022-porsche-cayenne-turbo-gt-74fbea5a4dfc4197839fdd2bf654369a) | Ddiaz Design | CC BY-NonCommercial-ShareAlike |
| Porsche Panamera | [2021 Porsche Panamera Turbo S Sport Turismo](https://sketchfab.com/3d-models/2021-porsche-panamera-turbo-s-sport-turismo-f2269fdf74f64257a3a9b0872eb9b2d8) | Ddiaz Design | CC BY-NonCommercial-ShareAlike |
| Porsche 911 Carrera | [2022 Porsche 911 GT3 Touring (992)](https://sketchfab.com/3d-models/2022-porsche-911-gt3-touring-992-a76364a3d50c4d78912a28250cb57be5) | Ddiaz Design | CC BY-NonCommercial-ShareAlike |
| Porsche 911 GT3 | [Porsche 911 GT3](https://sketchfab.com/3d-models/porsche-911-gt3-593c83f3662a4a45a016f95dedd9f243) | Outlaw Games™ | CC BY-NonCommercial |
| BMW Serie 1 | [Bmw Serie 1 F40](https://sketchfab.com/3d-models/bmw-serie-1-f40-585c5cf5189d4f8ca8405e5d2d20603d) | Paradax001 | CC BY |
| BMW M4 Competition | [2025 BMW M4 Competition](https://sketchfab.com/3d-models/2025-bmw-m4-competition-f8141ecd755547989c9209784b71ad43) | Ddiaz Design | CC BY-NonCommercial-ShareAlike |
| Mercedes-Benz CLA | [2026 Mercedes-Benz CLA Sedan EV](https://sketchfab.com/3d-models/2026-mercedes-benz-cla-sedan-ev-52c4a3cc5536425782e13bd8282f9d99) | Ddiaz Design | CC BY-NonCommercial-ShareAlike |
| Mercedes-Benz Classe C | [Mercedes-Benz C-Class Estate  Free](https://sketchfab.com/3d-models/mercedes-benz-c-class-estate-free-b108b6f2e9654481af1c02801a98228e) | Sloftm_Carz | CC BY |
| Mercedes-Benz AMG G 63 | [2025 Mercedes-Benz G-Class AMG G 63](https://sketchfab.com/3d-models/2025-mercedes-benz-g-class-amg-g-63-f583b5bfc17346c08573dc4f1edebefe) | Ddiaz Design | CC BY-NonCommercial-ShareAlike |
| Mercedes-Benz AMG GT 63 | [Mercedes-Benz GT 63 AMG](https://sketchfab.com/3d-models/mercedes-benz-gt-63-amg-1bac25a7f21a4297ba2392dca814fd7e) | Nieve5677 | CC BY |
| Audi Q3 | [2023 Audi Q3 40 TFSI](https://sketchfab.com/3d-models/2023-audi-q3-40-tfsi-97dccbc18cfb4f1e973fc75e278c6f66) | Ddiaz Design | CC BY-NonCommercial-ShareAlike |
| Audi RS 6 Avant | [2020 Audi RS6 Avant](https://sketchfab.com/3d-models/2020-audi-rs6-avant-980dbda2cbbb4bae8decaed2fa80aa0c) | Ddiaz Design | CC BY-NonCommercial-ShareAlike |
| Audi RS e-tron GT | [2022 Audi RS e-tron GT](https://sketchfab.com/3d-models/2022-audi-rs-e-tron-gt-e5b032ec99bc44be9f31761c574fe4c2) | Ddiaz Design | CC BY-NonCommercial-ShareAlike |
| Volkswagen ID.3 | [2021 Volkwagen ID.3](https://sketchfab.com/3d-models/2021-volkwagen-id3-cae9c426df874fa4b7f47ea2611f3824) | Ddiaz Design | CC BY |
| Renault Captur | [2025 Renault Captur](https://sketchfab.com/3d-models/2025-renault-captur-3fe3f58932cf46bd8cfb4437187b287f) | tonielpro520 | CC BY |
| Alpine A110 | [2022 Alpine A110](https://sketchfab.com/3d-models/2022-alpine-a110-00fc322c91f04f23acae09910620937f) | Ddiaz Design | CC BY-NonCommercial-ShareAlike |
| Peugeot 2008 | [2020 Peugeot 2008](https://sketchfab.com/3d-models/2020-peugeot-2008-93efd164d3374295a8ac04c36e329429) | David_Holiday | CC BY |
| Peugeot 308 | [2022 | Peugeot 308](https://sketchfab.com/3d-models/2022-peugeot-308-0d9c9c265bec42678bfc269c1a8cebc3) | kevin (ケビン) | CC BY |
| Tesla Model 3 | [Tesla 2018 Model 3](https://sketchfab.com/3d-models/tesla-2018-model-3-5ef9b845aaf44203b6d04e2c677e444f) | Ameer Studio | CC BY |
| Tesla Model Y | [2025 Tesla Model Y](https://sketchfab.com/3d-models/2025-tesla-model-y-619601e7800d418da5922c4fa7833f74) | BloxBloger | CC BY-NonCommercial |
| Tesla Model S | [TESLA MODEL S 90D ALL-WHEEL DRIVE](https://sketchfab.com/3d-models/tesla-model-s-90d-all-wheel-drive-cad404f3c3b341b7a7bd954d4f2770b2) | pancakesbassoondonut | CC BY |
| Honda Civic Type R | [2023 Honda Civic Type R](https://sketchfab.com/3d-models/2023-honda-civic-type-r-8c9484184a2b4254aafd67418b8c18db) | Ddiaz Design | CC BY-NonCommercial-ShareAlike |
| McLaren Artura | [2023 McLaren Artura](https://sketchfab.com/3d-models/2023-mclaren-artura-d393abd807f04d62b96b1bd82119b5d4) | Ddiaz Design | CC BY |
| McLaren 750S | [Mc Laren 750s](https://sketchfab.com/3d-models/mc-laren-750s-c863bfed41894b39bce6e3f7f1b7bc91) | MistHars | CC BY |
| Aston Martin DB12 | [2024 Aston Martin DB12](https://sketchfab.com/3d-models/2024-aston-martin-db12-f603d93210c04f2b8a8308afaa9da87d) | tonielpro520 | CC BY |
| Hyundai i20 | [2022 Hyundai i20 N Line](https://sketchfab.com/3d-models/2022-hyundai-i20-n-line-ed61e7bd2fdb498aa97cb389b1440633) | Ddiaz Design | CC BY-NonCommercial-ShareAlike |
| Hyundai Kona | [2025 Hyundai Kona N Line](https://sketchfab.com/3d-models/2025-hyundai-kona-n-line-26c27a6e061d4776b750e483b933df79) | Ddiaz Design | CC BY-NonCommercial-ShareAlike |

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
