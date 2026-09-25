package it.epicode.base.web;

import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.info.BuildProperties;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.Instant;
import java.util.Map;

/**
 * Stato del servizio: conferma dal browser che BE e database rispondono e,
 * con "build", quando e' stata costruita la versione in esecuzione. Serve a
 * verificare che un deploy su Render sia andato davvero online.
 */
@RestController
public class StatoController {

	private final JdbcTemplate jdbc;
	private final String build;

	public StatoController(JdbcTemplate jdbc, ObjectProvider<BuildProperties> buildInfo) {
		this.jdbc = jdbc;
		BuildProperties b = buildInfo.getIfAvailable();
		this.build = b == null || b.getTime() == null ? "sconosciuta" : b.getTime().toString();
	}

	@GetMapping("/api/stato")
	public Map<String, Object> stato() {
		String database = jdbc.queryForObject("SELECT current_database()", String.class);
		return Map.of(
				"servizio", "attivo",
				"database", database == null ? "sconosciuto" : database,
				"build", build,
				"ora", Instant.now().toString());
	}
}
