package it.epicode.base.preferito.dto;

import it.epicode.base.auto.dto.AutoPubblicaDto;
import it.epicode.base.preferito.Preferito;

import java.time.Instant;

public record PreferitoDto(Long id, AutoPubblicaDto auto, Instant creatoIl) {

	public static PreferitoDto da(Preferito p) {
		return new PreferitoDto(p.getId(), AutoPubblicaDto.da(p.getAuto()), p.getCreatoIl());
	}
}
