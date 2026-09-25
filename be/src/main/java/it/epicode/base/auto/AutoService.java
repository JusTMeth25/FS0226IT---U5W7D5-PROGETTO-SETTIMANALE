package it.epicode.base.auto;

import it.epicode.base.auto.dto.AutoAdminDto;
import it.epicode.base.auto.dto.AutoPubblicaDto;
import it.epicode.base.auto.dto.ModificaAutoDto;
import it.epicode.base.auto.dto.NuovaAutoDto;
import it.epicode.base.auto.dto.PaginaDto;
import it.epicode.base.avviso.AvvisoRepository;
import it.epicode.base.avviso.PrezzoScesoEvent;
import it.epicode.base.errore.NonTrovatoException;
import it.epicode.base.gara.TempoRepository;
import it.epicode.base.preferito.PreferitoRepository;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;

@Service
public class AutoService {

	private static final int DIMENSIONE_MASSIMA = 50;
	private static final int LUNGHEZZA_RICERCA_MASSIMA = 100;

	private final AutoRepository autoRepository;
	private final AvvisoRepository avvisoRepository;
	private final PreferitoRepository preferitoRepository;
	private final TempoRepository tempoRepository;
	private final ApplicationEventPublisher eventi;

	public AutoService(AutoRepository autoRepository, AvvisoRepository avvisoRepository,
					   PreferitoRepository preferitoRepository, TempoRepository tempoRepository,
					   ApplicationEventPublisher eventi) {
		this.autoRepository = autoRepository;
		this.avvisoRepository = avvisoRepository;
		this.preferitoRepository = preferitoRepository;
		this.tempoRepository = tempoRepository;
		this.eventi = eventi;
	}

	// ---------- Catalogo pubblico ----------

	@Transactional(readOnly = true)
	public PaginaDto<AutoPubblicaDto> catalogo(String q, String carrozzeria, String sort, String dir, int pagina,
											   int dimensione) {
		Pageable richiesta = pagina(sort, dir, pagina, dimensione);
		return PaginaDto.da(
				autoRepository.cercaPubblicate(modelloRicerca(q), Carrozzeria.filtro(carrozzeria), richiesta),
				AutoPubblicaDto::da);
	}

	/** Una bozza risponde 404 come un'auto che non esiste. */
	@Transactional(readOnly = true)
	public AutoPubblicaDto dettaglioPubblico(Long id) {
		return autoRepository.findByIdAndPubblicataTrue(id)
				.map(AutoPubblicaDto::da)
				.orElseThrow(() -> new NonTrovatoException("Auto non trovata"));
	}

	// ---------- Amministrazione ----------

	@Transactional(readOnly = true)
	public PaginaDto<AutoAdminDto> elencoAdmin(String q, String sort, String dir, int pagina, int dimensione) {
		Pageable richiesta = pagina(sort, dir, pagina, dimensione);
		return PaginaDto.da(autoRepository.cercaTutte(modelloRicerca(q), richiesta), AutoAdminDto::da);
	}

	@Transactional(readOnly = true)
	public AutoAdminDto dettaglioAdmin(Long id) {
		return AutoAdminDto.da(trova(id));
	}

	@Transactional
	public AutoAdminDto crea(NuovaAutoDto dto) {
		Auto auto = new Auto(dto.marca().trim(), dto.modello().trim(), dto.anno(), testoOpzionale(dto.descrizione()),
				dto.prezzo(), dto.prezzoAcquisto(), dto.pubblicata());
		auto.aggiornaScheda(testoOpzionale(dto.carrozzeria()), testoOpzionale(dto.alimentazione()),
				dto.media() == null ? null : dto.media().versoEntita());
		auto.aggiornaPrestazioni(dto.prestazioni() == null ? null : dto.prestazioni().versoEntita());
		return AutoAdminDto.da(autoRepository.save(auto));
	}

	@Transactional
	public AutoAdminDto modifica(Long id, ModificaAutoDto dto) {
		Auto auto = trova(id);
		auto.aggiorna(dto.marca().trim(), dto.modello().trim(), dto.anno(), testoOpzionale(dto.descrizione()),
				dto.prezzoAcquisto(), dto.pubblicata());
		auto.aggiornaScheda(testoOpzionale(dto.carrozzeria()), testoOpzionale(dto.alimentazione()),
				dto.media() == null ? null : dto.media().versoEntita());
		auto.aggiornaPrestazioni(dto.prestazioni() == null ? null : dto.prestazioni().versoEntita());
		return AutoAdminDto.da(auto);
	}

	@Transactional
	public void elimina(Long id) {
		Auto auto = trova(id);
		avvisoRepository.eliminaDiAuto(id);
		preferitoRepository.eliminaDiAuto(id);
		tempoRepository.eliminaDiAuto(id);
		autoRepository.delete(auto);
	}

	/**
	 * Unico punto in cui cambia il prezzo di vendita. Se il prezzo scende, cerca
	 * gli avvisi la cui soglia e' stata attraversata e pubblica un evento: la
	 * mail la manda AvvisoMailListener solo dopo il commit. Se questa
	 * transazione fallisce, l'evento non arriva a nessuno.
	 */
	@Transactional
	public AutoAdminDto cambiaPrezzo(Long id, BigDecimal nuovo) {
		Auto auto = autoRepository.perCambioPrezzo(id)
				.orElseThrow(() -> new NonTrovatoException("Auto non trovata"));
		BigDecimal vecchio = auto.getPrezzo();
		auto.setPrezzo(nuovo);

		// Le bozze non le vede nessuno: nessun avviso deve scattare su un'auto non pubblicata.
		if (auto.isPubblicata() && nuovo.compareTo(vecchio) < 0) {
			List<Long> scattati = avvisoRepository.attraversati(id, vecchio, nuovo);
			if (!scattati.isEmpty()) {
				eventi.publishEvent(new PrezzoScesoEvent(id, vecchio, scattati));
			}
		}
		return AutoAdminDto.da(auto);
	}

	// ---------- Supporto ----------

	private Auto trova(Long id) {
		return autoRepository.findById(id).orElseThrow(() -> new NonTrovatoException("Auto non trovata"));
	}

	private static Pageable pagina(String sort, String dir, int pagina, int dimensione) {
		int numero = Math.max(pagina, 0);
		int quante = Math.clamp(dimensione, 1, DIMENSIONE_MASSIMA);
		return PageRequest.of(numero, quante, OrdinamentoAuto.sort(sort, dir));
	}

	/**
	 * Testo di ricerca pronto per LIKE. I caratteri speciali di LIKE (% e _)
	 * scritti dall'utente vengono neutralizzati con il carattere di escape '!',
	 * cosi' "%" cerca un simbolo di percentuale e non "tutto".
	 */
	static String modelloRicerca(String q) {
		if (q == null || q.isBlank()) {
			return "%";
		}
		String pulito = q.trim().toLowerCase(Locale.ROOT);
		if (pulito.length() > LUNGHEZZA_RICERCA_MASSIMA) {
			pulito = pulito.substring(0, LUNGHEZZA_RICERCA_MASSIMA);
		}
		String escape = pulito.replace("!", "!!").replace("%", "!%").replace("_", "!_");
		return "%" + escape + "%";
	}

	private static String testoOpzionale(String testo) {
		return testo == null || testo.isBlank() ? null : testo.trim();
	}
}
