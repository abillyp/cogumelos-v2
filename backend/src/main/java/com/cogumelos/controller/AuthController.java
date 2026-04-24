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

import com.cogumelos.domain.*;
import com.cogumelos.dto.Dtos.*;
import com.cogumelos.enums.PlanoType;
import com.cogumelos.enums.Role;
import com.cogumelos.repository.*;
import com.cogumelos.security.JwtService;
import com.cogumelos.service.TenantService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private static final Logger log = LoggerFactory.getLogger(AuthController.class);

    private final UsuarioRepository usuarioRepo;
    private final TenantRepository tenantRepo;
    private final RefreshTokenRepository refreshRepo;
    private final BCryptPasswordEncoder encoder;
    private final JwtService jwtService;
    private final TenantService tenantService;

    @Value("${jwt.refresh-expiration-days:30}")
    private int refreshDays;

    public AuthController(UsuarioRepository usuarioRepo,
                          TenantRepository tenantRepo,
                          RefreshTokenRepository refreshRepo,
                          BCryptPasswordEncoder encoder,
                          JwtService jwtService,
                          TenantService tenantService) {
        this.usuarioRepo   = usuarioRepo;
        this.tenantRepo    = tenantRepo;
        this.refreshRepo   = refreshRepo;
        this.encoder       = encoder;
        this.jwtService    = jwtService;
        this.tenantService = tenantService;
    }

    // ✅ login — passa tenantId e plano no token
    @PostMapping("/login")
    @Transactional
    public ResponseEntity<?> login(@Valid @RequestBody LoginRequest req) {
        Usuario u = usuarioRepo.findByEmail(req.email())
                .orElseThrow(() -> new RuntimeException("Email ou senha inválidos"));

        if (!u.isAtivo())
            throw new RuntimeException("Usuário inativo. Contate o administrador.");

        if (!encoder.matches(req.senha(), u.getSenhaHash()))
            throw new RuntimeException("Email ou senha inválidos");

        refreshRepo.deleteByUsuarioId(u.getId());

        String accessToken  = jwtService.gerar(
                u.getId(), u.getEmail(), u.getRole().name(),
                u.getTenant().getId(),           // ← novo
                u.getTenant().getPlano().name()  // ← novo
        );
        String refreshToken = criarRefreshToken(u);

        return ResponseEntity.ok(new AuthResponse(accessToken, refreshToken,
                u.getId(), u.getNome(), u.getEmail(), u.getRole().name()));
    }

    // ✅ registro — cria tenant + usuário ADMIN_TENANT
    @PostMapping("/registro")
    @Transactional
    public ResponseEntity<?> register(@Valid @RequestBody RegistroRequest req) {
        try {
            if (usuarioRepo.existsByEmail(req.email()))
                return ResponseEntity.badRequest()
                        .body(Map.of("erro", "Email já cadastrado"));

            // 1. cria o tenant
            Tenant tenant = new Tenant();
            tenant.setNome(req.nomeProdutor());   // nome do produtor/empresa
            tenant.setEmail(req.email());
            tenant.setTrialExpira(LocalDate.now().plusDays(14));
            tenantRepo.save(tenant);

            // 2. copia insumos do catálogo padrão para o novo tenant
            tenantService.inicializarTenant(tenant);

            // 4. cria o usuário ADMIN_TENANT vinculado ao tenant
            Usuario u = new Usuario();
            u.setId(UUID.randomUUID().toString());
            u.setNome(req.nome());
            u.setEmail(req.email());
            u.setSenhaHash(encoder.encode(req.senha()));
            u.setRole(Role.PRODUTOR);         // dono da conta
            u.setTenant(tenant);
            usuarioRepo.save(u);

            // 5. gera token já com tenantId e plano
            String accessToken = jwtService.gerar(
                    u.getId(), u.getEmail(), u.getRole().name(),
                    tenant.getId(),
                    tenant.getPlano().name()
            );
            String refreshToken = criarRefreshToken(u);

            return ResponseEntity.status(201).body(new AuthResponse(accessToken, refreshToken,
                    u.getId(), u.getNome(), u.getEmail(), u.getRole().name()));
        } catch (Exception e) {
            log.error("Erro no registro: {}", e.getMessage(), e);
            throw e;
        }
    }

    // ✅ refresh — passa tenantId e plano no novo token
    @PostMapping("/refresh")
    @Transactional
    public ResponseEntity<?> refresh(@RequestBody Map<String, String> body) {
        String tokenStr = body.get("refreshToken");
        if (tokenStr == null)
            return ResponseEntity.badRequest()
                    .body(Map.of("erro", "refreshToken obrigatório"));

        RefreshToken rt = refreshRepo.findByToken(tokenStr)
                .orElseThrow(() -> new RuntimeException("Token inválido"));

        if (!rt.isValido()) {
            refreshRepo.delete(rt);
            throw new RuntimeException("Token expirado. Faça login novamente.");
        }

        rt.setUsado(true);
        refreshRepo.save(rt);

        Usuario u = rt.getUsuario();
        if (!u.isAtivo()) throw new RuntimeException("Usuário inativo.");

        String novoAccess  = jwtService.gerar(
                u.getId(), u.getEmail(), u.getRole().name(),
                u.getTenant().getId(),           // ← novo
                u.getTenant().getPlano().name()  // ← novo
        );
        String novoRefresh = criarRefreshToken(u);

        return ResponseEntity.ok(new AuthResponse(novoAccess, novoRefresh,
                u.getId(), u.getNome(), u.getEmail(), u.getRole().name()));
    }

    @PostMapping("/logout")
    @Transactional
    public ResponseEntity<?> logout(@RequestBody Map<String, String> body) {
        String tokenStr = body.get("refreshToken");
        if (tokenStr != null) {
            refreshRepo.findByToken(tokenStr).ifPresent(rt -> {
                rt.setUsado(true);
                refreshRepo.save(rt);
            });
        }
        return ResponseEntity.ok(Map.of("mensagem", "Logout realizado com sucesso"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> me(org.springframework.security.core.Authentication auth) {
        String userId = (String) auth.getPrincipal();
        return usuarioRepo.findById(userId)
                .map(u -> ResponseEntity.ok(new AuthResponse(null, null,
                        u.getId(), u.getNome(), u.getEmail(), u.getRole().name())))
                .orElse(ResponseEntity.notFound().build());
    }

    private String criarRefreshToken(Usuario u) {
        RefreshToken rt = new RefreshToken();
        rt.setId(UUID.randomUUID().toString());
        rt.setToken(UUID.randomUUID().toString());
        rt.setUsuario(u);
        rt.setExpiraEm(LocalDateTime.now().plusDays(refreshDays));
        refreshRepo.save(rt);
        return rt.getToken();
    }
}