package it.epicode.base.gara;

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

import java.time.Instant;

/** Miglior tempo di un utente con un'auto: una riga per coppia, si tiene il record. */
@Entity
@Table(name = "tempi", uniqueConstraints = @UniqueConstraint(columnNames = {"utente_id", "auto_id"}))
public class Tempo {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "utente_id", nullable = false)
	private Utente utente;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "auto_id", nullable = false)
	private Auto auto;

	@Column(nullable = false)
	private int millis;

	@Column(name = "registrato_il", nullable = false)
	private Instant registratoIl;

	protected Tempo() {
	}

	public Tempo(Utente utente, Auto auto, int millis) {
		this.utente = utente;
		this.auto = auto;
		this.millis = millis;
		this.registratoIl = Instant.now();
	}

	/** true se il nuovo tempo e' un record personale. */
	public boolean migliora(int nuovo) {
		if (nuovo >= millis) {
			return false;
		}
		millis = nuovo;
		registratoIl = Instant.now();
		return true;
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

	public int getMillis() {
		return millis;
	}

	public Instant getRegistratoIl() {
		return registratoIl;
	}
}
