package it.epicode.base.preferito;

import it.epicode.base.auto.Auto;
import it.epicode.base.auto.AutoRepository;
import it.epicode.base.errore.ConflittoException;
import it.epicode.base.errore.NonTrovatoException;
import it.epicode.base.preferito.dto.NuovoPreferitoDto;
import it.epicode.base.preferito.dto.PreferitoDto;
import it.epicode.base.utente.Utente;
import it.epicode.base.utente.UtenteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class PreferitoService {

	private final PreferitoRepository preferitoRepository;
	private final AutoRepository autoRepository;
	private final UtenteRepository utenteRepository;

	public PreferitoService(PreferitoRepository preferitoRepository, AutoRepository autoRepository,
							UtenteRepository utenteRepository) {
		this.preferitoRepository = preferitoRepository;
		this.autoRepository = autoRepository;
		this.utenteRepository = utenteRepository;
	}

	@Transactional(readOnly = true)
	public List<PreferitoDto> elenco(Long utenteId) {
		return preferitoRepository.elencoDi(utenteId).stream().map(PreferitoDto::da).toList();
	}

	@Transactional
	public PreferitoDto aggiungi(Long utenteId, NuovoPreferitoDto dto) {
		Utente utente = utenteRepository.findById(utenteId)
				.orElseThrow(() -> new NonTrovatoException("Utente non trovato"));
		// Una bozza non si puo' aggiungere: per l'utente non esiste.
		Auto auto = autoRepository.findByIdAndPubblicataTrue(dto.autoId())
				.orElseThrow(() -> new NonTrovatoException("Auto non trovata"));
		if (preferitoRepository.existsByUtenteIdAndAutoId(utenteId, auto.getId())) {
			throw new ConflittoException("Auto gia' tra i preferiti");
		}
		return PreferitoDto.da(preferitoRepository.save(new Preferito(utente, auto)));
	}

	@Transactional
	public void rimuovi(Long id, Long utenteId) {
		Preferito preferito = preferitoRepository.findByIdAndUtenteId(id, utenteId)
				.orElseThrow(() -> new NonTrovatoException("Preferito non trovato"));
		preferitoRepository.delete(preferito);
	}
}
