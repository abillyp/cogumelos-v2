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

import com.cogumelos.dto.Dtos;
import com.cogumelos.service.FormulacaoService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/formulacoes")
class FormulacaoController {

    private final FormulacaoService service;

    FormulacaoController(FormulacaoService service) { this.service = service; }

    @GetMapping
    public List<Dtos.FormulacaoResponse> listar() {
        return service.listar(); // ✅ sem userId/isAdmin
    }

    @GetMapping("/{id}")
    public Dtos.FormulacaoResponse buscar(@PathVariable String id) {
        return service.buscar(id); // ✅ sem userId/isAdmin
    }

    @PostMapping
    public ResponseEntity<Dtos.FormulacaoResponse> criar(
            @Valid @RequestBody Dtos.FormulacaoRequest req,
            Authentication auth) {
        String userId = (String) auth.getPrincipal();
        return ResponseEntity.status(201).body(service.criar(req, userId));
    }

    @PatchMapping("/{id}/status")
    public Dtos.FormulacaoResponse status(@PathVariable String id,
                                          @Valid @RequestBody Dtos.StatusRequest req) {
        return service.atualizarStatus(id, req.status()); // ✅ sem userId/isAdmin
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable String id) {
        service.deletar(id); // ✅ sem userId/isAdmin
        return ResponseEntity.noContent().build();
    }
}