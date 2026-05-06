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

import java.time.LocalDate;

public record RelatorioExperimentoItem(
        String experimentoId, String codigo, String formulacaoNome, String especieNome,
        String usuarioNome, LocalDate dataPreparo, String status,
        Double custoSubstrato, Double custoPorKgProduzido,
        Double totalColhidoKg, Double receitaTotal, Double margemReais, Double margemPct
) {}
