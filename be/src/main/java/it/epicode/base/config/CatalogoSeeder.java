package it.epicode.base.config;

import it.epicode.base.auto.Auto;
import it.epicode.base.auto.AutoRepository;
import it.epicode.base.auto.Media;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.json.JsonMapper;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

/**
 * Importa all'avvio il catalogo di auto reali (catalogo/auto.json): listini
 * italiani verificati, foto da Wikimedia Commons, modelli 3D da Sketchfab.
 *
 * - Auto nuova: si crea pubblicata, con prezzo di listino e un prezzo
 *   d'acquisto stimato all'82%.
 * - Auto gia' presente (stessa marca e modello): si aggiornano solo scheda,
 *   foto e modello 3D. Il prezzo lo gestisce l'amministratore e non si tocca,
 *   altrimenti ogni riavvio potrebbe far scattare o annullare gli avvisi.
 *
 * Si spegne con app.catalogo.importa=false.
 */
@Component
public class CatalogoSeeder implements ApplicationRunner {

	private static final Logger log = LoggerFactory.getLogger(CatalogoSeeder.class);
	private static final BigDecimal MARGINE_ACQUISTO = new BigDecimal("0.82");

	record Foto(String url, String autore, String licenza, String fonte) {
	}

	record Modello3d(String uid, String autore, String fonte) {
	}

	record Voce(String marca, String modello, int anno, BigDecimal prezzo, String carrozzeria,
				String alimentazione, String descrizione, Foto foto, Modello3d modello3d) {

		Media media() {
			return new Media(
					foto == null ? null : foto.url(),
					foto == null ? null : foto.autore(),
					foto == null ? null : foto.licenza(),
					foto == null ? null : foto.fonte(),
					modello3d == null ? null : modello3d.uid(),
					modello3d == null ? null : modello3d.autore(),
					modello3d == null ? null : modello3d.fonte());
		}
	}

	private final AutoRepository autoRepository;
	private final JsonMapper json;
	private final boolean attivo;

	public CatalogoSeeder(AutoRepository autoRepository, JsonMapper json,
						  @Value("${app.catalogo.importa:true}") boolean attivo) {
		this.autoRepository = autoRepository;
		this.json = json;
		this.attivo = attivo;
	}

	@Override
	@Transactional
	public void run(ApplicationArguments args) throws IOException {
		if (!attivo) {
			return;
		}
		ClassPathResource file = new ClassPathResource("catalogo/auto.json");
		if (!file.exists()) {
			log.warn("catalogo/auto.json assente: nessuna auto importata");
			return;
		}
		List<Voce> voci;
		try (InputStream in = file.getInputStream()) {
			voci = json.readValue(in, new TypeReference<>() {
			});
		}

		int nuove = 0;
		int aggiornate = 0;
		for (Voce v : voci) {
			var esistente = autoRepository.findFirstByMarcaIgnoreCaseAndModelloIgnoreCase(v.marca(), v.modello());
			if (esistente.isPresent()) {
				esistente.get().aggiornaScheda(v.carrozzeria(), v.alimentazione(), v.media());
				aggiornate++;
			} else {
				BigDecimal acquisto = v.prezzo().multiply(MARGINE_ACQUISTO).setScale(0, RoundingMode.HALF_UP);
				Auto auto = new Auto(v.marca(), v.modello(), v.anno(), v.descrizione(), v.prezzo(), acquisto, true);
				auto.aggiornaScheda(v.carrozzeria(), v.alimentazione(), v.media());
				autoRepository.save(auto);
				nuove++;
			}
		}
		log.info("Catalogo: {} auto importate, {} aggiornate", nuove, aggiornate);
	}
}
