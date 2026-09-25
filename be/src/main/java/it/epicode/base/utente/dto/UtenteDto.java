package it.epicode.base.utente.dto;

import it.epicode.base.utente.Ruolo;
import it.epicode.base.utente.Utente;

public record UtenteDto(Long id, String email, String nome, Ruolo ruolo) {

	public static UtenteDto da(Utente u) {
		return new UtenteDto(u.getId(), u.getEmail(), u.getNome(), u.getRuolo());
	}
}
