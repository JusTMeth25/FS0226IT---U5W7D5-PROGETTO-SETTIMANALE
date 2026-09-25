package it.epicode.base.utente.dto;

/** Risposta di login e registrazione: il token e i dati da mostrare. */
public record AccessoDto(String token, UtenteDto utente) {
}
