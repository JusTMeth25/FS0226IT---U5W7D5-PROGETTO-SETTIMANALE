package it.epicode.base.avviso.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;

/**
 * Solo auto e soglia. "inviato", "utenteId" o "token" aggiunti al JSON non
 * hanno dove finire: l'utente arriva dal JWT, il resto lo decide il server.
 */
public record NuovoAvvisoDto(
		@NotNull @Positive Long autoId,
		@NotNull @DecimalMin("0.01") @Digits(integer = 10, fraction = 2) BigDecimal soglia) {
}
