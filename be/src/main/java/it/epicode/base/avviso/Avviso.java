package it.epicode.base.avviso;

import it.epicode.base.auto.Auto;
import it.epicode.base.utente.Utente;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.Instant;
import java.util.Base64;

/**
 * Lega un utente a un'auto con una soglia di prezzo. "inviato" diventa true
 * una volta sola, con un UPDATE condizionato: da li' l'avviso non manda piu'
 * mail, anche se il prezzo risale e riscende.
 */
@Entity
@Table(name = "avvisi", uniqueConstraints = @UniqueConstraint(columnNames = {"utente_id", "auto_id"}))
public class Avviso {

	private static final SecureRandom CASO = new SecureRandom();

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "utente_id", nullable = false)
	private Utente utente;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "auto_id", nullable = false)
	private Auto auto;

	@Column(nullable = false, precision = 12, scale = 2)
	private BigDecimal soglia;

	@Column(nullable = false)
	private boolean inviato;

	/** Casuale e monouso: va nel link "disattiva" della mail al posto dell'id. */
	@Column(nullable = false, unique = true, length = 64)
	private String token;

	@Column(name = "creato_il", nullable = false, updatable = false)
	private Instant creatoIl;

	protected Avviso() {
	}

	public Avviso(Utente utente, Auto auto, BigDecimal soglia) {
		this.utente = utente;
		this.auto = auto;
		this.soglia = soglia;
		this.inviato = false;
		this.token = nuovoToken();
		this.creatoIl = Instant.now();
	}

	private static String nuovoToken() {
		byte[] b = new byte[32];
		CASO.nextBytes(b);
		return Base64.getUrlEncoder().withoutPadding().encodeToString(b);
	}

	public Long getId() {
		return id;
	}

	public Utente getUtente() {
		return utente;
	}

	public Auto getAuto() {
		return auto;
	}

	public BigDecimal getSoglia() {
		return soglia;
	}

	public boolean isInviato() {
		return inviato;
	}

	public String getToken() {
		return token;
	}

	public Instant getCreatoIl() {
		return creatoIl;
	}
}
