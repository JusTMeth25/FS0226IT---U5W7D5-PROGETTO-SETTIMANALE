package it.epicode.base.auto;

import it.epicode.base.auto.dto.AutoAdminDto;
import it.epicode.base.auto.dto.ModificaAutoDto;
import it.epicode.base.auto.dto.NuovaAutoDto;
import it.epicode.base.auto.dto.PaginaDto;
import it.epicode.base.auto.dto.PrezzoDto;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

/**
 * Gestione auto dell'amministratore. Doppia protezione: la regola su
 * /api/admin/** in SecurityConfig e @PreAuthorize qui, cosi' spostare il
 * controller sotto un altro percorso non lo apre a tutti.
 */
@RestController
@RequestMapping("/api/admin/auto")
@PreAuthorize("hasRole('ADMIN')")
public class AdminAutoController {

	private final AutoService autoService;

	public AdminAutoController(AutoService autoService) {
		this.autoService = autoService;
	}

	@GetMapping
	public PaginaDto<AutoAdminDto> elenco(@RequestParam(required = false) String q,
										  @RequestParam(required = false) String sort,
										  @RequestParam(required = false) String dir,
										  @RequestParam(defaultValue = "0") int page,
										  @RequestParam(defaultValue = "20") int size) {
		return autoService.elencoAdmin(q, sort, dir, page, size);
	}

	@GetMapping("/{id}")
	public AutoAdminDto dettaglio(@PathVariable Long id) {
		return autoService.dettaglioAdmin(id);
	}

	@PostMapping
	@ResponseStatus(HttpStatus.CREATED)
	public AutoAdminDto crea(@Valid @RequestBody NuovaAutoDto dto) {
		return autoService.crea(dto);
	}

	@PutMapping("/{id}")
	public AutoAdminDto modifica(@PathVariable Long id, @Valid @RequestBody ModificaAutoDto dto) {
		return autoService.modifica(id, dto);
	}

	@PatchMapping("/{id}/prezzo")
	public AutoAdminDto cambiaPrezzo(@PathVariable Long id, @Valid @RequestBody PrezzoDto dto) {
		return autoService.cambiaPrezzo(id, dto.prezzo());
	}

	@DeleteMapping("/{id}")
	@ResponseStatus(HttpStatus.NO_CONTENT)
	public void elimina(@PathVariable Long id) {
		autoService.elimina(id);
	}
}
