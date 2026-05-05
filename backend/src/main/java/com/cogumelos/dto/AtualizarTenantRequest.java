package com.cogumelos.dto;

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
