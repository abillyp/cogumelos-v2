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
