package it.epicode.base.gara;

import it.epicode.base.gara.dto.GaraDto;
import it.epicode.base.security.UtenteCorrente;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/gara")
public class GaraController {

	private final GaraService garaService;

	public GaraController(GaraService garaService) {
		this.garaService = garaService;
	}

	/** Pubblica: classifica di un'auto (?autoId=) o generale. */
	@GetMapping("/classifica")
	public List<GaraDto.Riga> classifica(@RequestParam(required = false) Long autoId) {
		return garaService.classifica(autoId);
	}

	@GetMapping("/miei")
	public List<GaraDto.Riga> miei(@AuthenticationPrincipal UtenteCorrente utente) {
		return garaService.miei(utente.id());
	}

	@PostMapping("/tempi")
	public GaraDto.Esito registra(@AuthenticationPrincipal UtenteCorrente utente,
								  @Valid @RequestBody GaraDto.NuovoTempo dto) {
		return garaService.registra(utente.id(), dto);
	}
}
