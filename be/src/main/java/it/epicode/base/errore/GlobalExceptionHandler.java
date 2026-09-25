package it.epicode.base.errore;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authorization.AuthorizationDeniedException;
import org.springframework.security.core.AuthenticationException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.resource.NoResourceFoundException;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Traduce le eccezioni in risposte JSON. I messaggi sono scritti qui o nelle
 * eccezioni applicative: mai il testo di un'eccezione di libreria, che puo'
 * contenere SQL, nomi di tabelle o dati dell'utente.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

	private static final Logger log = LoggerFactory.getLogger(GlobalExceptionHandler.class);

	@ExceptionHandler(NonTrovatoException.class)
	public ResponseEntity<Errore> nonTrovato(NonTrovatoException e) {
		return risposta(HttpStatus.NOT_FOUND, e.getMessage());
	}

	@ExceptionHandler(ConflittoException.class)
	public ResponseEntity<Errore> conflitto(ConflittoException e) {
		return risposta(HttpStatus.CONFLICT, e.getMessage());
	}

	@ExceptionHandler(RichiestaNonValidaException.class)
	public ResponseEntity<Errore> nonValida(RichiestaNonValidaException e) {
		return risposta(HttpStatus.BAD_REQUEST, e.getMessage());
	}

	@ExceptionHandler(MethodArgumentNotValidException.class)
	public ResponseEntity<Errore> validazione(MethodArgumentNotValidException e) {
		Map<String, String> campi = new LinkedHashMap<>();
		e.getBindingResult().getFieldErrors()
				.forEach(err -> campi.putIfAbsent(err.getField(), err.getDefaultMessage()));
		return ResponseEntity.badRequest().body(Errore.di(400, "Dati non validi", campi));
	}

	@ExceptionHandler({HttpMessageNotReadableException.class, MethodArgumentTypeMismatchException.class})
	public ResponseEntity<Errore> illeggibile(Exception e) {
		return risposta(HttpStatus.BAD_REQUEST, "Richiesta non leggibile");
	}

	@ExceptionHandler(DataIntegrityViolationException.class)
	public ResponseEntity<Errore> integrita(DataIntegrityViolationException e) {
		// Tipicamente due richieste parallele sullo stesso vincolo unique.
		return risposta(HttpStatus.CONFLICT, "Operazione in conflitto con dati esistenti");
	}

	@ExceptionHandler(AuthenticationException.class)
	public ResponseEntity<Errore> autenticazione(AuthenticationException e) {
		// Stesso messaggio per email inesistente e password sbagliata.
		return risposta(HttpStatus.UNAUTHORIZED, "Credenziali non valide");
	}

	@ExceptionHandler({AccessDeniedException.class, AuthorizationDeniedException.class})
	public ResponseEntity<Errore> negato(Exception e) {
		return risposta(HttpStatus.FORBIDDEN, "Accesso negato");
	}

	@ExceptionHandler(HttpRequestMethodNotSupportedException.class)
	public ResponseEntity<Errore> metodo(HttpRequestMethodNotSupportedException e) {
		return risposta(HttpStatus.METHOD_NOT_ALLOWED, "Metodo non supportato");
	}

	@ExceptionHandler(NoResourceFoundException.class)
	public ResponseEntity<Errore> risorsa(NoResourceFoundException e) {
		return risposta(HttpStatus.NOT_FOUND, "Risorsa non trovata");
	}

	@ExceptionHandler(Exception.class)
	public ResponseEntity<Errore> generico(Exception e) {
		// Solo il tipo nel log: il messaggio potrebbe contenere dati personali.
		log.error("Errore non gestito: {}", e.getClass().getName());
		return risposta(HttpStatus.INTERNAL_SERVER_ERROR, "Errore interno");
	}

	private static ResponseEntity<Errore> risposta(HttpStatus stato, String messaggio) {
		return ResponseEntity.status(stato).body(Errore.di(stato.value(), messaggio));
	}
}
