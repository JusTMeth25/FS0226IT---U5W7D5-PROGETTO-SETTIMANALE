package it.epicode.base.preferito;

import it.epicode.base.preferito.dto.NuovoPreferitoDto;
import it.epicode.base.preferito.dto.PreferitoDto;
import it.epicode.base.security.UtenteCorrente;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/preferiti")
public class PreferitoController {

	private final PreferitoService preferitoService;

	public PreferitoController(PreferitoService preferitoService) {
		this.preferitoService = preferitoService;
	}

	@GetMapping
	public List<PreferitoDto> elenco(@AuthenticationPrincipal UtenteCorrente utente) {
		return preferitoService.elenco(utente.id());
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public PreferitoDto aggiungi(@AuthenticationPrincipal UtenteCorrente utente,
								 @Valid @RequestBody NuovoPreferitoDto dto) {
		return preferitoService.aggiungi(utente.id(), dto);
	}

	/** Preferito di un altro utente: 404, come se non esistesse. */
	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void rimuovi(@AuthenticationPrincipal UtenteCorrente utente, @PathVariable Long id) {
		preferitoService.rimuovi(id, utente.id());
	}
}
