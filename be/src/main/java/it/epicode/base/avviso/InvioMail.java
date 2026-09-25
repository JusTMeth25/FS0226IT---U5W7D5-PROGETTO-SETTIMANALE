package it.epicode.base.avviso;

/**
 * Consegna una mail HTML. Due implementazioni:
 * - SmtpInvioMail: Gmail via SMTP (in locale);
 * - MailjetInvioMail: API HTTPS di Mailjet (su Render, dove il piano gratuito
 *   blocca le porte SMTP in uscita).
 * La scelta la fa MailConfig in base alle chiavi Mailjet.
 *
 * Un errore di consegna esce come RuntimeException: chi chiama la registra
 * nel log senza dati personali.
 */
public interface InvioMail {

	void invia(String destinatario, String nome, String oggetto, String html);
}
