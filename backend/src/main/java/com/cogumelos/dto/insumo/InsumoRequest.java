package com.cogumelos.dto.insumo;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record InsumoRequest(@NotBlank String nome,
                            @NotNull @DecimalMin("0.0") @DecimalMax("1.0") Double moPct,
                            @NotNull @DecimalMin("0.0") @DecimalMax("1.0") Double carbonoPct,
                            @NotNull @DecimalMin("0.0") @DecimalMax("1.0") Double nitrogenioPct,
                            Double ph, String categoria) {}