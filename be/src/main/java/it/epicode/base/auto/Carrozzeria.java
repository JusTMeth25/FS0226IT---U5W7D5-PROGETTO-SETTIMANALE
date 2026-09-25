package it.epicode.base.auto;

import it.epicode.base.errore.RichiestaNonValidaException;

import java.text.Normalizer;
import java.util.Locale;

/**
 * Elenco chiuso delle carrozzerie filtrabili nel catalogo. Il valore arriva
 * dal client: si accetta solo se e' uno di questi, altrimenti 400.
 */
public enum Carrozzeria {

	CITYCAR("Citycar"),
	BERLINA("Berlina"),
	SUV("SUV"),
	COUPE("Coupé"),
	CABRIO("Cabrio"),
	STATION_WAGON("Station wagon");

	private final String etichetta;

	Carrozzeria(String etichetta) {
		this.etichetta = etichetta;
	}

	public String etichetta() {
		return etichetta;
	}

	/** "" = nessun filtro; altrimenti l'etichetta salvata nel database. */
	public static String filtro(String valore) {
		if (valore == null || valore.isBlank()) {
			return "";
		}
		String chiave = Normalizer.normalize(valore.trim(), Normalizer.Form.NFD)
				.replaceAll("\\p{M}", "")
				.replace(' ', '_')
				.toUpperCase(Locale.ROOT);
		for (Carrozzeria c : values()) {
			if (c.name().equals(chiave)) {
				return c.etichetta;
			}
		}
		throw new RichiestaNonValidaException(
				"Carrozzeria non ammessa. Valori: citycar, berlina, suv, coupe, cabrio, station_wagon");
	}
}
