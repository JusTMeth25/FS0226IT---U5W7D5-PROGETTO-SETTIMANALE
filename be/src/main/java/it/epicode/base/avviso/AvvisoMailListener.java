package it.epicode.base.avviso;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

/**
 * Manda le mail degli avvisi.
 *
 * - AFTER_COMMIT: parte solo se il nuovo prezzo e' davvero salvato. Se la
 *   transazione fa rollback, l'evento viene scartato.
 * - @Async: gira su un altro thread, l'amministratore riceve la risposta
 *   senza aspettare Gmail.
 * - prendiSegno: UPDATE ... WHERE inviato = false. Solo chi aggiorna la riga
 *   spedisce, quindi due cambi di prezzo ravvicinati non fanno due mail.
 *
 * Se Gmail non risponde, l'avviso RESTA inviato e la mail e' persa. Scelta
 * voluta: meglio una mail in meno che una doppia. Rimettere inviato = false
 * dopo un errore aprirebbe la strada al doppione (timeout lato nostro ma mail
 * consegnata lato Gmail) e l'utente non capirebbe perche' riceve due avvisi.
 *
 * Nei log finisce solo l'id dell'avviso, mai l'indirizzo email.
 */
@Component
public class AvvisoMailListener {

	private static final Logger log = LoggerFactory.getLogger(AvvisoMailListener.class);

	private final AvvisoService avvisoService;
	private final MailAvvisi template;
	private final InvioMail invioMail;

	public AvvisoMailListener(AvvisoService avvisoService, MailAvvisi template, InvioMail invioMail) {
		this.avvisoService = avvisoService;
		this.template = template;
		this.invioMail = invioMail;
	}

	@Async
	@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
	public void suPrezzoSceso(PrezzoScesoEvent evento) {
		for (Long avvisoId : evento.avvisoIds()) {
			if (!avvisoService.prendiSegno(avvisoId)) {
				continue; // gia' inviato da un altro thread, o avviso cancellato
			}
			avvisoService.datiMail(avvisoId, evento.prezzoPrecedente()).ifPresent(this::invia);
		}
	}

	private void invia(DatiMail dati) {
		try {
			invioMail.invia(dati.email(), dati.nome(), template.oggetto(dati), template.corpoHtml(dati));
			log.info("Mail inviata per avviso {}", dati.avvisoId());
		} catch (RuntimeException e) {
			// Solo id e tipo di errore: il messaggio potrebbe contenere l'indirizzo.
			log.warn("Invio fallito per avviso {} ({}): resta segnato come inviato",
					dati.avvisoId(), e.getClass().getSimpleName());
		}
	}
}
