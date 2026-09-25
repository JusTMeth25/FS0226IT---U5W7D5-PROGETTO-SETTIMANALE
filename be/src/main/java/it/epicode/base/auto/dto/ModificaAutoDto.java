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

/**
 * Modifica dei dati dell'auto. Il prezzo di vendita non c'e' di proposito:
 * cambia solo da PATCH /prezzo, l'unico punto che controlla le soglie.
 */
public record ModificaAutoDto(
		@NotBlank @Size(max = 60) String marca,
		@NotBlank @Size(max = 80) String modello,
		@NotNull @Min(1900) @Max(2100) Integer anno,
		@Size(max = 5000) String descrizione,
		@DecimalMin("0.00") @Digits(integer = 10, fraction = 2) BigDecimal prezzoAcquisto,
		boolean pubblicata,
		@Size(max = 30) String carrozzeria,
		@Size(max = 20) String alimentazione,
		@Valid MediaDto media,
		@Valid PrestazioniDto prestazioni) {
}
