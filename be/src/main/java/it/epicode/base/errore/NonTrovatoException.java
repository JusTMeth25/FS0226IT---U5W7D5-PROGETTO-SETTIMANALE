package it.epicode.base.errore;

/**
 * Risorsa assente, oppure presente ma di un altro utente: per il client le due
 * cose devono essere indistinguibili, quindi entrambe diventano 404.
 */
public class NonTrovatoException extends RuntimeException {

	public NonTrovatoException(String messaggio) {
		super(messaggio);
	}
}
