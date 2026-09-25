package it.epicode.base.avviso.dto;

import it.epicode.base.auto.dto.AutoPubblicaDto;
import it.epicode.base.avviso.Avviso;

import java.math.BigDecimal;
import java.time.Instant;

/** Il token non esce mai da qui: viaggia solo nella mail. */
public record AvvisoDto(Long id, AutoPubblicaDto auto, BigDecimal soglia, boolean inviato, Instant creatoIl) {

	public static AvvisoDto da(Avviso a) {
		return new AvvisoDto(a.getId(), AutoPubblicaDto.da(a.getAuto()), a.getSoglia(), a.isInviato(),
				a.getCreatoIl());
	}
}
