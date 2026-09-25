package it.epicode.base.avviso;

import it.epicode.base.auto.Auto;
import it.epicode.base.auto.AutoRepository;
import it.epicode.base.avviso.dto.AvvisoDto;
import it.epicode.base.avviso.dto.NuovoAvvisoDto;
import it.epicode.base.errore.ConflittoException;
import it.epicode.base.errore.NonTrovatoException;
import it.epicode.base.errore.RichiestaNonValidaException;
import it.epicode.base.utente.Utente;
import it.epicode.base.utente.UtenteRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class AvvisoService {

	private final AvvisoRepository avvisoRepository;
	private final AutoRepository autoRepository;
	private final UtenteRepository utenteRepository;

	public AvvisoService(AvvisoRepository avvisoRepository, AutoRepository autoRepository,
						 UtenteRepository utenteRepository) {
		this.avvisoRepository = avvisoRepository;
		this.autoRepository = autoRepository;
		this.utenteRepository = utenteRepository;
	}

	@Transactional(readOnly = true)
	public List<AvvisoDto> elenco(Long utenteId) {
		return avvisoRepository.elencoDi(utenteId).stream().map(AvvisoDto::da).toList();
	}

	@Transactional
	public AvvisoDto crea(Long utenteId, NuovoAvvisoDto dto) {
		Utente utente = utenteRepository.findById(utenteId)
				.orElseThrow(() -> new NonTrovatoException("Utente non trovato"));
		Auto auto = autoRepository.findByIdAndPubblicataTrue(dto.autoId())
				.orElseThrow(() -> new NonTrovatoException("Auto non trovata"));

		// L'avviso scatta quando il prezzo passa da sopra a sotto la soglia: una
		// soglia gia' raggiunta non potrebbe mai scattare.
		if (dto.soglia().compareTo(auto.getPrezzo()) >= 0) {
			throw new RichiestaNonValidaException("La soglia deve essere inferiore al prezzo attuale");
		}
		if (avvisoRepository.existsByUtenteIdAndAutoId(utenteId, auto.getId())) {
			throw new ConflittoException("Hai gia' un avviso per questa auto");
		}
		return AvvisoDto.da(avvisoRepository.save(new Avviso(utente, auto, dto.soglia())));
	}

	@Transactional
	public void elimina(Long id, Long utenteId) {
		Avviso avviso = avvisoRepository.findByIdAndUtenteId(id, utenteId)
				.orElseThrow(() -> new NonTrovatoException("Avviso non trovato"));
		avvisoRepository.delete(avviso);
	}

	/** Dal link della mail: il token vale una volta sola, poi l'avviso non esiste piu'. */
	@Transactional
	public void disattiva(String token) {
		if (avvisoRepository.eliminaPerToken(token.trim()) == 0) {
			throw new NonTrovatoException("Link non valido o gia' usato");
		}
	}

	/**
	 * Prende il segno "inviato" in una transazione propria, che committa subito.
	 * true solo per il thread che ha aggiornato la riga: e' l'unico che spedisce.
	 */
	@Transactional(propagation = Propagation.REQUIRES_NEW)
	public boolean prendiSegno(Long avvisoId) {
		return avvisoRepository.segnaInviato(avvisoId) == 1;
	}

	/** Vuoto se nel frattempo l'avviso o l'utente sono stati cancellati. */
	@Transactional(readOnly = true)
	public Optional<DatiMail> datiMail(Long avvisoId) {
		return avvisoRepository.findById(avvisoId).map(a -> new DatiMail(
				a.getId(),
				a.getUtente().getEmail(),
				a.getUtente().getNome(),
				a.getAuto().getMarca(),
				a.getAuto().getModello(),
				a.getAuto().getPrezzo(),
				a.getSoglia(),
				a.getToken()));
	}
}
