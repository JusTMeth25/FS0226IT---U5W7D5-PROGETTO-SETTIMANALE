package it.epicode.base.security;

import it.epicode.base.utente.Ruolo;

/**
 * Chi sta facendo la richiesta, letto dal JWT. I controller lo ricevono con
 * @AuthenticationPrincipal: l'id dell'utente non arriva mai dal corpo o dall'URL.
 */
public record UtenteCorrente(Long id, Ruolo ruolo) {
}
