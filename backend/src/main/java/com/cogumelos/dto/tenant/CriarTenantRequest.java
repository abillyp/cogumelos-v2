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
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record CriarTenantRequest(
        @NotBlank String nome,
        @NotBlank @Email String email,
        @NotBlank String nomeAdmin,
        @NotBlank String emailAdmin,
        @NotBlank String senhaAdmin,
        @NotNull PlanoType plano
) {}
