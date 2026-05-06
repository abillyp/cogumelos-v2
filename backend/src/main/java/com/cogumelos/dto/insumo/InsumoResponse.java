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

package com.cogumelos.dto.insumo;

import com.cogumelos.domain.Insumo;

public record InsumoResponse(String id, String nome, Double moPct, Double carbonoPct,
                             Double nitrogenioPct, Double cnRatio, Double ph, String categoria) {
    public static InsumoResponse from(Insumo i) {
        return new InsumoResponse(i.getId(), i.getNome(), i.getMoPct(), i.getCarbonoPct(),
                i.getNitrogenioPct(), i.getCnRatio(), i.getPh(), i.getCategoria());
    }
}