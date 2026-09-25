package it.epicode.base.auto;

import it.epicode.base.errore.RichiestaNonValidaException;
import org.springframework.data.domain.Sort;

import java.util.Locale;

/**
 * Elenco chiuso dei campi su cui si puo' ordinare. Il nome del campo arriva dal
 * client e non si puo' legare come parametro SQL: si accetta solo se e' uno di
 * questi, altrimenti 400. Il nome della proprieta' JPA lo decide il server.
 */
public enum OrdinamentoAuto {

	PREZZO("prezzo"),
	ANNO("anno"),
	MARCA("marca"),
	MODELLO("modello"),
	RECENTI("creataIl");

	private final String proprieta;

	OrdinamentoAuto(String proprieta) {
		this.proprieta = proprieta;
	}

	public static Sort sort(String campo, String direzione) {
		OrdinamentoAuto scelto = campo == null || campo.isBlank() ? RECENTI : daTesto(campo);
		Sort.Direction dir = direzione(direzione, scelto == RECENTI ? Sort.Direction.DESC : Sort.Direction.ASC);
		// id come secondo criterio: a parita' di valore l'ordine resta stabile tra le pagine.
		return Sort.by(dir, scelto.proprieta).and(Sort.by(Sort.Direction.ASC, "id"));
	}

	private static OrdinamentoAuto daTesto(String campo) {
		for (OrdinamentoAuto o : values()) {
			if (o.name().equalsIgnoreCase(campo.trim())) {
				return o;
			}
		}
		throw new RichiestaNonValidaException("Ordinamento non ammesso. Valori: prezzo, anno, marca, modello, recenti");
	}

	private static Sort.Direction direzione(String testo, Sort.Direction predefinita) {
		if (testo == null || testo.isBlank()) {
			return predefinita;
		}
		return switch (testo.trim().toLowerCase(Locale.ROOT)) {
			case "asc" -> Sort.Direction.ASC;
			case "desc" -> Sort.Direction.DESC;
			default -> throw new RichiestaNonValidaException("Direzione non ammessa. Valori: asc, desc");
		};
	}
}
