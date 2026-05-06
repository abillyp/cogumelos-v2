package com.cogumelos.dto.relatorio;

public record RelatorioFormulacaoItem(
        String formulacaoId, String formulacaoNome, String especieNome,
        int totalExperimentos, Double custoMedioSubstrato, Double cnTotal,
        Double mediaColheitaKg, Double margemMediaPct
) {}
