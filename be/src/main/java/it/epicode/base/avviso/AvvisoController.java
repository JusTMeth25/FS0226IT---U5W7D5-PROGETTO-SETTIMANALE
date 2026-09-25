package it.epicode.base.avviso;

import it.epicode.base.avviso.dto.AvvisoDto;
import it.epicode.base.avviso.dto.DisattivaDto;
import it.epicode.base.avviso.dto.NuovoAvvisoDto;
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
@RequestMapping("/api/avvisi")
public class AvvisoController {

	private final AvvisoService avvisoService;

	public AvvisoController(AvvisoService avvisoService) {
		this.avvisoService = avvisoService;
	}

	@GetMapping
	public List<AvvisoDto> elenco(@AuthenticationPrincipal UtenteCorrente utente) {
		return avvisoService.elenco(utente.id());
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public AvvisoDto crea(@AuthenticationPrincipal UtenteCorrente utente, @Valid @RequestBody NuovoAvvisoDto dto) {
		return avvisoService.crea(utente.id(), dto);
	}

	/** Avviso di un altro utente: 404, come se non esistesse. */
	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void elimina(@AuthenticationPrincipal UtenteCorrente utente, @PathVariable Long id) {
		avvisoService.elimina(id, utente.id());
	}

	/** Pubblico: chi apre il link della mail puo' non aver fatto l'accesso. */
	@PostMapping("/disattiva")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void disattiva(@Valid @RequestBody DisattivaDto dto) {
		avvisoService.disattiva(dto.token());
	}
}
