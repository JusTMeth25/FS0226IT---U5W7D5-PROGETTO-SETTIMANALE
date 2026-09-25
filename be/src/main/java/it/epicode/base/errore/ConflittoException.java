package it.epicode.base.errore;

/** Richiesta valida ma in conflitto con lo stato attuale: diventa 409. */
public class ConflittoException extends RuntimeException {

	public ConflittoException(String messaggio) {
		super(messaggio);
	}
}
