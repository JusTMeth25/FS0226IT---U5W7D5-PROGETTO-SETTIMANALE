package it.epicode.base.avviso.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Token del link nella mail. */
public record DisattivaDto(@NotBlank @Size(max = 64) String token) {
}
