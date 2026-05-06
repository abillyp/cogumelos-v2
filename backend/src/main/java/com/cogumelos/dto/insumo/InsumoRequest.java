/*
 * Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
 * Todos os direitos reservados.
 *
 * Este arquivo é parte do sistema cogumelos.app e está protegido pela
 * Lei Brasileira de Direitos Autorais (Lei nº 9.610/1998).
 * Uso, cópia ou distribuição não autorizados são expressamente proibidos.
 *
 * Contato: alessandro.billy@organico4you.com.br
 */

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