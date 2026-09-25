package it.epicode.base.avviso;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import org.springframework.http.MediaType;
import org.springframework.http.client.JdkClientHttpRequestFactory;
import org.springframework.web.client.RestClient;

import java.net.http.HttpClient;
import java.time.Duration;
import java.util.List;
import java.util.Map;

/**
 * Invio tramite l'API Send v3.1 di Mailjet, su HTTPS (porta 443): funziona
 * anche dove le porte SMTP sono chiuse, come sul piano gratuito di Render.
 * Chiavi da MAILJET_API_KEY / MAILJET_SECRET_KEY, mai scritte nei log.
 */
public class MailjetInvioMail implements InvioMail {

	private static final String URL = "https://api.mailjet.com/v3.1/send";

	@JsonIgnoreProperties(ignoreUnknown = true)
	record Esito(String Status) {
	}

	@JsonIgnoreProperties(ignoreUnknown = true)
	record Risposta(List<Esito> Messages) {
	}

	private final RestClient client;
	private final String mittente;

	public MailjetInvioMail(String apiKey, String secretKey, String mittente) {
		JdkClientHttpRequestFactory fabbrica = new JdkClientHttpRequestFactory(
				HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build());
		fabbrica.setReadTimeout(Duration.ofSeconds(10));
		this.client = RestClient.builder()
				.requestFactory(fabbrica)
				.defaultHeaders(h -> h.setBasicAuth(apiKey, secretKey))
				.build();
		this.mittente = mittente;
	}

	@Override
	public void invia(String destinatario, String nome, String oggetto, String html) {
		Map<String, Object> messaggio = Map.of(
				"From", Map.of("Email", mittente, "Name", "Vetrina · Salone auto"),
				"To", List.of(Map.of("Email", destinatario, "Name", nome)),
				"Subject", oggetto,
				"HTMLPart", html);
		// 4xx/5xx diventano RestClientException; in piu' si controlla lo Status del messaggio.
		Risposta r = client.post()
				.uri(URL)
				.contentType(MediaType.APPLICATION_JSON)
				.accept(MediaType.APPLICATION_JSON)
				.body(Map.of("Messages", List.of(messaggio)))
				.retrieve()
				.body(Risposta.class);
		if (r == null || r.Messages() == null || r.Messages().isEmpty()
				|| !"success".equalsIgnoreCase(r.Messages().getFirst().Status())) {
			throw new IllegalStateException("Mailjet non ha accettato il messaggio");
		}
	}
}
