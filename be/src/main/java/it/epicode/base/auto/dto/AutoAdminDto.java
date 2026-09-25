package it.epicode.base.auto.dto;

import it.epicode.base.auto.Auto;

import java.math.BigDecimal;
import java.time.Instant;

/** Vista dell'amministratore: tutti i campi, bozze comprese. */
public record AutoAdminDto(Long id, String marca, String modello, int anno, String descrizione,
						   BigDecimal prezzo, BigDecimal prezzoAcquisto, boolean pubblicata,
						   String carrozzeria, String alimentazione, MediaDto media,
						   Instant creataIl, Instant aggiornataIl) {

	public static AutoAdminDto da(Auto a) {
		return new AutoAdminDto(a.getId(), a.getMarca(), a.getModello(), a.getAnno(), a.getDescrizione(),
				a.getPrezzo(), a.getPrezzoAcquisto(), a.isPubblicata(), a.getCarrozzeria(), a.getAlimentazione(),
				MediaDto.da(a.getMedia()), a.getCreataIl(), a.getAggiornataIl());
	}
}
