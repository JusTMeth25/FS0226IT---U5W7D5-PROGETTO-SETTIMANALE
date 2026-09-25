package it.epicode.base.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import it.epicode.base.utente.Ruolo;
import it.epicode.base.utente.Utente;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.Instant;
import java.util.Date;
import java.util.Optional;

/**
 * Firma e verifica i token. Nel token ci sono solo id e ruolo: niente email
 * ne' nome, che il client puo' chiedere a /api/profilo.
 */
@Service
public class JwtService {

	private static final String CLAIM_RUOLO = "ruolo";

	private final SecretKey chiave;
	private final Duration durata;

	public JwtService(@Value("${app.jwt.secret}") String segreto,
					  @Value("${app.jwt.scadenza-ore}") long ore) {
		byte[] byteSegreto = segreto.getBytes(StandardCharsets.UTF_8);
		if (byteSegreto.length < 32) {
			// HS256 richiede almeno 256 bit: meglio non partire che firmare con una chiave debole.
			throw new IllegalStateException("JWT_SECRET deve essere lungo almeno 32 caratteri");
		}
		this.chiave = Keys.hmacShaKeyFor(byteSegreto);
		this.durata = Duration.ofHours(ore);
	}

	public String genera(Utente utente) {
		Instant adesso = Instant.now();
		return Jwts.builder()
				.subject(String.valueOf(utente.getId()))
				.claim(CLAIM_RUOLO, utente.getRuolo().name())
				.issuedAt(Date.from(adesso))
				.expiration(Date.from(adesso.plus(durata)))
				.signWith(chiave)
				.compact();
	}

	/** Token scaduto, alterato o malformato: Optional vuoto, mai un'eccezione. */
	public Optional<UtenteCorrente> verifica(String token) {
		try {
			Claims claims = Jwts.parser().verifyWith(chiave).build().parseSignedClaims(token).getPayload();
			Long id = Long.valueOf(claims.getSubject());
			Ruolo ruolo = Ruolo.valueOf(claims.get(CLAIM_RUOLO, String.class));
			return Optional.of(new UtenteCorrente(id, ruolo));
		} catch (JwtException | IllegalArgumentException e) {
			return Optional.empty();
		}
	}
}
