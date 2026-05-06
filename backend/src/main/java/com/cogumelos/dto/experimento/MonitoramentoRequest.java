package com.cogumelos.dto.experimento;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.time.LocalDate;

public record MonitoramentoRequest(@NotBlank String sala, @NotNull LocalDate data,
                                   Double temperatura, Double umidade, String observacao, Integer blocosPerdidos) {}
