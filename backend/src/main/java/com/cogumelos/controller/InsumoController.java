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

import com.cogumelos.dto.insumo.InsumoRequest;
import com.cogumelos.dto.insumo.InsumoResponse;
import com.cogumelos.service.InsumoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/insumos")
@Tag(name = "Insumos", description = "Catálogo de materiais para formulação de substrato. POST/PUT/DELETE requer role ADMIN.")
public class InsumoController {

    private final InsumoService insumoService;

    InsumoController(InsumoService insumoService) {
        this.insumoService = insumoService;
    }

    @Operation(summary = "Listar insumos do tenant",
        description = "Retorna os insumos disponíveis para o tenant, ordenados por categoria.")
    @GetMapping
    public List<InsumoResponse> listar() {
        return insumoService.listar();
    }

    @Operation(summary = "Listar categorias de insumos")
    @GetMapping("/categorias")
    public List<String> categorias() {
        return insumoService.categorias();
    }

    @Operation(summary = "Criar insumo", description = "Cria um novo insumo no catálogo do tenant. Requer role ADMIN.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Insumo criado"),
        @ApiResponse(responseCode = "403", description = "Sem permissão — requer ADMIN")
    })
    @PostMapping
    public ResponseEntity<InsumoResponse> criar(@Valid @RequestBody InsumoRequest req) {
        return ResponseEntity.status(201).body(insumoService.criar(req));
    }

    @Operation(summary = "Atualizar insumo", description = "Atualiza os dados de um insumo. Requer role ADMIN.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Insumo atualizado"),
        @ApiResponse(responseCode = "404", description = "Insumo não encontrado"),
        @ApiResponse(responseCode = "403", description = "Sem permissão — requer ADMIN")
    })
    @PutMapping("/{id}")
    public InsumoResponse atualizar(
            @Parameter(description = "ID do insumo") @PathVariable String id,
            @Valid @RequestBody InsumoRequest req) {
        return insumoService.atualizar(id, req);
    }

    @Operation(summary = "Remover insumo", description = "Remove um insumo do catálogo. Requer role ADMIN.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Insumo removido"),
        @ApiResponse(responseCode = "404", description = "Insumo não encontrado")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(
            @Parameter(description = "ID do insumo") @PathVariable String id) {
        insumoService.deletar(id);
        return ResponseEntity.noContent().build();
    }
}
