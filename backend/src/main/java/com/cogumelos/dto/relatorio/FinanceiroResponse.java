package com.cogumelos.dto.relatorio;

public record FinanceiroResponse(
        Double custoTotalSubstrato,
        Double custoPorBloco,
        Double custoPorKgProduzido,
        Double totalColhidoKg,
        Double receitaTotal,
        Double margemReais,
        Double margemPct
) {}
