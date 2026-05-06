package com.cogumelos.dto.relatorio;

import java.time.LocalDate;

public record RelatorioExperimentoItem(
        String experimentoId, String codigo, String formulacaoNome, String especieNome,
        String usuarioNome, LocalDate dataPreparo, String status,
        Double custoSubstrato, Double custoPorKgProduzido,
        Double totalColhidoKg, Double receitaTotal, Double margemReais, Double margemPct
) {}
