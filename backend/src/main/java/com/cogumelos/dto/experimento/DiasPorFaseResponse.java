package com.cogumelos.dto.experimento;

public record DiasPorFaseResponse(
        Integer preparacao,
        Integer inoculacao,
        Integer amadurecimento,
        Integer frutificacao,
        Integer descanso,
        Integer total
) {}