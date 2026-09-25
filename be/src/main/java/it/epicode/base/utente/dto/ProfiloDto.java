package it.epicode.base.utente.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Dal profilo si cambia solo il nome. */
public record ProfiloDto(@NotBlank @Size(max = 80) String nome) {
}
