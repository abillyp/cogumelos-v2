package com.cogumelos.dto.insumo;

import com.cogumelos.domain.Insumo;

public record InsumoResponse(String id, String nome, Double moPct, Double carbonoPct,
                             Double nitrogenioPct, Double cnRatio, Double ph, String categoria) {
    public static InsumoResponse from(Insumo i) {
        return new InsumoResponse(i.getId(), i.getNome(), i.getMoPct(), i.getCarbonoPct(),
                i.getNitrogenioPct(), i.getCnRatio(), i.getPh(), i.getCategoria());
    }
}