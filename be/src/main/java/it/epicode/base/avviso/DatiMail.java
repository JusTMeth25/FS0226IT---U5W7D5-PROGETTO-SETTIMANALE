package it.epicode.base.avviso;

import java.math.BigDecimal;

/** Tutto quello che serve per scrivere una mail, letto in una transazione. */
public record DatiMail(Long avvisoId, String email, String nome, String marca, String modello,
					   BigDecimal prezzo, BigDecimal soglia, String token) {
}
