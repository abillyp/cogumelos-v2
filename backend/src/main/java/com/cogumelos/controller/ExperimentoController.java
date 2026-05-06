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

package com.cogumelos.controller;

import com.cogumelos.dto.custos.AtualizarCustosRequest;
import com.cogumelos.dto.experimento.*;
import com.cogumelos.enums.Fase;
import com.cogumelos.service.ExperimentoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/experimentos")
@Tag(name = "Experimentos", description = "Gestão de lotes de cultivo — pipeline de status, monitoramento e colheitas")
public class ExperimentoController {

    private final ExperimentoService service;

    public ExperimentoController(ExperimentoService service) {
        this.service = service;
    }

    @Operation(summary = "Listar experimentos do tenant", description = "Retorna todos os lotes do produtor autenticado.")
    @ApiResponse(responseCode = "200", description = "Lista de experimentos")
    @GetMapping
    public List<ExperimentoResponse> listar() {
        return service.listar();
    }

    @Operation(summary = "Buscar experimento por ID")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Experimento encontrado"),
        @ApiResponse(responseCode = "404", description = "Experimento não encontrado")
    })
    @GetMapping("/{id}")
    public ExperimentoResponse buscar(
            @Parameter(description = "ID do experimento") @PathVariable String id) {
        return service.buscar(id);
    }

    @Operation(summary = "Sugestão de código para novo experimento",
        description = "Retorna o próximo código no formato EXP-AAAA-NNN.")
    @GetMapping("/codigo-sugestao")
    public CodigoSugestaoResponse codigoSugestao() {
        return service.gerarCodigoSugestao();
    }

    @Operation(summary = "Criar novo experimento",
        description = "Cria um lote vinculado a uma formulação. Status inicial: PREPARACAO.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Experimento criado"),
        @ApiResponse(responseCode = "400", description = "Dados inválidos"),
        @ApiResponse(responseCode = "409", description = "Código já existe")
    })
    @PostMapping
    public ResponseEntity<ExperimentoResponse> criar(
            @Valid @RequestBody ExperimentoRequest req,
            Authentication auth) {
        String userId = (String) auth.getPrincipal();
        return ResponseEntity.status(201).body(service.criar(req, userId));
    }

    @Operation(summary = "Avançar status do experimento",
        description = "Avança para o próximo status no pipeline: PREPARACAO → INOCULADO → AMADURECIMENTO → FRUTIFICACAO → CONCLUIDO.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Status avançado"),
        @ApiResponse(responseCode = "400", description = "Experimento já concluído"),
        @ApiResponse(responseCode = "404", description = "Experimento não encontrado")
    })
    @PatchMapping("/{id}/avancar")
    public ExperimentoResponse avancar(
            @Parameter(description = "ID do experimento") @PathVariable String id, @RequestBody(required = false) AvancarRequest req) {
        Fase proximaFase = req != null ? req.proximoStatus() : null;
        return service.avancarStatus(id, proximaFase);
    }

    @Operation(summary = "Atualizar custos e preço de venda do experimento")
    @PatchMapping("/{id}/custos")
    public ExperimentoResponse atualizarCustos(
            @Parameter(description = "ID do experimento") @PathVariable String id,
            @Valid @RequestBody AtualizarCustosRequest req) {
        return service.atualizarCustos(id, req.custos(), req.precoVendaKg());
    }

    // ── Monitoramentos ───────────────────────────────────────────────────────

    @Operation(summary = "Listar monitoramentos do experimento",
        description = "Retorna registros de temperatura e umidade, ordenados do mais recente.")
    @GetMapping("/{id}/monitoramentos")
    public List<MonitoramentoResponse> monitoramentos(
            @Parameter(description = "ID do experimento") @PathVariable String id) {
        return service.listarMonitoramentos(id);
    }

    @Operation(summary = "Registrar monitoramento",
        description = "Adiciona um registro de temperatura/umidade para o experimento.")
    @ApiResponse(responseCode = "201", description = "Monitoramento registrado")
    @PostMapping("/{id}/monitoramentos")
    public ResponseEntity<MonitoramentoResponse> addMonitoramento(
            @Parameter(description = "ID do experimento") @PathVariable String id,
            @Valid @RequestBody MonitoramentoRequest req) {
        return ResponseEntity.status(201).body(service.adicionarMonitoramento(id, req));
    }

    // ── Colheitas ─────────────────────────────────────────────────────────────

    @Operation(summary = "Listar colheitas do experimento")
    @GetMapping("/{id}/colheitas")
    public List<ColheitaResponse> colheitas(
            @Parameter(description = "ID do experimento") @PathVariable String id) {
        return service.listarColheitas(id);
    }

    @Operation(summary = "Registrar colheita",
        description = "Adiciona um registro de colheita com peso total (kg).")
    @ApiResponse(responseCode = "201", description = "Colheita registrada")
    @PostMapping("/{id}/colheitas")
    public ResponseEntity<ColheitaResponse> addColheita(
            @Parameter(description = "ID do experimento") @PathVariable String id,
            @Valid @RequestBody ColheitaRequest req) {
        return ResponseEntity.status(201).body(service.adicionarColheita(id, req));
    }

    @Operation(summary = "Deletar experimento")
    @ApiResponse(responseCode = "204", description = "Experimento deletado")
    @PreAuthorize("hasAnyRole('ADMIN', 'ADMIN_TENANT')")
    @DeleteMapping("/{id}")
    public ResponseEntity<ExperimentoResponse> deleteExperimento(@Parameter(description = "ID do experimento")  @PathVariable String id,
                                                                 Authentication auth) {
        String userId = (String) auth.getPrincipal();
        service.deletar(id, userId);
        return ResponseEntity.noContent().build();
    }

    @Operation(summary = "Consultar associaçoes a experimento")
    @GetMapping("{id}/resumo-delete")
    public ExperimentoAssociacaoResponse consultarAssociaao(@Parameter(description = "ID do experimento")  @PathVariable String id) {
        return service.consultarAssociacao(id);
    }
}
