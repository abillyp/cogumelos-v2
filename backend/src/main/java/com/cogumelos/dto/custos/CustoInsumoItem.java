package com.cogumelos.dto.custos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CustoInsumoItem(@NotBlank String insumoId, @NotNull @Positive Double custoPorKg) {}
