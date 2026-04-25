/*
 * Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
 * Todos os direitos reservados.
 *
 * Este arquivo é parte do sistema cogumelos.app e está protegido pela
 * Lei Brasileira de Direitos Autorais (Lei nº 9.610/1998).
 * Uso, cópia ou distribuição não autorizados são expressamente proibidos.
 *
 * Contato: alessandro.palma@organico4you.com.br
 */

package com.cogumelos.dto;

import com.cogumelos.domain.*;
import jakarta.validation.constraints.*;
import java.time.LocalDate;
import java.util.List;

public class Dtos {

    public record LoginRequest(@Email @NotBlank String email, @NotBlank String senha) {}
    public record RegistroRequest(
            @NotBlank String nome,
            @NotBlank String nomeProdutor,  // ← novo
            @Email @NotBlank String email,
            @NotBlank String senha
    ) {}
    public record AtualizarCustosRequest(
            List<CustoInsumoItem> custos,
            Double precoVendaKg
    ) {}

    public record AuthResponse(String token, String refreshToken, String id, String nome, String email, String role) {}
    public record UsuarioResponse(String id, String nome, String email, String role, boolean ativo, String criadoEm) {
        public static UsuarioResponse from(Usuario u) {
            return new UsuarioResponse(u.getId(), u.getNome(), u.getEmail(), u.getRole().name(), u.isAtivo(), u.getCriadoEm().toString());
        }
    }
    public record UsuarioUpdateRequest(String nome, String role, Boolean ativo) {}

    public record InsumoResponse(String id, String nome, Double moPct, Double carbonoPct,
                                  Double nitrogenioPct, Double cnRatio, Double ph, String categoria) {
        public static InsumoResponse from(Insumo i) {
            return new InsumoResponse(i.getId(), i.getNome(), i.getMoPct(), i.getCarbonoPct(),
                i.getNitrogenioPct(), i.getCnRatio(), i.getPh(), i.getCategoria());
        }
    }
    public record InsumoRequest(@NotBlank String nome,
        @NotNull @DecimalMin("0.0") @DecimalMax("1.0") Double moPct,
        @NotNull @DecimalMin("0.0") @DecimalMax("1.0") Double carbonoPct,
        @NotNull @DecimalMin("0.0") @DecimalMax("1.0") Double nitrogenioPct,
        Double ph, String categoria) {}

    public record EspecieResponse(String id, String nome, Double cnMin, Double cnMax, String notas) {
        public static EspecieResponse from(EspecieCogumelo e) {
            return new EspecieResponse(e.getId(), e.getNome(), e.getCnMin(), e.getCnMax(), e.getNotas());
        }
    }

    public record FormulacaoInsumoItem(@NotBlank String insumoId,
        @NotNull @Positive Double pesoRealKg,
        @NotNull @DecimalMin("0.0") @DecimalMax("1.0") Double umidadePct) {}

    public record FormulacaoRequest(@NotBlank String especieId, @NotBlank String nome,
        @NotNull @Size(min=1) List<FormulacaoInsumoItem> insumos) {}

    public record FormulacaoInsumoResponse(String id, String insumoId, String insumoNome,
        Double pesoRealKg, Double umidadePct, Double pesoSecoKg, Double moKg, Double cKg, Double nKg) {
        public static FormulacaoInsumoResponse from(FormulacaoInsumo fi) {
            return new FormulacaoInsumoResponse(fi.getId(), fi.getInsumo().getId(), fi.getInsumo().getNome(),
                fi.getPesoRealKg(), fi.getUmidadePct(), fi.getPesoSecoKg(), fi.getMoKg(), fi.getCKg(), fi.getNKg());
        }
    }
    public record FormulacaoResponse(String id, String nome, String usuarioId, String usuarioNome,
        String especieId, String especieNome, Double cnTotal, Double phMedio, String criadoEm,
        String status, boolean cnDentroFaixa, List<FormulacaoInsumoResponse> insumos) {
        public static FormulacaoResponse from(Formulacao f) {
            return new FormulacaoResponse(f.getId(), f.getNome(), f.getUsuario().getId(), f.getUsuario().getNome(),
                f.getEspecie().getId(), f.getEspecie().getNome(), f.getCnTotal(), f.getPhMedio(),
                f.getCriadoEm().toString(), f.getStatus().name(), f.cnDentroFaixa(),
                f.getInsumos().stream().map(FormulacaoInsumoResponse::from).toList());
        }
    }
    public record ExperimentoInsumoResponse(
            String insumoId,
            String nome,
            Double pesoKg
    ) {}
    // ── Custo por insumo no experimento ──────────────────────────────────────
    public record CustoInsumoItem(@NotBlank String insumoId, @NotNull @Positive Double custoPorKg) {}

    public record CustoInsumoResponse(String insumoId, String insumoNome, Double custoPorKg,
                                       Double pesoRealKg, Double custoTotal) {
        public static CustoInsumoResponse from(ExperimentoCusto ec, Double pesoRealKg) {
            return new CustoInsumoResponse(ec.getInsumo().getId(), ec.getInsumo().getNome(),
                ec.getCustoPorKg(), pesoRealKg,
                pesoRealKg != null ? ec.getCustoPorKg() * pesoRealKg : null);
        }
    }

    // ── Financeiro calculado ──────────────────────────────────────────────────
    public record FinanceiroResponse(
        Double custoTotalSubstrato,
        Double custoPorBloco,
        Double custoPorKgProduzido,
        Double totalColhidoKg,
        Double receitaTotal,
        Double margemReais,
        Double margemPct
    ) {}

    // ── Experimento ───────────────────────────────────────────────────────────
    public record ExperimentoRequest(@NotBlank String formulacaoId, @NotBlank String codigo,
        @NotNull LocalDate dataPreparo, @NotNull @Positive Integer totalBlocos,
        Double pesoBlocoKg, Double precoVendaKg,
        List<CustoInsumoItem> custos) {}

    public record ExperimentoResponse(
            String id,
            String codigo,
            String usuarioId,
            String usuarioNome,
            String formulacaoId,
            String formulacaoNome,
            String especieNome,
            LocalDate dataPreparo,
            LocalDate dataInoculacao,
            LocalDate amadurecimentoInicio,
            LocalDate amadurecimentoFim,
            LocalDate frutificacaoInicio,
            LocalDate frutificacaoFim,
            Integer totalBlocos,
            Double pesoBlocoKg,
            Double precoVendaKg,
            String status,
            Double cnTotal,
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

            return new ExperimentoResponse(
                    e.getId(),
                    e.getCodigo(),
                    e.getUsuario().getId(),
                    e.getUsuario().getNome(),
                    e.getFormulacao().getId(),
                    e.getFormulacao().getNome(),
                    e.getFormulacao().getEspecie().getNome(),
                    e.getDataPreparo(),
                    e.getDataInoculacao(),
                    e.getAmadurecimentoInicio(),
                    e.getAmadurecimentoFim(),
                    e.getFrutificacaoInicio(),
                    e.getFrutificacaoFim(),
                    e.getTotalBlocos(),
                    e.getPesoBlocoKg(),
                    e.getPrecoVendaKg(),
                    e.getStatus().name(),
                    e.getFormulacao().getCnTotal(),
                    custos,
                    insumos,
                    fin
            );
        }
    }

    public record StatusRequest(@NotBlank String status) {}

    public record MonitoramentoRequest(@NotBlank String sala, @NotNull LocalDate data,
        Double temperatura, Double umidade, String observacao) {}
    public record MonitoramentoResponse(String id, String sala, LocalDate data,
        Double temperatura, Double umidade, String observacao) {
        public static MonitoramentoResponse from(LoteMonitoramento m) {
            return new MonitoramentoResponse(m.getId(), m.getSala().name(), m.getData(),
                m.getTemperatura(), m.getUmidade(), m.getObservacao());
        }
    }

    public record ColheitaRequest(@NotNull LocalDate data, @NotNull @Positive Double pesoTotalKg, String notas) {}
    public record ColheitaResponse(String id, LocalDate data, Double pesoTotalKg, Double mediaPorBlocoKg, String notas) {
        public static ColheitaResponse from(Colheita c) {
            return new ColheitaResponse(c.getId(), c.getData(), c.getPesoTotalKg(), c.getMediaPorBlocoKg(), c.getNotas());
        }
    }

    public record CodigoSugestaoResponse(String codigo) {}

    // ── Relatório comparativo ─────────────────────────────────────────────────
    public record RelatorioFormulacaoItem(
        String formulacaoId, String formulacaoNome, String especieNome,
        int totalExperimentos, Double custoMedioSubstrato, Double cnTotal,
        Double mediaColheitaKg, Double margemMediaPct
    ) {}

    public record RelatorioExperimentoItem(
        String experimentoId, String codigo, String formulacaoNome, String especieNome,
        String usuarioNome, LocalDate dataPreparo, String status,
        Double custoSubstrato, Double custoPorKgProduzido,
        Double totalColhidoKg, Double receitaTotal, Double margemReais, Double margemPct
    ) {}

    public record RelatorioResponse(
            int totalExperimentos,
            int concluidos,
            int emAndamento,
            Double totalColhidoKg,
            Double receitaTotal,
            Double custoTotal,
            Double margemMediaPct,
            List<ExperimentoResponse> detalhes
    ) {}
}
