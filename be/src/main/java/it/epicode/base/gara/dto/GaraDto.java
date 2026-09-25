package it.epicode.base.gara.dto;

import it.epicode.base.gara.Tempo;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.Instant;

/** DTO della drag race, raccolti in un file: sono piccoli e vanno insieme. */
public final class GaraDto {

	private GaraDto() {
	}

	/** Solo auto e tempo: l'utente arriva dal JWT. */
	public record NuovoTempo(
			@NotNull @Positive Long autoId,
			@NotNull @Min(1000) @Max(120000) Integer millis) {
	}

	public record Esito(int millis, int record, boolean nuovoRecord, long posizione) {
	}

	/** In classifica compare solo il nome scelto dall'utente, mai l'email. */
	public record Riga(long posizione, String nome, Long autoId, String auto, int millis, Instant data) {

		public static Riga da(long posizione, Tempo t) {
			String nome = t.getUtente().getNome();
			return new Riga(posizione, nome.length() > 24 ? nome.substring(0, 24) + "…" : nome,
					t.getAuto().getId(), t.getAuto().getMarca() + " " + t.getAuto().getModello(),
					t.getMillis(), t.getRegistratoIl());
		}
	}
}
