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

package com.cogumelos.controller;

import com.cogumelos.domain.Tenant;
import com.cogumelos.domain.Usuario;
import com.cogumelos.dto.Dtos.*;
import com.cogumelos.enums.Role;
import com.cogumelos.repository.TenantRepository;
import com.cogumelos.repository.UsuarioRepository;
import com.cogumelos.security.TenantContext;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UsuarioRepository repo;
    private final TenantRepository tenantRepo;
    private final BCryptPasswordEncoder encoder;

    public AdminController(UsuarioRepository repo, TenantRepository tenantRepo, BCryptPasswordEncoder encoder) {
        this.repo       = repo;
        this.tenantRepo = tenantRepo;
        this.encoder    = encoder;
    }

    // ✅ lista só usuários do tenant atual
    @GetMapping("/usuarios")
    public List<UsuarioResponse> listar() {
        return repo.findByTenantId(TenantContext.getTenantId())
                .stream().map(UsuarioResponse::from).toList();
    }

    // ✅ cria usuário dentro do tenant atual
    @PostMapping("/usuarios")
    public ResponseEntity<UsuarioResponse> criar(@RequestBody RegistroRequest req) {
        if (repo.existsByEmail(req.email()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Email já cadastrado");

        Usuario u = new Usuario();
        u.setId(UUID.randomUUID().toString());
        u.setNome(req.nome());
        u.setEmail(req.email());
        u.setSenhaHash(encoder.encode(req.senha()));
        u.setRole(Role.PRODUTOR);
        Tenant tenant = tenantRepo.findById(TenantContext.getTenantId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Tenant não encontrado"));
        u.setTenant(tenant); // ✅ vincula ao tenant

        return ResponseEntity.status(201).body(UsuarioResponse.from(repo.save(u)));
    }

    @PatchMapping("/usuarios/{id}")
    public UsuarioResponse atualizar(@PathVariable String id,
                                     @RequestBody UsuarioUpdateRequest req) {
        // ✅ busca dentro do tenant
        Usuario u = repo.findByIdAndTenantId(id, TenantContext.getTenantId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Usuário não encontrado"));

        if (req.nome() != null)  u.setNome(req.nome());
        if (req.role() != null)  u.setRole(Role.valueOf(req.role()));
        if (req.ativo() != null) u.setAtivo(req.ativo());

        return UsuarioResponse.from(repo.save(u));
    }

    @DeleteMapping("/usuarios/{id}")
    public ResponseEntity<Void> deletar(@PathVariable String id) {
        // ✅ confirma que pertence ao tenant antes de deletar
        repo.findByIdAndTenantId(id, TenantContext.getTenantId())
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND, "Usuário não encontrado"));

        repo.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}