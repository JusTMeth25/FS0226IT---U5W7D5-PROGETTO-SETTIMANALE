package it.epicode.base.auto;

import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface AutoRepository extends JpaRepository<Auto, Long> {

	/**
	 * Ricerca del catalogo pubblico. Il testo cercato e' un parametro legato,
	 * mai concatenato, gia' nella forma "%...%" (senza ricerca vale "%").
	 * L'ordinamento arriva nel Pageable, costruito solo da OrdinamentoAuto.
	 */
	@Query("""
			SELECT a FROM Auto a
			WHERE a.pubblicata = true
			  AND (LOWER(a.marca) LIKE :testo ESCAPE '!' OR LOWER(a.modello) LIKE :testo ESCAPE '!')
			  AND (:carrozzeria = '' OR a.carrozzeria = :carrozzeria)
			""")
	Page<Auto> cercaPubblicate(@Param("testo") String testo, @Param("carrozzeria") String carrozzeria,
							   Pageable pageable);

	/** Stessa ricerca per l'amministratore, bozze comprese. */
	@Query("""
			SELECT a FROM Auto a
			WHERE LOWER(a.marca) LIKE :testo ESCAPE '!' OR LOWER(a.modello) LIKE :testo ESCAPE '!'
			""")
	Page<Auto> cercaTutte(@Param("testo") String testo, Pageable pageable);

	Optional<Auto> findByIdAndPubblicataTrue(Long id);

	Optional<Auto> findFirstByMarcaIgnoreCaseAndModelloIgnoreCase(String marca, String modello);

	/**
	 * Lettura con lock di riga per il cambio di prezzo: due modifiche parallele
	 * della stessa auto si mettono in fila, e ognuna vede il prezzo "vecchio" giusto.
	 */
	@Lock(LockModeType.PESSIMISTIC_WRITE)
	@Query("SELECT a FROM Auto a WHERE a.id = :id")
	Optional<Auto> perCambioPrezzo(@Param("id") Long id);
}
