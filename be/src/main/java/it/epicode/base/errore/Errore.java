package it.epicode.base.errore;

import java.time.Instant;
import java.util.Map;

/** Corpo di ogni risposta di errore: stessa forma per tutti gli endpoint. */
public record Errore(int stato, String messaggio, Map<String, String> campi, Instant ora) {

	public static Errore di(int stato, String messaggio) {
		return new Errore(stato, messaggio, Map.of(), Instant.now());
	}

	public static Errore di(int stato, String messaggio, Map<String, String> campi) {
		return new Errore(stato, messaggio, campi, Instant.now());
	}
}
