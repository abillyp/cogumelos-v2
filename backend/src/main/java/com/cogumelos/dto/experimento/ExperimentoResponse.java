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
        FinanceiroResponse financeiro,
        DiasPorFaseResponse diasPorFase
) {
    public static ExperimentoResponse from(Experimento e, FinanceiroResponse fin) {
        DiasPorFaseResponse diasPorFase = calcularDiasPorFase(e.getFases());
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
                fin,
                diasPorFase
        );
    }

    private static DiasPorFaseResponse calcularDiasPorFase(List<ExperimentoFase> fases) {
        java.util.Map<String, Long> dias = new java.util.HashMap<>();

        for (ExperimentoFase f : fases) {
            if (f.getInicio() == null) continue;
            LocalDate fim = f.getFim() != null ? f.getFim() : LocalDate.now();
            long d = java.time.temporal.ChronoUnit.DAYS.between(f.getInicio(), fim);
            // acumula por fase (pode ter múltiplos ciclos de FRUTIFICACAO/DESCANSO)
            dias.merge(f.getFase().name(), d, Long::sum);
        }

        // total = da primeira fase até hoje ou fim da última
        LocalDate inicio = fases.stream()
                .filter(f -> f.getInicio() != null)
                .map(ExperimentoFase::getInicio)
                .min(LocalDate::compareTo).orElse(null);
        LocalDate fimTotal = fases.stream()
                .filter(f -> f.getFim() != null)
                .map(ExperimentoFase::getFim)
                .max(LocalDate::compareTo).orElse(LocalDate.now());
        long total = inicio != null
                ? java.time.temporal.ChronoUnit.DAYS.between(inicio, fimTotal) : 0;

        return new DiasPorFaseResponse(
                dias.getOrDefault("PREPARACAO",     0L).intValue(),
                dias.getOrDefault("INOCULADO",      0L).intValue(),
                dias.getOrDefault("AMADURECIMENTO", 0L).intValue(),
                dias.getOrDefault("FRUTIFICACAO",   0L).intValue(),
                dias.getOrDefault("DESCANSO",       0L).intValue(),
                (int) total
        );
    }
}
