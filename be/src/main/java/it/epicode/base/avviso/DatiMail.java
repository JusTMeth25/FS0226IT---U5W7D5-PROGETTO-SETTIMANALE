package it.epicode.base.avviso;

import java.math.BigDecimal;

/** Tutto quello che serve per scrivere una mail, letto in una transazione. */
public record DatiMail(Long avvisoId, String email, String nome, Long autoId, String marca, String modello,
					   String fotoUrl, Integer cv, BigDecimal zeroCento, BigDecimal prezzoPrecedente,
					   BigDecimal prezzo, BigDecimal soglia, String token) {
}
