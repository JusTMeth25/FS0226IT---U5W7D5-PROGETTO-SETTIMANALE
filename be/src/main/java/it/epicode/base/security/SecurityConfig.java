package it.epicode.base.security;

import it.epicode.base.utente.UtenteRepository;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.ProviderManager;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

import java.io.IOException;
import java.util.Locale;

/**
 * Chi puo' chiamare che cosa. L'elenco dei percorsi pubblici e' chiuso: tutto
 * quello che non compare qui richiede un token, /api/admin/** richiede ADMIN.
 */
@Configuration
@EnableMethodSecurity
public class SecurityConfig {

	private static final String JSON_401 = "{\"stato\":401,\"messaggio\":\"Autenticazione richiesta\"}";
	private static final String JSON_403 = "{\"stato\":403,\"messaggio\":\"Accesso negato\"}";

	@Bean
	public SecurityFilterChain filtri(HttpSecurity http, JwtFilter jwtFilter) throws Exception {
		http
				// API stateless con token nell'header: niente cookie di sessione, niente CSRF.
				.csrf(csrf -> csrf.disable())
				.cors(Customizer.withDefaults())
				.sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
				.httpBasic(b -> b.disable())
				.formLogin(f -> f.disable())
				.authorizeHttpRequests(auth -> auth
						.requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
						.requestMatchers("/actuator/health", "/actuator/health/**").permitAll()
						.requestMatchers("/error").permitAll()
						.requestMatchers(HttpMethod.GET, "/api/stato").permitAll()
						.requestMatchers(HttpMethod.POST, "/api/auth/registrazione", "/api/auth/login").permitAll()
						.requestMatchers(HttpMethod.GET, "/api/auto", "/api/auto/*").permitAll()
						.requestMatchers(HttpMethod.POST, "/api/avvisi/disattiva").permitAll()
						.requestMatchers(HttpMethod.GET, "/api/gara/classifica").permitAll()
						.requestMatchers("/api/admin/**").hasRole("ADMIN")
						.anyRequest().authenticated())
				.exceptionHandling(e -> e
						.authenticationEntryPoint((req, res, ex) -> scrivi(res, 401, JSON_401))
						.accessDeniedHandler((req, res, ex) -> scrivi(res, 403, JSON_403)))
				.addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);
		return http.build();
	}

	@Bean
	public PasswordEncoder passwordEncoder() {
		return new BCryptPasswordEncoder();
	}

	/** Usato solo dal login: cerca l'utente per email e confronta l'hash. */
	@Bean
	public UserDetailsService userDetailsService(UtenteRepository utenti) {
		return email -> utenti.findByEmail(email.trim().toLowerCase(Locale.ROOT))
				.map(u -> User.withUsername(u.getEmail())
						.password(u.getPasswordHash())
						.roles(u.getRuolo().name())
						.build())
				.orElseThrow(() -> new UsernameNotFoundException("Credenziali non valide"));
	}

	@Bean
	public AuthenticationManager authenticationManager(UserDetailsService uds, PasswordEncoder encoder) {
		DaoAuthenticationProvider provider = new DaoAuthenticationProvider(uds);
		provider.setPasswordEncoder(encoder);
		return new ProviderManager(provider);
	}

	private static void scrivi(HttpServletResponse res, int stato, String corpo) throws IOException {
		res.setStatus(stato);
		res.setContentType(MediaType.APPLICATION_JSON_VALUE);
		res.setCharacterEncoding("UTF-8");
		res.getWriter().write(corpo);
	}
}
