package it.epicode.base.avviso;

import java.util.List;

/**
 * Pubblicato da AutoService dentro la transazione del cambio di prezzo. Porta
 * solo gli id: i dati per la mail si rileggono dopo il commit.
 */
public record PrezzoScesoEvent(Long autoId, List<Long> avvisoIds) {
}
