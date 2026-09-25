package it.epicode.base.utente;

import it.epicode.base.security.UtenteCorrente;
import it.epicode.base.utente.dto.ProfiloDto;
import it.epicode.base.utente.dto.UtenteDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/** Sempre e solo il profilo di chi fa la richiesta: l'id arriva dal JWT. */
@RestController
@RequestMapping("/api/profilo")
public class ProfiloController {

	private final UtenteService utenteService;

	public ProfiloController(UtenteService utenteService) {
		this.utenteService = utenteService;
	}

	@GetMapping
	public UtenteDto profilo(@AuthenticationPrincipal UtenteCorrente utente) {
		return utenteService.profilo(utente.id());
	}

	@PutMapping
	public UtenteDto aggiorna(@AuthenticationPrincipal UtenteCorrente utente, @Valid @RequestBody ProfiloDto dto) {
		return utenteService.aggiornaProfilo(utente.id(), dto);
	}

	@DeleteMapping
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void elimina(@AuthenticationPrincipal UtenteCorrente utente) {
		utenteService.elimina(utente.id());
	}
}
