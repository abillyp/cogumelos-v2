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
