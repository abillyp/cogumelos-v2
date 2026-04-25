/*
 * Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
 * Todos os direitos reservados.
 *
 * Este arquivo é parte do sistema cogumelos.app e está protegido pela
 * Lei Brasileira de Direitos Autorais (Lei nº 9.610/1998).
 * Uso, cópia ou distribuição não autorizados são expressamente proibidos.
 *
 * Contato: alessandro.palma@organico4you.com.br
 */

package com.cogumelos.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.*;

@DisplayName("Insumo — testes unitários da entidade")
class InsumoEntityTest {

    private Insumo criarInsumo(double carbonoPct, double nitrogenioPct) {
        Insumo i = new Insumo();
        i.setId("test-id");
        i.setNome("Serragem Teste");
        i.setMoPct(0.95);
        i.setCarbonoPct(carbonoPct);
        i.setNitrogenioPct(nitrogenioPct);
        i.calcularCnRatio(); // simula @PrePersist
        return i;
    }

    @Test
    @DisplayName("calcularCnRatio() deve computar C/N corretamente")
    void calcularCnRatio_deveRetornarValorCorreto() {
        Insumo i = criarInsumo(0.50, 0.005);
        assertThat(i.getCnRatio()).isCloseTo(100.0, within(0.01));
    }

    @Test
    @DisplayName("calcularCnRatio() com nitrogenio zero não deve lançar exceção")
    void calcularCnRatio_nitrogênioZero_naoDeveCalcular() {
        Insumo i = new Insumo();
        i.setCarbonoPct(0.50);
        i.setNitrogenioPct(0.0);
        assertThatCode(i::calcularCnRatio).doesNotThrowAnyException();
        assertThat(i.getCnRatio()).isNull();
    }

    @Test
    @DisplayName("calcularCnRatio() com nitrogenio null não deve lançar exceção")
    void calcularCnRatio_nitrogênioNull_naoDeveCalcular() {
        Insumo i = new Insumo();
        i.setCarbonoPct(0.50);
        i.setNitrogenioPct(null);
        assertThatCode(i::calcularCnRatio).doesNotThrowAnyException();
        assertThat(i.getCnRatio()).isNull();
    }

    @Test
    @DisplayName("serragem de eucalipto deve ter C/N alto (>100)")
    void serragemEucalipto_cnRatio_deveSerAlto() {
        // valores típicos de serragem: C=49%, N=0.1%
        Insumo serragem = criarInsumo(0.49, 0.001);
        assertThat(serragem.getCnRatio()).isGreaterThan(100.0);
    }

    @Test
    @DisplayName("farelo de trigo deve ter C/N baixo (<30)")
    void fareloTrigo_cnRatio_deveSerBaixo() {
        // valores típicos: C=44%, N=2.5%
        Insumo farelo = criarInsumo(0.44, 0.025);
        assertThat(farelo.getCnRatio()).isLessThan(30.0);
    }
}
