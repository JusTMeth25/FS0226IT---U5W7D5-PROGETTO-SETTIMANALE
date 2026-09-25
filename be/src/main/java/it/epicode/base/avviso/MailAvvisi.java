package it.epicode.base.avviso;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.NumberFormat;
import java.util.Locale;

/**
 * Mail dell'avviso, dal template Thymeleaf templates/mail/prezzo-sceso.html.
 * Nel template ogni valore passa da th:text / th:href, che fanno l'escape:
 * un nome come "<script>" arriva nella casella come testo, non come codice.
 */
@Component
public class MailAvvisi {

	private static final Locale ITALIA = Locale.ITALY;

	private final TemplateEngine motore;
	private final String frontendUrl;

	public MailAvvisi(TemplateEngine motore, @Value("${app.frontend-url}") String frontendUrl) {
		this.motore = motore;
		this.frontendUrl = frontendUrl.replaceAll("/+$", "");
	}

	public String oggetto(DatiMail d) {
		// L'oggetto e' testo semplice, non HTML: niente escape, ma niente a capo.
		String auto = (d.marca() + " " + d.modello()).replaceAll("[\\r\\n]", " ");
		Integer sconto = sconto(d);
		return sconto != null && sconto > 0
				? "-" + sconto + "% su " + auto + ": ora " + euro(d.prezzo())
				: "Prezzo sceso: " + auto;
	}

	public String corpoHtml(DatiMail d) {
		Context c = new Context(ITALIA);
		c.setVariable("nome", d.nome());
		c.setVariable("marca", d.marca());
		c.setVariable("modello", d.modello());
		c.setVariable("prezzo", euro(d.prezzo()));
		c.setVariable("prezzoPrecedente", d.prezzoPrecedente() == null ? null : euro(d.prezzoPrecedente()));
		c.setVariable("sconto", sconto(d));
		c.setVariable("risparmio", d.prezzoPrecedente() == null ? null : euro(d.prezzoPrecedente().subtract(d.prezzo())));
		c.setVariable("soglia", euro(d.soglia()));
		c.setVariable("cv", d.cv());
		c.setVariable("zeroCento", d.zeroCento() == null ? null : d.zeroCento().toPlainString().replace('.', ','));
		// solo foto https (vengono da Wikimedia); versione da 960 px, leggera per la posta
		c.setVariable("foto", d.fotoUrl() != null && d.fotoUrl().startsWith("https://")
				? d.fotoUrl().replace("/1280px-", "/960px-") : null);
		c.setVariable("linkAuto", link("/auto/" + d.autoId()));
		c.setVariable("linkDisattiva", UriComponentsBuilder.fromUriString(frontendUrl)
				.path("/avvisi/disattiva").queryParam("token", d.token()).encode().toUriString());
		c.setVariable("linkAvvisi", link("/avvisi"));
		return motore.process("mail/prezzo-sceso", c);
	}

	private String link(String percorso) {
		return frontendUrl + percorso;
	}

	private static Integer sconto(DatiMail d) {
		if (d.prezzoPrecedente() == null || d.prezzoPrecedente().signum() <= 0) {
			return null;
		}
		return BigDecimal.ONE.subtract(d.prezzo().divide(d.prezzoPrecedente(), 4, RoundingMode.HALF_UP))
				.movePointRight(2).setScale(0, RoundingMode.HALF_UP).intValue();
	}

	private static String euro(BigDecimal valore) {
		NumberFormat f = NumberFormat.getCurrencyInstance(ITALIA);
		f.setMaximumFractionDigits(0);
		return f.format(valore);
	}
}
