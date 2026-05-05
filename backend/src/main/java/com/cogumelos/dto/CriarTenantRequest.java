package com.cogumelos.dto;

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
