package it.epicode.base.avviso;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

public interface AvvisoRepository extends JpaRepository<Avviso, Long> {

	/** Sempre per id E proprietario: l'avviso di un altro utente "non esiste". */
	Optional<Avviso> findByIdAndUtenteId(Long id, Long utenteId);

	@Query("SELECT a FROM Avviso a JOIN FETCH a.auto WHERE a.utente.id = :utenteId ORDER BY a.creatoIl DESC")
	List<Avviso> elencoDi(@Param("utenteId") Long utenteId);

	boolean existsByUtenteIdAndAutoId(Long utenteId, Long autoId);

	Optional<Avviso> findByToken(String token);

	/**
	 * Avvisi attraversati dal cambio di prezzo: prima il prezzo era sopra la
	 * soglia (soglia < vecchio), adesso e' uguale o sotto (soglia >= nuovo).
	 * Stesso prezzo o ribasso ulteriore: nessuna soglia in questo intervallo.
	 */
	@Query("""
			SELECT a.id FROM Avviso a
			WHERE a.auto.id = :autoId
			  AND a.inviato = false
			  AND a.soglia >= :nuovo
			  AND a.soglia < :vecchio
			""")
	List<Long> attraversati(@Param("autoId") Long autoId, @Param("vecchio") BigDecimal vecchio,
							@Param("nuovo") BigDecimal nuovo);

	/**
	 * Prende il segno in un colpo solo. Due thread sullo stesso avviso: il
	 * database ne fa passare uno, l'altro aggiorna 0 righe e non spedisce.
	 */
	@Modifying(clearAutomatically = true)
	@Query("UPDATE Avviso a SET a.inviato = true WHERE a.id = :id AND a.inviato = false")
	int segnaInviato(@Param("id") Long id);

	@Modifying
	@Query("DELETE FROM Avviso a WHERE a.utente.id = :utenteId")
	int eliminaDiUtente(@Param("utenteId") Long utenteId);

	@Modifying
	@Query("DELETE FROM Avviso a WHERE a.auto.id = :autoId")
	int eliminaDiAuto(@Param("autoId") Long autoId);

	/** Il token si consuma cancellando l'avviso: una seconda chiamata trova 0 righe. */
	@Modifying
	@Query("DELETE FROM Avviso a WHERE a.token = :token")
	int eliminaPerToken(@Param("token") String token);
}
