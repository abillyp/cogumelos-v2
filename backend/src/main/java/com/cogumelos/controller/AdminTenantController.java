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

import com.cogumelos.dto.tenant.AtualizarTenantRequest;
import com.cogumelos.dto.tenant.TenantAdminResponse;
import com.cogumelos.dto.tenant.CriarTenantRequest;
import com.cogumelos.dto.usuario.UsuarioResponse;
import com.cogumelos.security.TenantContext;
import com.cogumelos.service.TenantService;
import com.cogumelos.service.UsuarioService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/tenants")
@Tag(name = "Admin — Tenants", description = "Gestão de tenants pelo administrador global. Requer role ADMIN.")
public class AdminTenantController {

    private final TenantService       tenantService;
    private final UsuarioService      usuarioService;

    public AdminTenantController(TenantService tenantService, UsuarioService usuarioService) {
        this.tenantService = tenantService;
        this.usuarioService = usuarioService;
    }


    @Operation(summary = "Listar todos os tenants",
        description = "Retorna todos os tenants com métricas de uso. Requer role ADMIN.")
    @GetMapping
    public List<TenantAdminResponse> listar() {
        return tenantService.listar();
    }

    @Operation(summary = "Buscar tenant por ID")
    @GetMapping("/{id}")
    public TenantAdminResponse buscar(@PathVariable Long id) {
        return tenantService.buscar(id);
    }

    @Operation(summary = "Atualizar plano, status e datas de expiração do tenant")
    @PatchMapping("/{id}")
    public TenantAdminResponse atualizar(@PathVariable Long id,
                                         @Valid @RequestBody AtualizarTenantRequest req) {
        return tenantService.atualizar(id, req);
    }

    @Operation(summary = "Estender trial do tenant em N dias")
    @PostMapping("/{id}/estender-trial")
    public TenantAdminResponse estenderTrial(@PathVariable Long id,
                                              @RequestBody java.util.Map<String, Integer> body) {
        return tenantService.estenderTrial(id, body);
    }

    @Operation(summary = "Criar novo tenant manualmente")
    @PostMapping
    public ResponseEntity<TenantAdminResponse> criar(@Valid @RequestBody CriarTenantRequest req) {
        return ResponseEntity.status(201).body(tenantService.criar(req));
    }

    @Operation(summary = "Resumo geral para o dashboard admin")
    @GetMapping("/resumo")
    public java.util.Map<String, Object> resumo() {
        return tenantService.resumo();
    }

    @Operation(summary = "Lista todos os usuários de um tenant")
    @GetMapping("{tenantId}/usuarios")
    public List<UsuarioResponse> usuarios(@PathVariable("tenantId") String tenantId) {
            return tenantService.listar(Long.valueOf(tenantId));
    }


    @PreAuthorize("hasAnyRole('ADMIN')")
    @DeleteMapping("/{tenantId}/usuarios/{usuarioId}")
    public ResponseEntity<Void> deletar(@PathVariable("tenantId")  String tenantId, @PathVariable("usuarioId") String usuarioId) {
        usuarioService.deletarUsuario(usuarioId, Long.valueOf(tenantId));
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasAnyRole('ADMIN')")
    @DeleteMapping("/{tenantId}")
    public ResponseEntity<Void> deletar(@PathVariable("tenantId")  Long tenantId) {
        tenantService.excluirTenant(tenantId);
        return ResponseEntity.noContent().build();
    }

}
