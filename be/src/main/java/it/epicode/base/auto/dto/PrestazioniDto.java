package it.epicode.base.auto.dto;

import it.epicode.base.auto.Prestazioni;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/** Limiti larghi ma realistici: da una citycar elettrica a un'hypercar. */
public record PrestazioniDto(
		@Size(max = 80) String versione,
		@Min(30) @Max(2000) Integer cv,
		@DecimalMin("1.5") @DecimalMax("30.0") BigDecimal zeroCento,
		@Min(80) @Max(500) Integer velocitaMax,
		@Min(500) @Max(4000) Integer pesoKg) {

	public static PrestazioniDto da(Prestazioni p) {
		return new PrestazioniDto(p.getVersione(), p.getCv(), p.getZeroCento(), p.getVelocitaMax(), p.getPesoKg());
	}

	public Prestazioni versoEntita() {
		String v = versione == null || versione.isBlank() ? null : versione.trim();
		return new Prestazioni(v, cv, zeroCento, velocitaMax, pesoKg);
	}
}
