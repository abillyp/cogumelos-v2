package com.cogumelos.dto.formulacao;

import jakarta.validation.constraints.*;

public record FormulacaoInsumoItem(@NotBlank String insumoId,
                                   @NotNull @Positive Double pesoRealKg,
                                   @NotNull @DecimalMin("0.0") @DecimalMax("1.0") Double umidadePct) {}
