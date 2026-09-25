package it.epicode.base.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

/**
 * Legge "Authorization: Bearer ..." e, se il token e' valido, mette l'utente
 * nel SecurityContext. Un token non valido non blocca la richiesta: la lascia
 * anonima, e sono le regole di SecurityConfig a decidere se rispondere 401.
 */
@Component
public class JwtFilter extends OncePerRequestFilter {

	private static final String PREFISSO = "Bearer ";

	private final JwtService jwtService;

	public JwtFilter(JwtService jwtService) {
		this.jwtService = jwtService;
	}

	@Override
	protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
			throws ServletException, IOException {
		String header = request.getHeader(HttpHeaders.AUTHORIZATION);
		if (header != null && header.startsWith(PREFISSO)) {
			jwtService.verifica(header.substring(PREFISSO.length()).trim()).ifPresent(utente -> {
				var autorita = List.of(new SimpleGrantedAuthority("ROLE_" + utente.ruolo().name()));
				var autenticazione = new UsernamePasswordAuthenticationToken(utente, null, autorita);
				SecurityContextHolder.getContext().setAuthentication(autenticazione);
			});
		}
		chain.doFilter(request, response);
	}
}
