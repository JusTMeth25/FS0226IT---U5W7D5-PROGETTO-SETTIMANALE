package it.epicode.base.avviso;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.MailPreparationException;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;

import java.nio.charset.StandardCharsets;

/** Invio tramite SMTP (Gmail con password per le app). */
public class SmtpInvioMail implements InvioMail {

	private final JavaMailSender mailSender;
	private final String mittente;

	public SmtpInvioMail(JavaMailSender mailSender, String mittente) {
		this.mailSender = mailSender;
		this.mittente = mittente;
	}

	@Override
	public void invia(String destinatario, String nome, String oggetto, String html) {
		try {
			MimeMessage messaggio = mailSender.createMimeMessage();
			MimeMessageHelper helper = new MimeMessageHelper(messaggio, false, StandardCharsets.UTF_8.name());
			if (!mittente.isBlank()) {
				helper.setFrom(mittente);
			}
			helper.setTo(destinatario);
			helper.setSubject(oggetto);
			helper.setText(html, true);
			mailSender.send(messaggio);
		} catch (MessagingException e) {
			throw new MailPreparationException("Messaggio non valido", e);
		}
	}
}
