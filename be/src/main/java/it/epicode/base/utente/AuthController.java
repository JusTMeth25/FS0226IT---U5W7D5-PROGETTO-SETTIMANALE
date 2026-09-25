package it.epicode.base.utente;

import it.epicode.base.utente.dto.AccessoDto;
import it.epicode.base.utente.dto.LoginDto;
import it.epicode.base.utente.dto.RegistrazioneDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

	private final UtenteService utenteService;

	public AuthController(UtenteService utenteService) {
		this.utenteService = utenteService;
	}

	@PostMapping("/registrazione")
	@ResponseStatus(HttpStatus.CREATED)
	public AccessoDto registrazione(@Valid @RequestBody RegistrazioneDto dto) {
		return utenteService.registra(dto);
	}

	@PostMapping("/login")
	public AccessoDto login(@Valid @RequestBody LoginDto dto) {
		return utenteService.login(dto);
	}
}
