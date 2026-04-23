/*
 * Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
 * Todos os direitos reservados.
 *
 * Este arquivo é parte do sistema cogumelos.app e está protegido pela
 * Lei Brasileira de Direitos Autorais (Lei nº 9.610/1998).
 * Uso, cópia ou distribuição não autorizados são expressamente proibidos.
 *
 * Contato: contato@cogumelos.app
 */

package com.cogumelos.service;

import com.cogumelos.domain.*;
import com.cogumelos.dto.Dtos.*;
import com.cogumelos.enums.Sala;
import com.cogumelos.enums.StatusSala;
import com.cogumelos.repository.*;
import com.cogumelos.security.TenantContext;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class ExperimentoService {

    private final ExperimentoRepository repo;
    private final FormulacaoRepository formulacaoRepo;
    private final UsuarioRepository usuarioRepo;
    private final LoteMonitoramentoRepository monitoramentoRepo;
    private final ColheitaRepository colheitaRepo;
    private final InsumoRepository insumoRepo;

    public ExperimentoService(ExperimentoRepository repo,
                              FormulacaoRepository formulacaoRepo,
                              UsuarioRepository usuarioRepo,
                              LoteMonitoramentoRepository monitoramentoRepo,
                              ColheitaRepository colheitaRepo,
                              InsumoRepository insumoRepo) {
        this.repo              = repo;
        this.formulacaoRepo    = formulacaoRepo;
        this.usuarioRepo       = usuarioRepo;
        this.monitoramentoRepo = monitoramentoRepo;
        this.colheitaRepo      = colheitaRepo;
        this.insumoRepo        = insumoRepo;
    }

    // ✅ helper central — evita repetir TenantContext.getTenantId() em todo lugar
    private Long tenantId() {
        return TenantContext.getTenantId();
    }

    // ✅ busca segura por id — sempre com tenantId
    private Experimento buscarSeguro(String id) {
        return repo.findByIdAndTenantId(id, tenantId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Experimento não encontrado"));
    }

    @Transactional(readOnly = true)
    public List<ExperimentoResponse> listar() {
        return repo.findByTenantIdOrderByDataPreparoDesc(tenantId())
                .stream()
                .map(e -> ExperimentoResponse.from(e, calcularFinanceiro(e)))
                .toList();
    }

    @Transactional(readOnly = true)
    public ExperimentoResponse buscar(String id) {
        Experimento e = buscarSeguro(id);
        return ExperimentoResponse.from(e, calcularFinanceiro(e));
    }

    @Transactional(readOnly = true)
    public CodigoSugestaoResponse gerarCodigoSugestao() {
        long count = repo.countByTenantId(tenantId()) + 1;
        String ano = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy"));
        String codigo = String.format("EXP-%s-%03d", ano, count);
        return new CodigoSugestaoResponse(codigo);
    }

    @Transactional
    public ExperimentoResponse criar(ExperimentoRequest req, String userId) {
        Long tid = tenantId();

        Usuario usuario = usuarioRepo.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Usuário não encontrado"));

        // ✅ busca formulação dentro do tenant
        Formulacao formulacao = formulacaoRepo.findByIdAndTenantId(req.formulacaoId(), tid)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Formulação não encontrada"));

        // ✅ código único por tenant
        if (repo.existsByCodigoAndTenantId(req.codigo(), tid))
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "Já existe um experimento com o código \"" + req.codigo() + "\"");

        Experimento e = new Experimento();
        e.setId(UUID.randomUUID().toString());
        e.setTenantId(tid);           // ✅ injeta tenant
        e.setUsuario(usuario);
        e.setFormulacao(formulacao);
        e.setCodigo(req.codigo());
        e.setDataPreparo(req.dataPreparo());
        e.setTotalBlocos(req.totalBlocos());
        e.setPesoBlocoKg(req.pesoBlocoKg());

        return ExperimentoResponse.from(repo.save(e), calcularFinanceiro(e));
    }

    @Transactional
    public ExperimentoResponse avancarStatus(String id) {
        Experimento e = buscarSeguro(id);
        LocalDate hoje = LocalDate.now();

        switch (e.getStatus()) {
            case PREPARACAO     -> { e.setDataInoculacao(hoje);       e.setStatus(StatusSala.INOCULADO); }
            case INOCULADO      -> { e.setAmadurecimentoInicio(hoje); e.setStatus(StatusSala.AMADURECIMENTO); }
            case AMADURECIMENTO -> { e.setAmadurecimentoFim(hoje);
                e.setFrutificacaoInicio(hoje);   e.setStatus(StatusSala.FRUTIFICACAO); }
            case FRUTIFICACAO   -> { e.setFrutificacaoFim(hoje);      e.setStatus(StatusSala.CONCLUIDO); }
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Experimento já concluído.");
        }

        return ExperimentoResponse.from(repo.save(e), calcularFinanceiro(e));
    }

    @Transactional
    public MonitoramentoResponse adicionarMonitoramento(String expId, MonitoramentoRequest req) {
        Experimento e = buscarSeguro(expId);

        LoteMonitoramento m = new LoteMonitoramento();
        m.setId(UUID.randomUUID().toString());
        m.setTenantId(tenantId());    // ✅ injeta tenant
        m.setExperimento(e);
        m.setSala(Sala.valueOf(req.sala()));
        m.setData(req.data());
        m.setTemperatura(req.temperatura());
        m.setUmidade(req.umidade());
        m.setObservacao(req.observacao());

        return MonitoramentoResponse.from(monitoramentoRepo.save(m));
    }

    @Transactional(readOnly = true)
    public List<MonitoramentoResponse> listarMonitoramentos(String expId) {
        buscarSeguro(expId); // garante que o experimento pertence ao tenant
        return monitoramentoRepo
                .findByExperimentoIdAndTenantIdOrderByDataDesc(expId, tenantId())
                .stream().map(MonitoramentoResponse::from).toList();
    }

    @Transactional
    public ColheitaResponse adicionarColheita(String expId, ColheitaRequest req) {
        Experimento e = buscarSeguro(expId);

        Colheita c = new Colheita();
        c.setId(UUID.randomUUID().toString());
        c.setTenantId(tenantId());    // ✅ injeta tenant
        c.setExperimento(e);
        c.setData(req.data());
        c.setPesoTotalKg(req.pesoTotalKg());
        c.setNotas(req.notas());

        return ColheitaResponse.from(colheitaRepo.save(c));
    }

    @Transactional(readOnly = true)
    public List<ColheitaResponse> listarColheitas(String expId) {
        buscarSeguro(expId); // garante que o experimento pertence ao tenant
        return colheitaRepo
                .findByExperimentoIdAndTenantId(expId, tenantId())
                .stream().map(ColheitaResponse::from).toList();
    }

    @Transactional
    public ExperimentoResponse atualizarCustos(String id, List<CustoInsumoItem> itens,
                                               Double precoVendaKg) {
        Long tid = tenantId();
        Experimento e = buscarSeguro(id);

        if (precoVendaKg != null) e.setPrecoVendaKg(precoVendaKg);

        if (itens != null) {
            e.getCustos().clear();

            for (CustoInsumoItem item : itens) {
                // ✅ busca insumo dentro do tenant
                Insumo insumo = insumoRepo.findByIdAndTenantId(item.insumoId(), tid)
                        .orElseThrow(() -> new ResponseStatusException(
                                HttpStatus.NOT_FOUND, "Insumo não encontrado: " + item.insumoId()));

                ExperimentoCusto ec = new ExperimentoCusto();
                ec.setTenantId(tid);  // ✅ injeta tenant
                ec.setExperimento(e);
                ec.setInsumo(insumo);
                ec.setCustoPorKg(item.custoPorKg());
                e.addCusto(ec);
            }
        }

        return ExperimentoResponse.from(repo.save(e), calcularFinanceiro(e));
    }

    @Transactional(readOnly = true)
    public RelatorioResponse gerarRelatorio() {
        Long tid = tenantId();
        List<Experimento> experimentos = repo.findByTenantIdOrderByDataPreparoDesc(tid);

        int total        = experimentos.size();
        long concluidos  = experimentos.stream()
                .filter(e -> e.getStatus() == StatusSala.CONCLUIDO).count();
        long emAndamento = total - concluidos;

        // busca todas as colheitas do tenant agrupadas por experimento — evita N queries
        List<Colheita> todasColheitas = colheitaRepo.findByTenantId(tid);

        double totalColhidoKgGlobal = todasColheitas.stream()
                .mapToDouble(Colheita::getPesoTotalKg).sum();

        // mapa de colheitas por experimento para lookup O(1)
        java.util.Map<String, Double> colheitasPorExp = todasColheitas.stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        c -> c.getExperimento().getId(),
                        java.util.stream.Collectors.summingDouble(Colheita::getPesoTotalKg)
                ));

        double receitaTotal = 0, custoTotal = 0;
        List<ExperimentoResponse> detalhes = new ArrayList<>();

        for (Experimento e : experimentos) {
            double colhidoKg = colheitasPorExp.getOrDefault(e.getId(), 0.0);
            FinanceiroResponse fin = calcularFinanceiro(e, colhidoKg);
            receitaTotal += fin.receitaTotal();
            custoTotal   += fin.custoTotalSubstrato();
            detalhes.add(ExperimentoResponse.from(e, fin));
        }

        double margemMedia = receitaTotal > 0
                ? ((receitaTotal - custoTotal) / receitaTotal) * 100 : 0.0;

        return new RelatorioResponse(total, (int) concluidos, (int) emAndamento,
                totalColhidoKgGlobal, receitaTotal, custoTotal, margemMedia, detalhes);
    }

    // chamado nas rotas individuais — busca colheitas do banco
    private FinanceiroResponse calcularFinanceiro(Experimento e) {
        List<Colheita> colheitas = colheitaRepo
                .findByExperimentoIdAndTenantId(e.getId(), tenantId());
        double totalColhidoKg = colheitas.stream()
                .mapToDouble(Colheita::getPesoTotalKg).sum();
        return calcularFinanceiro(e, totalColhidoKg);
    }

    // chamado pelo relatório — recebe totalColhidoKg já calculado (evita N queries)
    private FinanceiroResponse calcularFinanceiro(Experimento e, double totalColhidoKg) {
        double custoTotalSubstrato = e.getCustos() == null ? 0.0 :
                e.getCustos().stream().mapToDouble(ec -> {
                    double pesoKg = e.getFormulacao().getInsumos().stream()
                            .filter(fi -> fi.getInsumo().getId().equals(ec.getInsumo().getId()))
                            .mapToDouble(FormulacaoInsumo::getPesoRealKg)
                            .findFirst().orElse(0.0);
                    return ec.getCustoPorKg() * pesoKg;
                }).sum();

        int totalBlocos = e.getTotalBlocos() != null && e.getTotalBlocos() > 0
                ? e.getTotalBlocos() : 1;

        double custoPorBloco       = custoTotalSubstrato / totalBlocos;
        double custoPorKgProduzido = totalColhidoKg > 0
                ? custoTotalSubstrato / totalColhidoKg : 0.0;
        double receitaTotal = totalColhidoKg *
                (e.getPrecoVendaKg() != null ? e.getPrecoVendaKg() : 0.0);
        double margemReais  = receitaTotal - custoTotalSubstrato;
        double margemPct    = receitaTotal > 0
                ? (margemReais / receitaTotal) * 100 : 0.0;

        return new FinanceiroResponse(custoTotalSubstrato, custoPorBloco,
                custoPorKgProduzido, totalColhidoKg, receitaTotal, margemReais, margemPct);
    }
}