package it.epicode.base.auto.dto;

import it.epicode.base.auto.Media;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Foto e modello 3D, in lettura e in scrittura (solo admin). Gli indirizzi
 * devono essere https, l'uid Sketchfab 32 caratteri esadecimali: niente
 * "javascript:" o pagine arbitrarie dentro un iframe.
 */
public record MediaDto(
		@Size(max = 500) @Pattern(regexp = "^https://\\S+$", message = "deve essere un indirizzo https") String fotoUrl,
		@Size(max = 200) String fotoAutore,
		@Size(max = 60) String fotoLicenza,
		@Size(max = 500) @Pattern(regexp = "^https://\\S+$", message = "deve essere un indirizzo https") String fotoFonte,
		@Pattern(regexp = "^[a-f0-9]{32}$", message = "uid Sketchfab non valido") String modello3dUid,
		@Size(max = 100) String modello3dAutore,
		@Size(max = 300) @Pattern(regexp = "^https://sketchfab\\.com/\\S+$", message = "deve essere un link sketchfab.com") String modello3dFonte) {

	public static MediaDto da(Media m) {
		return new MediaDto(m.getFotoUrl(), m.getFotoAutore(), m.getFotoLicenza(), m.getFotoFonte(),
				m.getModello3dUid(), m.getModello3dAutore(), m.getModello3dFonte());
	}

	public Media versoEntita() {
		return new Media(vuoto(fotoUrl), vuoto(fotoAutore), vuoto(fotoLicenza), vuoto(fotoFonte),
				vuoto(modello3dUid), vuoto(modello3dAutore), vuoto(modello3dFonte));
	}

	private static String vuoto(String s) {
		return s == null || s.isBlank() ? null : s.trim();
	}
}
