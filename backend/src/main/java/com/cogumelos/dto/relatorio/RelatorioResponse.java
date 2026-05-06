package com.cogumelos.dto.relatorio;

import com.cogumelos.dto.experimento.ExperimentoResponse;

import java.util.List;

public record RelatorioResponse(
        int totalExperimentos,
        int concluidos,
        int emAndamento,
        Double totalColhidoKg,
        Double receitaTotal,
        Double custoTotal,
        Double margemMediaPct,
        List<ExperimentoResponse> detalhes
) {}
