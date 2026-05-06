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

public record RelatorioFormulacaoItem(
        String formulacaoId, String formulacaoNome, String especieNome,
        int totalExperimentos, Double custoMedioSubstrato, Double cnTotal,
        Double mediaColheitaKg, Double margemMediaPct
) {}
