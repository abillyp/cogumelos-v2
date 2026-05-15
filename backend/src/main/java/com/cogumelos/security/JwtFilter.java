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

package com.cogumelos.security;

import com.cogumelos.service.JwtService;
import jakarta.servlet.*;
import jakarta.servlet.http.*;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private final JwtService jwtService;

    public JwtFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest req,
                                    HttpServletResponse res,
                                    FilterChain chain)
            throws ServletException, IOException {

        // 1. Tenta cookie HttpOnly (mais seguro — imune a XSS)
        String token = null;
        if (req.getCookies() != null) {
            for (jakarta.servlet.http.Cookie c : req.getCookies()) {
                if ("accessToken".equals(c.getName())) {
                    token = c.getValue();
                    break;
                }
            }
        }

        // 2. Fallback: header Authorization (Swagger / clientes de API)
        if (token == null) {
            String header = req.getHeader("Authorization");
            if (header != null && header.startsWith("Bearer ")) {
                token = header.substring(7);
            }
        }

        if (token != null) {
            try {
                if (jwtService.isValid(token)) {

                    // autentica no Spring Security
                    String userId = jwtService.getUserId(token);
                    String role   = jwtService.getRole(token);

                    var auth = new UsernamePasswordAuthenticationToken(
                            userId, null,
                            List.of(new SimpleGrantedAuthority("ROLE_" + role))
                    );
                    SecurityContextHolder.getContext().setAuthentication(auth);

                    // popula TenantContext
                    Long tenantId = jwtService.extractTenantId(token);
                    String plano  = jwtService.extractPlano(token);

                    TenantContext.setTenantId(tenantId);
                    TenantContext.setPlano(plano);
                }
            } catch (Exception ignored) {}
        }

        try {
            chain.doFilter(req, res);
        } finally {
            TenantContext.clear(); // crítico — evita vazamento entre requests
        }
    }
}