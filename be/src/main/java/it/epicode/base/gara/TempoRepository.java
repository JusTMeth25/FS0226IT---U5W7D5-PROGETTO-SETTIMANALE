package it.epicode.base.gara;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface TempoRepository extends JpaRepository<Tempo, Long> {

	Optional<Tempo> findByUtenteIdAndAutoId(Long utenteId, Long autoId);

	@Query("SELECT t FROM Tempo t JOIN FETCH t.utente JOIN FETCH t.auto WHERE t.auto.id = :autoId ORDER BY t.millis, t.registratoIl")
	List<Tempo> classificaAuto(@Param("autoId") Long autoId, Pageable pagina);

	@Query("SELECT t FROM Tempo t JOIN FETCH t.utente JOIN FETCH t.auto ORDER BY t.millis, t.registratoIl")
	List<Tempo> classificaGenerale(Pageable pagina);

	@Query("SELECT t FROM Tempo t JOIN FETCH t.auto WHERE t.utente.id = :utenteId ORDER BY t.millis")
	List<Tempo> diUtente(@Param("utenteId") Long utenteId);

	/** Posizione in classifica: quanti tempi migliori ci sono, piu' uno. */
	@Query("SELECT COUNT(t) + 1 FROM Tempo t WHERE t.auto.id = :autoId AND t.millis < :millis")
	long posizione(@Param("autoId") Long autoId, @Param("millis") int millis);

	@Modifying
	@Query("DELETE FROM Tempo t WHERE t.utente.id = :utenteId")
	int eliminaDiUtente(@Param("utenteId") Long utenteId);

	@Modifying
	@Query("DELETE FROM Tempo t WHERE t.auto.id = :autoId")
	int eliminaDiAuto(@Param("autoId") Long autoId);
}
