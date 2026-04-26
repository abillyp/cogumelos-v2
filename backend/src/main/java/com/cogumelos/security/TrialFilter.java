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

import com.cogumelos.domain.Tenant;
import com.cogumelos.enums.StatusTenant;
import com.cogumelos.repository.TenantRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.time.LocalDate;
import java.util.Map;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class TrialFilter extends OncePerRequestFilter {

    private final TenantRepository tenantRepo;
    private final ObjectMapper objectMapper;

    // rotas que nunca bloqueamos — mesmo com trial expirado
    private static final Set<String> ROTAS_LIBERADAS = Set.of(
            "/api/auth/login",
            "/api/auth/registro",
            "/api/auth/refresh",
            "/api/auth/logout",
            "/actuator/health"
    );

    @Override
    public void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain chain)
            throws IOException, ServletException {

        String path = request.getRequestURI();

        // rotas públicas passam direto
        if (ROTAS_LIBERADAS.contains(path)) {
            chain.doFilter(request, response);
            return;
        }

        Long tenantId = TenantContext.getTenantId();

        // sem tenant no contexto — JwtFilter já vai rejeitar, deixa passar
        if (tenantId == null) {
            chain.doFilter(request, response);
            return;
        }

        Tenant tenant = tenantRepo.findById(tenantId).orElse(null);

        if (tenant == null) {
            bloquear(response, HttpStatus.UNAUTHORIZED, "Tenant não encontrado");
            return;
        }

        // verifica status do tenant
        switch (tenant.getStatus()) {

            case CANCELADO -> {
                bloquear(response, HttpStatus.FORBIDDEN,
                        "Assinatura cancelada. Entre em contato para reativar.");
                return;
            }

            case EXPIRADO -> {
                bloquear(response, HttpStatus.PAYMENT_REQUIRED,
                        "Assinatura expirada. Renove seu plano para continuar.");
                return;
            }

            case TRIAL -> {
                if (tenant.getTrialExpira() != null &&
                        LocalDate.now().isAfter(tenant.getTrialExpira())) {

                    // atualiza status para EXPIRADO automaticamente
                    tenant.setStatus(StatusTenant.EXPIRADO);
                    tenantRepo.save(tenant);

                    bloquear(response, HttpStatus.PAYMENT_REQUIRED,
                            "Período de trial encerrado. Assine um plano para continuar.");
                    return;
                }
            }

            case ATIVO -> {
                if (tenant.getAssinaturaExpira() != null &&
                        LocalDate.now().isAfter(tenant.getAssinaturaExpira())) {

                    tenant.setStatus(StatusTenant.EXPIRADO);
                    tenantRepo.save(tenant);

                    bloquear(response, HttpStatus.PAYMENT_REQUIRED,
                            "Assinatura expirada. Renove seu plano para continuar.");
                    return;
                }
            }
        }

        chain.doFilter(request, response);
    }

    private void bloquear(HttpServletResponse response,
                          HttpStatus status, String mensagem) throws IOException {
        response.setStatus(status.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding("UTF-8");
        objectMapper.writeValue(response.getWriter(),
                Map.of(
                        "erro", mensagem,
                        "status", status.value()
                )
        );
    }
}
