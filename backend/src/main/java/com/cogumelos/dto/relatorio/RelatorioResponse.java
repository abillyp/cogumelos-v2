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
