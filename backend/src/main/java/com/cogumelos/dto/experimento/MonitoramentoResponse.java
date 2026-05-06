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

package com.cogumelos.dto.experimento;

import com.cogumelos.domain.LoteMonitoramento;

import java.time.LocalDate;

public record MonitoramentoResponse(String id, String sala, LocalDate data,
                                    Double temperatura, Double umidade, Integer blocosPerdidos, String observacao) {
    public static MonitoramentoResponse from(LoteMonitoramento m) {
        return new MonitoramentoResponse(m.getId(), m.getSala().name(), m.getData(),
                m.getTemperatura(), m.getUmidade(), m.getBlocosPerdidos(), m.getObservacao());
    }
}
