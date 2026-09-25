package it.epicode.base.preferito;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface PreferitoRepository extends JpaRepository<Preferito, Long> {

	/** Sempre per id E proprietario: il preferito di un altro utente "non esiste". */
	Optional<Preferito> findByIdAndUtenteId(Long id, Long utenteId);

	@Query("SELECT p FROM Preferito p JOIN FETCH p.auto WHERE p.utente.id = :utenteId ORDER BY p.creatoIl DESC")
	List<Preferito> elencoDi(@Param("utenteId") Long utenteId);

	boolean existsByUtenteIdAndAutoId(Long utenteId, Long autoId);

	@Modifying
	@Query("DELETE FROM Preferito p WHERE p.utente.id = :utenteId")
	int eliminaDiUtente(@Param("utenteId") Long utenteId);

	@Modifying
	@Query("DELETE FROM Preferito p WHERE p.auto.id = :autoId")
	int eliminaDiAuto(@Param("autoId") Long autoId);
}
