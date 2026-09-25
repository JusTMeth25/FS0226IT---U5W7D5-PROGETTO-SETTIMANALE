package it.epicode.base.auto;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(name = "auto")
public class Auto {

	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;

	@Column(nullable = false, length = 60)
	private String marca;

	@Column(nullable = false, length = 80)
	private String modello;

	@Column(nullable = false)
	private int anno;

	/** Testo semplice: il FE lo mostra come testo, mai come HTML. */
	@Column(columnDefinition = "TEXT")
	private String descrizione;

	/** Prezzo di vendita, visibile a tutti. Cambia solo da AutoService.cambiaPrezzo. */
	@Column(nullable = false, precision = 12, scale = 2)
	private BigDecimal prezzo;

	/** Prezzo pagato dal salone: solo l'amministratore lo vede. */
	@Column(name = "prezzo_acquisto", precision = 12, scale = 2)
	private BigDecimal prezzoAcquisto;

	/** false = bozza, visibile solo all'amministratore. */
	@Column(nullable = false)
	private boolean pubblicata;

	@Column(name = "creata_il", nullable = false, updatable = false)
	private Instant creataIl;

	@Column(name = "aggiornata_il", nullable = false)
	private Instant aggiornataIl;

	protected Auto() {
	}

	public Auto(String marca, String modello, int anno, String descrizione, BigDecimal prezzo,
				BigDecimal prezzoAcquisto, boolean pubblicata) {
		this.marca = marca;
		this.modello = modello;
		this.anno = anno;
		this.descrizione = descrizione;
		this.prezzo = prezzo;
		this.prezzoAcquisto = prezzoAcquisto;
		this.pubblicata = pubblicata;
	}

	@PrePersist
	void primaDelSalvataggio() {
		creataIl = Instant.now();
		aggiornataIl = creataIl;
	}

	@PreUpdate
	void primaDellAggiornamento() {
		aggiornataIl = Instant.now();
	}

	/** Tutto tranne il prezzo di vendita, che passa da cambiaPrezzo per far scattare gli avvisi. */
	public void aggiorna(String marca, String modello, int anno, String descrizione,
						 BigDecimal prezzoAcquisto, boolean pubblicata) {
		this.marca = marca;
		this.modello = modello;
		this.anno = anno;
		this.descrizione = descrizione;
		this.prezzoAcquisto = prezzoAcquisto;
		this.pubblicata = pubblicata;
	}

	void setPrezzo(BigDecimal prezzo) {
		this.prezzo = prezzo;
	}

	public Long getId() {
		return id;
	}

	public String getMarca() {
		return marca;
	}

	public String getModello() {
		return modello;
	}

	public int getAnno() {
		return anno;
	}

	public String getDescrizione() {
		return descrizione;
	}

	public BigDecimal getPrezzo() {
		return prezzo;
	}

	public BigDecimal getPrezzoAcquisto() {
		return prezzoAcquisto;
	}

	public boolean isPubblicata() {
		return pubblicata;
	}

	public Instant getCreataIl() {
		return creataIl;
	}

	public Instant getAggiornataIl() {
		return aggiornataIl;
	}
}
