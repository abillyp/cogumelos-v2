package com.cogumelos.dto.formulacao;

import jakarta.validation.constraints.NotBlank;

public record StatusRequest(@NotBlank String status) {}