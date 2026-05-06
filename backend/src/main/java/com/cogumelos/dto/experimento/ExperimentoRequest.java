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
