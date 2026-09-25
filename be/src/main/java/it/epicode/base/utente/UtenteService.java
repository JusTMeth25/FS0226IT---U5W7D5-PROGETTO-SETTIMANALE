package it.epicode.base.utente;

import it.epicode.base.avviso.AvvisoRepository;
import it.epicode.base.errore.ConflittoException;
import it.epicode.base.errore.NonTrovatoException;
import it.epicode.base.preferito.PreferitoRepository;
import it.epicode.base.security.JwtService;
import it.epicode.base.utente.dto.AccessoDto;
import it.epicode.base.utente.dto.LoginDto;
import it.epicode.base.utente.dto.ProfiloDto;
import it.epicode.base.utente.dto.RegistrazioneDto;
import it.epicode.base.utente.dto.UtenteDto;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

@Service
public class UtenteService {

	private final UtenteRepository utenteRepository;
	private final AvvisoRepository avvisoRepository;
	private final PreferitoRepository preferitoRepository;
	private final PasswordEncoder passwordEncoder;
	private final AuthenticationManager authenticationManager;
	private final JwtService jwtService;

	public UtenteService(UtenteRepository utenteRepository, AvvisoRepository avvisoRepository,
						 PreferitoRepository preferitoRepository, PasswordEncoder passwordEncoder,
						 AuthenticationManager authenticationManager, JwtService jwtService) {
		this.utenteRepository = utenteRepository;
		this.avvisoRepository = avvisoRepository;
		this.preferitoRepository = preferitoRepository;
		this.passwordEncoder = passwordEncoder;
		this.authenticationManager = authenticationManager;
		this.jwtService = jwtService;
	}

	/** Il ruolo lo decide il server: chi si registra e' sempre USER. */
	@Transactional
	public AccessoDto registra(RegistrazioneDto dto) {
		String email = normalizza(dto.email());
		if (utenteRepository.existsByEmail(email)) {
			throw new ConflittoException("Email gia' registrata");
		}
		Utente utente = utenteRepository.save(
				new Utente(email, dto.nome().trim(), passwordEncoder.encode(dto.password()), Ruolo.USER));
		return new AccessoDto(jwtService.genera(utente), UtenteDto.da(utente));
	}

	/** Credenziali sbagliate: AuthenticationException, gestita come 401 con messaggio generico. */
	@Transactional(readOnly = true)
	public AccessoDto login(LoginDto dto) {
		String email = normalizza(dto.email());
		authenticationManager.authenticate(new UsernamePasswordAuthenticationToken(email, dto.password()));
		Utente utente = utenteRepository.findByEmail(email)
				.orElseThrow(() -> new NonTrovatoException("Utente non trovato"));
		return new AccessoDto(jwtService.genera(utente), UtenteDto.da(utente));
	}

	@Transactional(readOnly = true)
	public UtenteDto profilo(Long id) {
		return UtenteDto.da(trova(id));
	}

	@Transactional
	public UtenteDto aggiornaProfilo(Long id, ProfiloDto dto) {
		Utente utente = trova(id);
		utente.setNome(dto.nome().trim());
		return UtenteDto.da(utente);
	}

	/**
	 * "Elimina il mio account": prima avvisi e preferiti, poi l'utente. Senza
	 * avvisi, da questo account non puo' partire piu' nessuna mail; se una mail
	 * era in coda, prendiSegno trova 0 righe e non spedisce.
	 */
	@Transactional
	public void elimina(Long id) {
		Utente utente = trova(id);
		avvisoRepository.eliminaDiUtente(id);
		preferitoRepository.eliminaDiUtente(id);
		utenteRepository.delete(utente);
	}

	private Utente trova(Long id) {
		return utenteRepository.findById(id).orElseThrow(() -> new NonTrovatoException("Utente non trovato"));
	}

	static String normalizza(String email) {
		return email.trim().toLowerCase(Locale.ROOT);
	}
}
