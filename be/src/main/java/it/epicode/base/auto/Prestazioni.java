package it.epicode.base.auto;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;

import java.math.BigDecimal;

/**
 * Dati tecnici reali della versione di riferimento (quella indicata in
 * "versione"). Servono alla scheda e alla fisica della drag race.
 */
@Embeddable
public class Prestazioni {

	@Column(name = "versione", length = 80)
	private String versione;

	@Column(name = "cv")
	private Integer cv;

	@Column(name = "zero_cento", precision = 4, scale = 1)
	private BigDecimal zeroCento;

	@Column(name = "velocita_max")
	private Integer velocitaMax;

	@Column(name = "peso_kg")
	private Integer pesoKg;

	public Prestazioni() {
	}

	public Prestazioni(String versione, Integer cv, BigDecimal zeroCento, Integer velocitaMax, Integer pesoKg) {
		this.versione = versione;
		this.cv = cv;
		this.zeroCento = zeroCento;
		this.velocitaMax = velocitaMax;
		this.pesoKg = pesoKg;
	}

	/** Servono almeno 0-100 e velocita' massima per poter gareggiare. */
	public boolean complete() {
		return zeroCento != null && velocitaMax != null;
	}

	public String getVersione() {
		return versione;
	}

	public Integer getCv() {
		return cv;
	}

	public BigDecimal getZeroCento() {
		return zeroCento;
	}

	public Integer getVelocitaMax() {
		return velocitaMax;
	}

	public Integer getPesoKg() {
		return pesoKg;
	}
}
