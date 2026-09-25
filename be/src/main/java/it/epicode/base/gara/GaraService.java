package it.epicode.base.gara;

import it.epicode.base.auto.Auto;
import it.epicode.base.auto.AutoRepository;
import it.epicode.base.auto.Prestazioni;
import it.epicode.base.errore.NonTrovatoException;
import it.epicode.base.errore.RichiestaNonValidaException;
import it.epicode.base.gara.dto.GaraDto;
import it.epicode.base.utente.Utente;
import it.epicode.base.utente.UtenteRepository;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class GaraService {

	/** Margine per gli arrotondamenti tra JavaScript e Java. */
	private static final int TOLLERANZA_MS = 30;

	private final TempoRepository tempoRepository;
	private final AutoRepository autoRepository;
	private final UtenteRepository utenteRepository;

	public GaraService(TempoRepository tempoRepository, AutoRepository autoRepository,
					   UtenteRepository utenteRepository) {
		this.tempoRepository = tempoRepository;
		this.autoRepository = autoRepository;
		this.utenteRepository = utenteRepository;
	}

	/**
	 * Registra un tempo. Il server rifà i conti: con le prestazioni reali di
	 * quell'auto calcola il tempo minimo possibile con guida perfetta. Un
	 * tempo piu' basso non puo' venire dal gioco, quindi si rifiuta.
	 */
	@Transactional
	public GaraDto.Esito registra(Long utenteId, GaraDto.NuovoTempo dto) {
		Utente utente = utenteRepository.findById(utenteId)
				.orElseThrow(() -> new NonTrovatoException("Utente non trovato"));
		Auto auto = autoRepository.findByIdAndPubblicataTrue(dto.autoId())
				.orElseThrow(() -> new NonTrovatoException("Auto non trovata"));

		int minimo = (int) Math.floor(tempoMinimo(auto) * 1000);
		if (dto.millis() < minimo - TOLLERANZA_MS) {
			throw new RichiestaNonValidaException("Tempo non plausibile per questa auto");
		}

		var esistente = tempoRepository.findByUtenteIdAndAutoId(utenteId, auto.getId());
		boolean nuovoRecord;
		int record;
		if (esistente.isPresent()) {
			nuovoRecord = esistente.get().migliora(dto.millis());
			record = esistente.get().getMillis();
		} else {
			tempoRepository.save(new Tempo(utente, auto, dto.millis()));
			nuovoRecord = true;
			record = dto.millis();
		}
		return new GaraDto.Esito(dto.millis(), record, nuovoRecord, tempoRepository.posizione(auto.getId(), record));
	}

	/** Tempo minimo in secondi, esposto anche al FE per mostrare "il giro perfetto". */
	public double tempoMinimo(Auto auto) {
		Prestazioni p = auto.getPrestazioni();
		if (!p.complete()) {
			throw new RichiestaNonValidaException("Questa auto non ha i dati per gareggiare");
		}
		return new Simulatore(p.getZeroCento().doubleValue(), p.getVelocitaMax(),
				"Elettrica".equalsIgnoreCase(auto.getAlimentazione())).tempoMinimo();
	}

	@Transactional(readOnly = true)
	public List<GaraDto.Riga> classifica(Long autoId) {
		List<Tempo> tempi = autoId == null
				? tempoRepository.classificaGenerale(PageRequest.of(0, 20))
				: tempoRepository.classificaAuto(autoId, PageRequest.of(0, 10));
		List<GaraDto.Riga> righe = new ArrayList<>();
		for (int i = 0; i < tempi.size(); i++) {
			righe.add(GaraDto.Riga.da(i + 1, tempi.get(i)));
		}
		return righe;
	}

	@Transactional(readOnly = true)
	public List<GaraDto.Riga> miei(Long utenteId) {
		return tempoRepository.diUtente(utenteId).stream()
				.map(t -> GaraDto.Riga.da(tempoRepository.posizione(t.getAuto().getId(), t.getMillis()), t))
				.toList();
	}
}
