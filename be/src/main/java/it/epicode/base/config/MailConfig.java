package it.epicode.base.config;

import it.epicode.base.avviso.InvioMail;
import it.epicode.base.avviso.MailjetInvioMail;
import it.epicode.base.avviso.SmtpInvioMail;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.mail.javamail.JavaMailSender;

/**
 * Sceglie come spedire le mail:
 * - MAILJET_API_KEY e MAILJET_SECRET_KEY impostate: API HTTPS di Mailjet
 *   (il piano gratuito di Render blocca l'SMTP in uscita);
 * - altrimenti: Gmail via SMTP con MAIL_USERNAME / MAIL_PASSWORD.
 */
@Configuration
public class MailConfig {

	private static final Logger log = LoggerFactory.getLogger(MailConfig.class);

	@Bean
	public InvioMail invioMail(JavaMailSender mailSender,
							   @Value("${app.mail.mailjet-api-key:}") String mailjetApiKey,
							   @Value("${app.mail.mailjet-secret-key:}") String mailjetSecretKey,
							   @Value("${app.mail.mittente:}") String mittente) {
		if (!mailjetApiKey.isBlank() && !mailjetSecretKey.isBlank()) {
			log.info("Mail degli avvisi: API Mailjet");
			return new MailjetInvioMail(mailjetApiKey.trim(), mailjetSecretKey.trim(), mittente);
		}
		log.info("Mail degli avvisi: SMTP");
		return new SmtpInvioMail(mailSender, mittente);
	}
}
