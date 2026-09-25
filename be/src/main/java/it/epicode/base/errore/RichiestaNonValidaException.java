package it.epicode.base.errore;

/** Parametro fuori dai valori ammessi (es. campo di ordinamento): diventa 400. */
public class RichiestaNonValidaException extends RuntimeException {

	public RichiestaNonValidaException(String messaggio) {
		super(messaggio);
	}
}
