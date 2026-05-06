package com.cogumelos.dto.custos;

import java.util.List;

public record AtualizarCustosRequest(
        List<CustoInsumoItem> custos,
        Double precoVendaKg
) {}