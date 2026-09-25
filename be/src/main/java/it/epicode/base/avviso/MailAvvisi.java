package it.epicode.base.avviso;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.util.HtmlUtils;
import org.springframework.web.util.UriComponentsBuilder;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.util.Locale;

/**
 * Template della mail. Ogni valore che arriva da un utente (nome, marca,
 * modello) passa da HtmlUtils.htmlEscape: un nome come "<script>" arriva nella
 * casella come testo, non come codice.
 */
@Component
public class MailAvvisi {

	private final String frontendUrl;

	public MailAvvisi(@Value("${app.frontend-url}") String frontendUrl) {
		this.frontendUrl = frontendUrl.replaceAll("/+$", "");
	}

	public String oggetto(DatiMail d) {
		// L'oggetto e' testo semplice, non HTML: niente escape, ma niente a capo.
		return "Prezzo sceso: " + (d.marca() + " " + d.modello()).replaceAll("[\\r\\n]", " ");
	}

	public String corpoHtml(DatiMail d) {
		String link = UriComponentsBuilder.fromUriString(frontendUrl)
				.path("/avvisi/disattiva")
				.queryParam("token", d.token())
				.encode()
				.toUriString();

		return """
				<!doctype html>
				<html lang="it">
				<body style="font-family: Arial, sans-serif; color: #0f172a;">
				  <p>Ciao %s,</p>
				  <p>il prezzo di <strong>%s %s</strong> e' sceso a <strong>%s</strong>,
				     sotto la soglia di %s che avevi impostato.</p>
				  <p>Questo avviso non ti scrivera' piu'.</p>
				  <p style="font-size: 12px; color: #64748b;">
				    Non vuoi piu' ricevere avvisi per questa auto?
				    <a href="%s">Disattiva l'avviso</a>.
				  </p>
				</body>
				</html>
				""".formatted(
				esc(d.nome()),
				esc(d.marca()),
				esc(d.modello()),
				esc(euro(d.prezzo())),
				esc(euro(d.soglia())),
				esc(link));
	}

	private static String esc(String valore) {
		return HtmlUtils.htmlEscape(valore == null ? "" : valore);
	}

	private static String euro(BigDecimal valore) {
		return NumberFormat.getCurrencyInstance(Locale.ITALY).format(valore);
	}
}
