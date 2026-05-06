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

package com.cogumelos.dto.custos;

import com.cogumelos.domain.ExperimentoCusto;

public record CustoInsumoResponse(String insumoId, String insumoNome, Double custoPorKg,
                                  Double pesoRealKg, Double custoTotal) {
    public static CustoInsumoResponse from(ExperimentoCusto ec, Double pesoRealKg) {
        return new CustoInsumoResponse(ec.getInsumo().getId(), ec.getInsumo().getNome(),
                ec.getCustoPorKg(), pesoRealKg,
                pesoRealKg != null ? ec.getCustoPorKg() * pesoRealKg : null);
    }
}
