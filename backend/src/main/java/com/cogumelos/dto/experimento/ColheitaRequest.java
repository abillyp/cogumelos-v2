package com.cogumelos.dto.experimento;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.time.LocalDate;

public record ColheitaRequest(@NotNull LocalDate data, @NotNull @Positive Double pesoTotalKg, String notas) {}
