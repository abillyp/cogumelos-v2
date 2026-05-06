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

import com.cogumelos.enums.PlanoType;
import com.cogumelos.enums.StatusTenant;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record AtualizarTenantRequest(
        String nome,
        @NotNull PlanoType plano,
        @NotNull StatusTenant status,
        LocalDate trialExpira,
        LocalDate assinaturaExpira
) {}
