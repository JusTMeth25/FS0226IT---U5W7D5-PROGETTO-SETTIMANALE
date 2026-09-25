package it.epicode.base.preferito.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record NuovoPreferitoDto(@NotNull @Positive Long autoId) {
}
