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

import com.cogumelos.domain.Usuario;
import com.cogumelos.dto.Dtos.*;
import com.cogumelos.enums.Role;
import com.cogumelos.repository.TenantRepository;
import com.cogumelos.repository.UsuarioRepository;
import com.cogumelos.security.TenantContext;
import com.cogumelos.service.TenantService;
import com.cogumelos.service.UsuarioService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {


    private final TenantService tenantService;
    private final UsuarioService usuarioService;

    public AdminController(TenantService tenantService, UsuarioService usuarioService) {
        this.tenantService = tenantService;
        this.usuarioService = usuarioService;
    }

    // ✅ lista só usuários do tenant atual
    @GetMapping("/usuarios")
    public List<UsuarioResponse> listar() {
        return tenantService.listar(TenantContext.getTenantId());
    }

    // ✅ cria usuário dentro do tenant atual
    @PostMapping("/usuarios")
    public ResponseEntity<UsuarioResponse> criar(@RequestBody RegistroRequest req) {
         return ResponseEntity.status(201).body(usuarioService.criar(req));
    }

    @PatchMapping("/usuarios/{id}")
    public UsuarioResponse atualizar(@PathVariable String id,
                                     @RequestBody UsuarioUpdateRequest req) {
        return usuarioService.atualizar(id, req);
    }

    @Transactional
    @PreAuthorize("hasAnyRole('ADMIN'")
    @DeleteMapping("/usuarios/{id}")
    public ResponseEntity<Void> deletar(@PathVariable String id) {
        usuarioService.deletar(id,TenantContext.getTenantId());
        return ResponseEntity.noContent().build();
    }
}