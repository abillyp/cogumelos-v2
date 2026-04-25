package com.cogumelos.controller;

import com.cogumelos.dto.Dtos;
import com.cogumelos.service.FormulacaoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/formulacoes")
@Tag(name = "Formulações", description = "Formulações de substrato com cálculo de C/N em tempo real")
class FormulacaoController {

    private final FormulacaoService service;

    FormulacaoController(FormulacaoService service) { this.service = service; }

    @Operation(summary = "Listar formulações do tenant")
    @ApiResponse(responseCode = "200", description = "Lista de formulações ordenadas por data de criação")
    @GetMapping
    public List<Dtos.FormulacaoResponse> listar() {
        return service.listar();
    }

    @Operation(summary = "Buscar formulação por ID")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Formulação encontrada"),
        @ApiResponse(responseCode = "404", description = "Formulação não encontrada")
    })
    @GetMapping("/{id}")
    public Dtos.FormulacaoResponse buscar(
            @Parameter(description = "ID da formulação") @PathVariable String id) {
        return service.buscar(id);
    }

    @Operation(summary = "Criar formulação",
        description = "Cria uma formulação de substrato. O C/N é calculado automaticamente com base nos insumos e umidades informados.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Formulação criada com C/N calculado"),
        @ApiResponse(responseCode = "400", description = "Dados inválidos ou insumo não encontrado"),
        @ApiResponse(responseCode = "404", description = "Espécie não encontrada")
    })
    @PostMapping
    public ResponseEntity<Dtos.FormulacaoResponse> criar(
            @Valid @RequestBody Dtos.FormulacaoRequest req,
            Authentication auth) {
        String userId = (String) auth.getPrincipal();
        return ResponseEntity.status(201).body(service.criar(req, userId));
    }

    @Operation(summary = "Atualizar status da formulação")
    @PatchMapping("/{id}/status")
    public Dtos.FormulacaoResponse status(
            @Parameter(description = "ID da formulação") @PathVariable String id,
            @Valid @RequestBody Dtos.StatusRequest req) {
        return service.atualizarStatus(id, req.status());
    }

    @Operation(summary = "Remover formulação")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Formulação removida"),
        @ApiResponse(responseCode = "404", description = "Formulação não encontrada")
    })
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(
            @Parameter(description = "ID da formulação") @PathVariable String id) {
        service.deletar(id);
        return ResponseEntity.noContent().build();
    }
}
