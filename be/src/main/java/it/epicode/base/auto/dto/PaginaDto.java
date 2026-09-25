package it.epicode.base.auto.dto;

import org.springframework.data.domain.Page;

import java.util.List;
import java.util.function.Function;

/** Pagina di risultati con una forma stabile, indipendente da come Spring serializza Page. */
public record PaginaDto<T>(List<T> contenuto, int pagina, int dimensione, long totale, int pagineTotali) {

	public static <E, T> PaginaDto<T> da(Page<E> pagina, Function<E, T> mappa) {
		return new PaginaDto<>(pagina.getContent().stream().map(mappa).toList(), pagina.getNumber(),
				pagina.getSize(), pagina.getTotalElements(), pagina.getTotalPages());
	}
}
