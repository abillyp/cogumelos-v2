package com.cogumelos.dto.experimento;

import com.cogumelos.domain.Colheita;

import java.time.LocalDate;

public record ColheitaResponse(String id, LocalDate data, Double pesoTotalKg, Double mediaPorBlocoKg, String notas) {
    public static ColheitaResponse from(Colheita c) {
        return new ColheitaResponse(c.getId(), c.getData(), c.getPesoTotalKg(), c.getMediaPorBlocoKg(), c.getNotas());
    }
}
