package it.epicode.base.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.EnableAsync;

/**
 * Abilita @Async: la mail degli avvisi parte su un altro thread, cosi'
 * l'amministratore che cambia il prezzo non aspetta la risposta di Gmail.
 */
@Configuration
@EnableAsync
public class AsyncConfig {
}
