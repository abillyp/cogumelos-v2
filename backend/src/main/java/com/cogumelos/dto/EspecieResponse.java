package com.cogumelos.dto;

import com.cogumelos.domain.EspecieCogumelo;

public record EspecieResponse(String id, String nome, Double cnMin, Double cnMax, String notas) {
    public static EspecieResponse from(EspecieCogumelo e) {
        return new EspecieResponse(e.getId(), e.getNome(), e.getCnMin(), e.getCnMax(), e.getNotas());
    }
}