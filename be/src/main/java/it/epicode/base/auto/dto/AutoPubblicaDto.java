package it.epicode.base.auto.dto;

import it.epicode.base.auto.Auto;

import java.math.BigDecimal;

/** Quello che vede chiunque: niente prezzo d'acquisto, niente stato di bozza. */
public record AutoPubblicaDto(Long id, String marca, String modello, int anno, String descrizione,
							  BigDecimal prezzo, String carrozzeria, String alimentazione, MediaDto media) {

	public static AutoPubblicaDto da(Auto a) {
		return new AutoPubblicaDto(a.getId(), a.getMarca(), a.getModello(), a.getAnno(), a.getDescrizione(),
				a.getPrezzo(), a.getCarrozzeria(), a.getAlimentazione(), MediaDto.da(a.getMedia()));
	}
}
