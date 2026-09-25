import { motion } from 'motion/react'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { Intestazione } from '@/components/ui'

const AGGIORNATA = '25 settembre 2026'

function Sezione({ titolo, children, i }: { titolo: string; children: ReactNode; i: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      transition={{ delay: (i % 3) * 0.05 }}
      className="grid gap-4 border-t border-line py-8 md:grid-cols-[220px_1fr]"
    >
      <h2 className="font-display text-lg font-semibold text-paper">
        <span className="mr-2 font-mono text-sm text-ember">{String(i + 1).padStart(2, '0')}</span>
        {titolo}
      </h2>
      <div className="space-y-3 leading-relaxed text-fog [&_strong]:text-paper [&_li]:ml-5 [&_li]:list-disc">{children}</div>
    </motion.section>
  )
}

function Tabella({ righe }: { righe: [string, string, string][] }) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-line">
      <table className="w-full min-w-[520px] text-left text-sm">
        <thead className="bg-ink-2 font-mono text-[11px] uppercase tracking-widest text-fog">
          <tr>
            <th className="px-4 py-3">Dato</th>
            <th className="px-4 py-3">A cosa serve</th>
            <th className="px-4 py-3">Per quanto</th>
          </tr>
        </thead>
        <tbody>
          {righe.map(([d, s, t]) => (
            <tr key={d} className="border-t border-line align-top">
              <td className="px-4 py-3 text-paper">{d}</td>
              <td className="px-4 py-3">{s}</td>
              <td className="px-4 py-3">{t}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Privacy() {
  const sezioni: [string, ReactNode][] = [
    [
      'Chi tratta i dati',
      <>
        <p>
          Vetrina e' un mini salone di automobili realizzato come progetto didattico (Epicode, consegna settimanale U5W7D5). Il titolare del
          trattamento e' l'autore del progetto. Per qualunque richiesta sui tuoi dati puoi rispondere a una delle mail di avviso che ricevi da
          noi: arriva direttamente al titolare.
        </p>
      </>,
    ],
    [
      'Quali dati raccogliamo',
      <>
        <p>Salviamo solo quello che serve al funzionamento del salone, e nient'altro:</p>
        <Tabella
          righe={[
            ['Email', 'Accesso all\'account e invio delle mail di avviso', 'Fino all\'eliminazione dell\'account'],
            ['Nome', 'Saluto nell\'interfaccia e nelle mail', 'Fino all\'eliminazione dell\'account'],
            ['Password', 'Accesso. Salviamo solo un hash BCrypt, mai la password in chiaro', 'Fino all\'eliminazione dell\'account'],
            ['Ruolo (cliente / amministratore)', 'Decidere cosa puoi fare nel sito', 'Fino all\'eliminazione dell\'account'],
            ['Data di registrazione', 'Gestione tecnica dell\'account', 'Fino all\'eliminazione dell\'account'],
            ['Preferiti (auto salvate e data)', 'Mostrarti il tuo "garage"', 'Finche\' non li rimuovi o elimini l\'account'],
            [
              'Avvisi (auto, soglia di prezzo, stato "mail inviata", codice casuale di disattivazione, data)',
              'Mandarti una mail quando il prezzo scende sotto la soglia',
              'Finche\' non li elimini, li disattivi dal link nella mail o elimini l\'account',
            ],
          ]}
        />
        <p>
          Non raccogliamo telefono, indirizzo, dati di pagamento, posizione o dati di navigazione. Nei log dell'applicazione non scriviamo
          ne' password ne' indirizzi email.
        </p>
      </>,
    ],
    [
      'Base giuridica',
      <p>
        Il trattamento e' necessario per fornirti il servizio che chiedi registrandoti (art. 6.1.b GDPR): senza email non potremmo farti
        accedere ne' avvisarti. Le mail partono solo per gli avvisi che crei tu, una sola volta per avviso.
      </p>,
    ],
    [
      'Chi altro vede i dati',
      <>
        <ul>
          <li>
            <strong>Render</strong> (render.com) ospita il sito, il server e il database, nella regione di Francoforte (UE).
          </li>
          <li>
            <strong>Google (Gmail)</strong> consegna le mail di avviso: per spedirle riceve il tuo indirizzo, il tuo nome e il contenuto della
            mail.
          </li>
          <li>
            <strong>Wikimedia Foundation</strong> (wikimedia.org) ospita le foto delle auto. Per mostrartele il browser le scarica da
            loro, che vedono quindi il tuo indirizzo IP. Non inviamo il riferimento alla pagina (referrer) e non ci sono cookie.
          </li>
          <li>
            <strong>Sketchfab</strong> (Epic Games) ospita i modelli 3D. Il visualizzatore si carica solo se premi «Carica il 3D»: da quel
            momento il browser si collega ai loro server, secondo la loro privacy policy. Lo apriamo con l'opzione «do not track».
          </li>
        </ul>
        <p>Non vendiamo e non cediamo i dati a nessun altro. Non usiamo strumenti di analisi, pubblicita' o profilazione.</p>
      </>,
    ],
    [
      'I tuoi diritti',
      <>
        <p>Hai i diritti degli articoli 15-22 del GDPR: accesso, rettifica, cancellazione, limitazione, portabilita' e opposizione.</p>
        <ul>
          <li>
            <strong>Rettifica</strong>: cambi il nome dal <Link to="/profilo" className="text-ember hover:underline">profilo</Link>.
          </li>
          <li>
            <strong>Cancellazione</strong>: dal profilo, «Elimina il mio account» cancella subito profilo, preferiti e avvisi. Da quel momento
            non parte piu' nessuna mail verso di te.
          </li>
          <li>
            <strong>Stop a un singolo avviso</strong>: usa il link «Disattiva l'avviso» nella mail. Il link contiene un codice casuale monouso,
            non il tuo identificativo.
          </li>
          <li>Per tutto il resto, scrivici come indicato al punto 1.</li>
        </ul>
        <p>Puoi anche proporre reclamo al Garante per la protezione dei dati personali (garanteprivacy.it).</p>
      </>,
    ],
    [
      'Sicurezza',
      <p>
        Le password sono salvate con BCrypt. L'accesso usa un token firmato che contiene solo il tuo identificativo e il ruolo e scade dopo 24
        ore. Ogni richiesta su preferiti e avvisi controlla che siano tuoi: quelli di un altro utente, per te, non esistono.
      </p>,
    ],
  ]
  return (
    <div className="mx-auto max-w-4xl px-5 pt-32">
      <Intestazione sopra={`Aggiornata il ${AGGIORNATA}`} titolo="Privacy Policy" sotto="Cosa facciamo con i tuoi dati, detto semplice." />
      {sezioni.map(([t, c], i) => (
        <Sezione key={t} titolo={t} i={i}>
          {c}
        </Sezione>
      ))}
      <p className="border-t border-line pt-8 text-sm text-fog">
        Vedi anche la <Link to="/cookie" className="text-ember hover:underline">Cookie Policy</Link>.
      </p>
    </div>
  )
}

export function Cookie() {
  const sezioni: [string, ReactNode][] = [
    [
      'In breve',
      <p>
        Vetrina <strong>non usa cookie propri</strong>: ne' tecnici, ne' di analisi, ne' di profilazione. L'unico contenuto esterno che potrebbe usarne (il visualizzatore 3D) parte solo con un tuo clic, quindi non ti chiediamo alcun consenso
        all'ingresso. C'e' pero' un dato che salviamo nel tuo browser quando accedi, ed e' giusto che tu lo sappia.
      </p>,
    ],
    [
      'Cosa resta nel browser',
      <>
        <Tabella
          righe={[
            [
              'vetrina.token (localStorage)',
              'Il token di accesso: ti tiene collegato tra una pagina e l\'altra. Contiene solo il tuo identificativo numerico, il ruolo e la scadenza, firmati dal server.',
              'Si cancella quando premi «Esci», quando elimini l\'account o quando il server lo rifiuta. In ogni caso scade dopo 24 ore.',
            ],
          ]}
        />
        <p>
          E' uno strumento strettamente necessario: senza, dovresti rifare l'accesso a ogni pagina. Chi non accede non ha nulla salvato nel
          browser.
        </p>
      </>,
    ],
    [
      'Perche\' localStorage e non un cookie',
      <p>
        Il sito e il server stanno su due indirizzi diversi, e il token viaggia nell'intestazione di ogni richiesta invece che in un cookie.
        Il rovescio della medaglia e' che il localStorage e' leggibile dal codice della pagina: per questo nessun testo scritto da utenti
        (descrizioni delle auto, nomi) viene mai interpretato come HTML.
      </p>,
    ],
    [
      'Terze parti',
      <>
        <p>
          Font, animazioni e la grafica del tunnel in home sono serviti dal nostro sito: niente Google Fonts, social network o servizi di
          statistica.
        </p>
        <ul>
          <li>
            <strong>Foto delle auto</strong>: arrivano da Wikimedia Commons (wikimedia.org), senza referrer. Wikimedia non imposta
            cookie per le immagini.
          </li>
          <li>
            <strong>Modelli 3D</strong>: il visualizzatore di Sketchfab e' un contenuto esterno che puo' usare cookie propri. Per questo non
            parte da solo: si carica solo dopo il tuo clic su «Carica il 3D», e la scelta non viene salvata. Alla pagina successiva te lo
            chiediamo di nuovo.
          </li>
        </ul>
      </>,
    ],
    [
      'Come cancellarlo',
      <p>
        Premi «Esci» oppure cancella i dati del sito dalle impostazioni del browser. Se elimini l'account dal{' '}
        <Link to="/profilo" className="text-ember hover:underline">profilo</Link>, il token viene rimosso insieme ai tuoi dati sul server.
      </p>,
    ],
  ]
  return (
    <div className="mx-auto max-w-4xl px-5 pt-32">
      <Intestazione sopra={`Aggiornata il ${AGGIORNATA}`} titolo="Cookie Policy" sotto="Zero cookie nostri. Un solo dato nel browser, e ti diciamo quale." />
      {sezioni.map(([t, c], i) => (
        <Sezione key={t} titolo={t} i={i}>
          {c}
        </Sezione>
      ))}
      <p className="border-t border-line pt-8 text-sm text-fog">
        Vedi anche la <Link to="/privacy" className="text-ember hover:underline">Privacy Policy</Link>.
      </p>
    </div>
  )
}
