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

package com.cogumelos.dto.tenant;

import com.cogumelos.domain.Tenant;
import com.cogumelos.domain.Usuario;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record TenantAdminResponse(
        Long id, String nome, String email,
        String plano, String status,
        LocalDate trialExpira, LocalDate assinaturaExpira,
        LocalDateTime criadoEm,
        String usuarioAdminNome, String usuarioAdminEmail,
        long totalExperimentos, long totalUsuarios
) {
    public static TenantAdminResponse from(Tenant t, Usuario admin,
                                           long experimentos, long usuarios) {
        return new TenantAdminResponse(
                t.getId(), t.getNome(), t.getEmail(),
                t.getPlano().name(), t.getStatus().name(),
                t.getTrialExpira(), t.getAssinaturaExpira(),
                t.getCriadoEm(),
                admin != null ? admin.getNome() : "—",
                admin != null ? admin.getEmail() : "—",
                experimentos, usuarios
        );
    }
}
