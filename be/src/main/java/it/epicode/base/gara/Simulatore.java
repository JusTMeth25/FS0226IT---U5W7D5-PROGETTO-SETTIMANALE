package it.epicode.base.gara;

/**
 * Fisica della drag race. E' la copia esatta di fe/src/lib/gara.ts: stessi
 * numeri, stesso ordine delle operazioni. Il frontend la usa per giocare, il
 * backend per sapere qual e' il tempo piu' basso che quell'auto puo' fare con
 * una guida perfetta, e rifiutare i tempi impossibili.
 *
 * Modello:
 * - accelerazione a(v) = a0 * (1 - (v/vmax)^2), con a0 scelta in modo che lo
 *   0-100 teorico sia quello dichiarato dalla casa;
 * - 6 marce (1 per le elettriche); in ogni marcia il regime r = v / vMarcia;
 *   al limitatore (r >= 0.99) non si accelera, sotto meta' giri si spinge meno;
 * - ogni cambiata costa 0,15 s senza spinta;
 * - nitro una volta sola: +30% di spinta per 2 s.
 */
public final class Simulatore {

	public static final double DT = 1.0 / 120.0;
	public static final double DISTANZA = 402.0;
	public static final double PAUSA_CAMBIO = 0.15;
	public static final double DURATA_NITRO = 2.0;
	public static final double SPINTA_NITRO = 1.3;
	public static final double LIMITATORE = 0.99;
	private static final double TEMPO_MASSIMO = 120.0;

	private final double vmax;
	private final double a0;
	private final int marce;

	public Simulatore(double zeroCento, double velocitaMaxKmh, boolean elettrica) {
		this.vmax = velocitaMaxKmh / 3.6;
		double u = Math.min((100.0 / 3.6) / vmax, 0.99);
		this.a0 = vmax / (2.0 * zeroCento) * Math.log((1 + u) / (1 - u));
		this.marce = elettrica ? 1 : 6;
	}

	double velocitaMarcia(int marcia) {
		return vmax * Math.pow((double) marcia / marce, 0.75);
	}

	static double efficienza(double r, int marcia) {
		if (r >= LIMITATORE) {
			return 0;
		}
		if (marcia == 1 || r >= 0.5) {
			return 1;
		}
		return 0.55 + 0.9 * r;
	}

	/**
	 * Tempo migliore possibile sui 402 m, in secondi: reazione zero, cambiate
	 * esatte al limitatore, nitro nel momento migliore (cercato a passi di 0,1 s).
	 */
	public double tempoMinimo() {
		double migliore = Double.MAX_VALUE;
		for (int i = 0; i <= 100; i++) {
			migliore = Math.min(migliore, corsaPerfetta(i * 0.1));
		}
		return migliore;
	}

	private double corsaPerfetta(double inizioNitro) {
		double t = 0;
		double v = 0;
		double x = 0;
		int marcia = 1;
		double pausa = 0;
		double nitro = 0;
		boolean nitroUsato = false;

		while (t < TEMPO_MASSIMO) {
			// azioni del "pilota perfetto", sempre all'inizio del passo
			if (marcia < marce && pausa <= 0 && v / velocitaMarcia(marcia) >= LIMITATORE) {
				marcia++;
				pausa = PAUSA_CAMBIO;
			}
			if (!nitroUsato && t >= inizioNitro) {
				nitro = DURATA_NITRO;
				nitroUsato = true;
			}

			// passo di fisica: identico a passo() in gara.ts
			if (pausa > 0) {
				pausa -= DT;
			} else {
				double r = v / velocitaMarcia(marcia);
				double a = a0 * Math.max(0, 1 - (v / vmax) * (v / vmax)) * efficienza(r, marcia)
						* (nitro > 0 ? SPINTA_NITRO : 1);
				v = Math.min(v + a * DT, vmax);
			}
			if (nitro > 0) {
				nitro -= DT;
			}
			x += v * DT;
			t += DT;
			if (x >= DISTANZA) {
				return t - (x - DISTANZA) / v;
			}
		}
		return TEMPO_MASSIMO;
	}
}
