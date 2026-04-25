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

package com.cogumelos.controller;

import com.cogumelos.dto.Dtos.*;
import com.cogumelos.service.ExperimentoService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/experimentos")
public class ExperimentoController {

    private final ExperimentoService service;

    public ExperimentoController(ExperimentoService service) {
        this.service = service;
    }

    @GetMapping
    public List<ExperimentoResponse> listar() {
        return service.listar(); // ✅ sem userId/isAdmin
    }

    @GetMapping("/{id}")
    public ExperimentoResponse buscar(@PathVariable String id) {
        return service.buscar(id); // ✅ sem userId/isAdmin
    }

    @GetMapping("/codigo-sugestao")
    public CodigoSugestaoResponse codigoSugestao() {
        return service.gerarCodigoSugestao(); // ✅ sem userId
    }

    @PostMapping
    public ResponseEntity<ExperimentoResponse> criar(
            @Valid @RequestBody ExperimentoRequest req,
            Authentication auth) {
        // userId ainda necessário para vincular o criador do experimento
        String userId = (String) auth.getPrincipal();
        return ResponseEntity.status(201).body(service.criar(req, userId));
    }

    @PatchMapping("/{id}/avancar")
    public ExperimentoResponse avancar(@PathVariable String id) {
        return service.avancarStatus(id); // ✅ sem userId/isAdmin
    }

    // ✅ DTO tipado em vez de Map<String, Object>
    @PatchMapping("/{id}/custos")
    public ExperimentoResponse atualizarCustos(
            @PathVariable String id,
            @Valid @RequestBody AtualizarCustosRequest req) {
        return service.atualizarCustos(id, req.custos(), req.precoVendaKg());
    }

    @GetMapping("/{id}/monitoramentos")
    public List<MonitoramentoResponse> monitoramentos(@PathVariable String id) {
        return service.listarMonitoramentos(id); // ✅ sem userId/isAdmin
    }

    @PostMapping("/{id}/monitoramentos")
    public ResponseEntity<MonitoramentoResponse> addMonitoramento(
            @PathVariable String id,
            @Valid @RequestBody MonitoramentoRequest req) {
        return ResponseEntity.status(201)
                .body(service.adicionarMonitoramento(id, req));
    }

    @GetMapping("/{id}/colheitas")
    public List<ColheitaResponse> colheitas(@PathVariable String id) {
        return service.listarColheitas(id); // ✅ sem userId/isAdmin
    }

    @PostMapping("/{id}/colheitas")
    public ResponseEntity<ColheitaResponse> addColheita(
            @PathVariable String id,
            @Valid @RequestBody ColheitaRequest req) {
        return ResponseEntity.status(201)
                .body(service.adicionarColheita(id, req));
    }
}