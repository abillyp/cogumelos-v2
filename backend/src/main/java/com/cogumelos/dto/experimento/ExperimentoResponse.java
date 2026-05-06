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

package com.cogumelos.dto.experimento;

import com.cogumelos.domain.Experimento;
import com.cogumelos.domain.ExperimentoFase;
import com.cogumelos.dto.custos.CustoInsumoResponse;
import com.cogumelos.dto.relatorio.FinanceiroResponse;

import java.time.LocalDate;
import java.util.List;

public record ExperimentoResponse(
        String id,
        String codigo,
        String usuarioId,
        String usuarioNome,
        String formulacaoId,
        String formulacaoNome,
        String especieNome,
        LocalDate dataPreparo,
        Integer totalBlocos,
        Double pesoBlocoKg,
        Double precoVendaKg,
        String status,
        Double cnTotal,
        Integer blocosPerdidos,
        Integer blocosAtivos,
        Integer cicloAtual,
        List<CustoInsumoResponse> custos,
        List<ExperimentoInsumoResponse> insumos,
        FinanceiroResponse financeiro
) {
    public static ExperimentoResponse from(Experimento e, FinanceiroResponse fin) {
        var custos = e.getCustos() == null ? List.<CustoInsumoResponse>of() :
                e.getCustos().stream().map(ec -> {
                    Double peso = e.getFormulacao().getInsumos().stream()
                            .filter(fi -> fi.getInsumo().getId().equals(ec.getInsumo().getId()))
                            .mapToDouble(fi -> fi.getPesoRealKg())
                            .findFirst()
                            .orElse(0.0);

                    return CustoInsumoResponse.from(ec, peso);
                }).toList();

        var insumos = e.getFormulacao().getInsumos() == null ? List.<ExperimentoInsumoResponse>of() :
                e.getFormulacao().getInsumos().stream()
                        .map(fi -> new ExperimentoInsumoResponse(
                                fi.getInsumo().getId(),
                                fi.getInsumo().getNome(),
                                fi.getPesoRealKg()
                        ))
                        .toList();

        Integer cicloAtual = e.getFases().stream()
                .filter(f -> f.getCiclo() != null)
                .mapToInt(ExperimentoFase::getCiclo)
                .max()
                .orElse(1);

        return new ExperimentoResponse(
                e.getId(),
                e.getCodigo(),
                e.getUsuario().getId(),
                e.getUsuario().getNome(),
                e.getFormulacao().getId(),
                e.getFormulacao().getNome(),
                e.getFormulacao().getEspecie().getNome(),
                e.getDataPreparo(),
                e.getTotalBlocos(),
                e.getPesoBlocoKg(),
                e.getPrecoVendaKg(),
                e.getFaseAtual().name(),
                e.getFormulacao().getCnTotal(),
                e.getTotalBlocosPerdidos(),
                e.getTotalBlocos()-e.getTotalBlocosPerdidos(),
                cicloAtual,
                custos,
                insumos,
                fin
        );
    }
}
