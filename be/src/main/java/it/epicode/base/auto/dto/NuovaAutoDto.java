package it.epicode.base.auto.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

/** Creazione di un'auto: qui il prezzo di vendita c'e', non ci sono ancora avvisi da far scattare. */
public record NuovaAutoDto(
		@NotBlank @Size(max = 60) String marca,
		@NotBlank @Size(max = 80) String modello,
		@NotNull @Min(1900) @Max(2100) Integer anno,
		@Size(max = 5000) String descrizione,
		@NotNull @DecimalMin("0.01") @Digits(integer = 10, fraction = 2) BigDecimal prezzo,
		@DecimalMin("0.00") @Digits(integer = 10, fraction = 2) BigDecimal prezzoAcquisto,
		boolean pubblicata,
		@Size(max = 30) String carrozzeria,
		@Size(max = 20) String alimentazione,
		@Valid MediaDto media) {
}
