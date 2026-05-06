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

package com.cogumelos.dto.experimento;

import com.cogumelos.dto.custos.CustoInsumoItem;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;
import java.util.List;

public record ExperimentoRequest(@NotBlank String formulacaoId, @NotBlank String codigo,
                                 @NotNull LocalDate dataPreparo, @NotNull @Positive Integer totalBlocos,
                                 Double pesoBlocoKg, Double precoVendaKg,
                                 List<CustoInsumoItem> custos) {}
