package com.cogumelos.dto.usuario;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record RegistroRequest(
        @NotBlank String nome,
        @NotBlank String nomeProdutor,  // ← novo
        @Email @NotBlank String email,
        @NotBlank String senha
) {}
