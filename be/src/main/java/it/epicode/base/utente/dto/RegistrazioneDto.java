package it.epicode.base.utente.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Solo questi tre campi: un "ruolo" o un "id" aggiunti al JSON vengono
 * ignorati perche' qui non c'e' dove metterli.
 */
public record RegistrazioneDto(
		@NotBlank @Email @Size(max = 254) String email,
		@NotBlank @Size(max = 80) String nome,
		@NotBlank @Size(min = 8, max = 72) String password) {
}
