package it.epicode.base.avviso;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.MailException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

import java.nio.charset.StandardCharsets;

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
	private final JavaMailSender mailSender;
	private final String mittente;

	public AvvisoMailListener(AvvisoService avvisoService, MailAvvisi template, JavaMailSender mailSender,
							  @Value("${spring.mail.username:}") String mittente) {
		this.avvisoService = avvisoService;
		this.template = template;
		this.mailSender = mailSender;
		this.mittente = mittente;
	}

	@Async
	@TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
	public void suPrezzoSceso(PrezzoScesoEvent evento) {
		for (Long avvisoId : evento.avvisoIds()) {
			if (!avvisoService.prendiSegno(avvisoId)) {
				continue; // gia' inviato da un altro thread, o avviso cancellato
			}
			avvisoService.datiMail(avvisoId).ifPresent(this::invia);
		}
	}

	private void invia(DatiMail dati) {
		try {
			MimeMessage messaggio = mailSender.createMimeMessage();
			MimeMessageHelper helper = new MimeMessageHelper(messaggio, false, StandardCharsets.UTF_8.name());
			if (!mittente.isBlank()) {
				helper.setFrom(mittente);
			}
			helper.setTo(dati.email());
			helper.setSubject(template.oggetto(dati));
			helper.setText(template.corpoHtml(dati), true);
			mailSender.send(messaggio);
			log.info("Mail inviata per avviso {}", dati.avvisoId());
		} catch (MailException | MessagingException e) {
			log.warn("Invio fallito per avviso {} ({}): resta segnato come inviato",
					dati.avvisoId(), e.getClass().getSimpleName());
		}
	}
}
