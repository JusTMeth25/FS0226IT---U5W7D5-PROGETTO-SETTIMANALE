package it.epicode.base.auto;

import it.epicode.base.auto.dto.AutoPubblicaDto;
import it.epicode.base.auto.dto.PaginaDto;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/** Catalogo pubblico: solo auto pubblicate, senza prezzo d'acquisto. */
@RestController
@RequestMapping("/api/auto")
public class AutoController {

	private final AutoService autoService;

	public AutoController(AutoService autoService) {
		this.autoService = autoService;
	}

	/** Es. /api/auto?q=panda&sort=prezzo&dir=asc&page=0&size=12 */
	@GetMapping
	public PaginaDto<AutoPubblicaDto> catalogo(@RequestParam(required = false) String q,
											   @RequestParam(required = false) String sort,
											   @RequestParam(required = false) String dir,
											   @RequestParam(defaultValue = "0") int page,
											   @RequestParam(defaultValue = "12") int size) {
		return autoService.catalogo(q, sort, dir, page, size);
	}

	@GetMapping("/{id}")
	public AutoPubblicaDto dettaglio(@PathVariable Long id) {
		return autoService.dettaglioPubblico(id);
	}
}
