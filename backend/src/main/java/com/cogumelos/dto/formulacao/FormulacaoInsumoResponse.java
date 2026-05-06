package com.cogumelos.dto.formulacao;

import com.cogumelos.domain.FormulacaoInsumo;

public record FormulacaoInsumoResponse(String id, String insumoId, String insumoNome,
                                       Double pesoRealKg, Double umidadePct, Double pesoSecoKg, Double moKg, Double cKg, Double nKg) {
    public static FormulacaoInsumoResponse from(FormulacaoInsumo fi) {
        return new FormulacaoInsumoResponse(fi.getId(), fi.getInsumo().getId(), fi.getInsumo().getNome(),
                fi.getPesoRealKg(), fi.getUmidadePct(), fi.getPesoSecoKg(), fi.getMoKg(), fi.getCKg(), fi.getNKg());
    }
}
