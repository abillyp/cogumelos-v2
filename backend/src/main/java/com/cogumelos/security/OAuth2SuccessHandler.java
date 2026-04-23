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

package com.cogumelos.security;

import com.cogumelos.domain.*;
import com.cogumelos.enums.Role;
import com.cogumelos.repository.*;
import com.cogumelos.service.TenantService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.UUID;

@Component
public class OAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {

    private final UsuarioRepository usuarioRepo;
    private final TenantRepository tenantRepo;
    private final RefreshTokenRepository refreshRepo;
    private final JwtService jwtService;
    private final TenantService tenantService;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${jwt.refresh-expiration-days:30}")
    private int refreshDays;

    public OAuth2SuccessHandler(UsuarioRepository usuarioRepo,
                                TenantRepository tenantRepo,
                                RefreshTokenRepository refreshRepo,
                                JwtService jwtService,
                                TenantService tenantService) {
        this.usuarioRepo   = usuarioRepo;
        this.tenantRepo    = tenantRepo;
        this.refreshRepo   = refreshRepo;
        this.jwtService    = jwtService;
        this.tenantService = tenantService;
    }

    @Override
    @Transactional
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException {

        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        String email = oAuth2User.getAttribute("email");
        String nome  = oAuth2User.getAttribute("name");

        if (email == null) {
            response.sendRedirect(frontendUrl + "/login?erro=email_nao_autorizado");
            return;
        }

        Usuario usuario = usuarioRepo.findByEmail(email)
                .orElseGet(() -> criarUsuario(email, nome));

        if (!usuario.isAtivo()) {
            response.sendRedirect(frontendUrl + "/login?erro=inativo");
            return;
        }

        refreshRepo.deleteByUsuarioId(usuario.getId());

        String accessToken  = jwtService.gerar(
                usuario.getId(), usuario.getEmail(), usuario.getRole().name(),
                usuario.getTenant().getId(),
                usuario.getTenant().getPlano().name()
        );
        String refreshToken = criarRefreshToken(usuario);

        response.sendRedirect(frontendUrl + "/oauth2/callback"
                + "?token=" + accessToken
                + "&refreshToken=" + refreshToken);
    }

    private Usuario criarUsuario(String email, String nome) {
        Tenant tenant = new Tenant();
        tenant.setNome(nome != null ? nome : email);
        tenant.setEmail(email);
        tenant.setTrialExpira(LocalDate.now().plusDays(14));
        tenantRepo.save(tenant);

        tenantService.inicializarTenant(tenant);

        Usuario u = new Usuario();
        u.setId(UUID.randomUUID().toString());
        u.setNome(nome != null ? nome : email);
        u.setEmail(email);
        u.setSenhaHash("OAUTH2_NO_PASSWORD");
        u.setRole(Role.ADMIN_TENANT);
        u.setTenant(tenant);
        return usuarioRepo.save(u);
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