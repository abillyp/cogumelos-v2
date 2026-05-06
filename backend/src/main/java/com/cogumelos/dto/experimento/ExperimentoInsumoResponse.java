package com.cogumelos.dto.experimento;

public record ExperimentoInsumoResponse(
        String insumoId,
        String nome,
        Double pesoKg
) {}
