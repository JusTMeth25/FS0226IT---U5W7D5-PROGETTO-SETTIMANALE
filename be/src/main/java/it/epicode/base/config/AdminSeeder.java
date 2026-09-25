package it.epicode.base.config;

import it.epicode.base.utente.Ruolo;
import it.epicode.base.utente.Utente;
import it.epicode.base.utente.UtenteRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Locale;

/**
 * Crea l'amministratore al primo avvio. E' l'unico modo di avere un ADMIN:
 * dalla registrazione esce sempre USER. La password arriva da ADMIN_PASSWORD
 * e non finisce nei log; l'email neppure.
 */
@Component
public class AdminSeeder implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(AdminSeeder.class);

	private final UtenteRepository utenteRepository;
	private final PasswordEncoder passwordEncoder;
	private final String email;
	private final String password;

	public AdminSeeder(UtenteRepository utenteRepository, PasswordEncoder passwordEncoder,
					   @Value("${app.admin.email}") String email,
					   @Value("${app.admin.password}") String password) {
		this.utenteRepository = utenteRepository;
		this.passwordEncoder = passwordEncoder;
		this.email = email.trim().toLowerCase(Locale.ROOT);
		this.password = password;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) {
		if (utenteRepository.existsByEmail(email)) {
			return;
		}
		if (password == null || password.length() < 8) {
			log.warn("ADMIN_PASSWORD assente o piu' corta di 8 caratteri: amministratore non creato");
			return;
		}
		utenteRepository.save(new Utente(email, "Amministratore", passwordEncoder.encode(password), Ruolo.ADMIN));
		log.info("Amministratore creato");
	}
}
