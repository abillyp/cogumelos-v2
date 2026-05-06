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

package com.cogumelos.dto.formulacao;

import com.cogumelos.domain.FormulacaoInsumo;

public record FormulacaoInsumoResponse(String id, String insumoId, String insumoNome,
                                       Double pesoRealKg, Double umidadePct, Double pesoSecoKg, Double moKg, Double cKg, Double nKg) {
    public static FormulacaoInsumoResponse from(FormulacaoInsumo fi) {
        return new FormulacaoInsumoResponse(fi.getId(), fi.getInsumo().getId(), fi.getInsumo().getNome(),
                fi.getPesoRealKg(), fi.getUmidadePct(), fi.getPesoSecoKg(), fi.getMoKg(), fi.getCKg(), fi.getNKg());
    }
}
