package it.epicode.base.preferito;

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

@Entity
@Table(name = "preferiti", uniqueConstraints = @UniqueConstraint(columnNames = {"utente_id", "auto_id"}))
public class Preferito {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "utente_id", nullable = false)
	private Utente utente;

	@ManyToOne(fetch = FetchType.LAZY, optional = false)
	@JoinColumn(name = "auto_id", nullable = false)
	private Auto auto;

	@Column(name = "creato_il", nullable = false, updatable = false)
	private Instant creatoIl;

	protected Preferito() {
	}

	public Preferito(Utente utente, Auto auto) {
		this.utente = utente;
		this.auto = auto;
		this.creatoIl = Instant.now();
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

	public Instant getCreatoIl() {
		return creatoIl;
	}
}
