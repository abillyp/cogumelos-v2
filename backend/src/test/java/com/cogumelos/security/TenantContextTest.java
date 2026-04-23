/*
 * Copyright (c) 2026 Alessandro Billy Palma — cogumelos.app
 * Todos os direitos reservados.
 *
 * Este arquivo é parte do sistema cogumelos.app e está protegido pela
 * Lei Brasileira de Direitos Autorais (Lei nº 9.610/1998).
 * Uso, cópia ou distribuição não autorizados são expressamente proibidos.
 *
 * Contato: contato@cogumelos.app
 */

package com.cogumelos.security;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.concurrent.atomic.AtomicReference;

import static org.assertj.core.api.Assertions.*;

@DisplayName("TenantContext — testes unitários")
class TenantContextTest {

    @AfterEach
    void limpar() {
        TenantContext.clear();
    }

    @Test
    @DisplayName("setTenantId/getTenantId devem persistir valor na thread atual")
    void setGet_deveRetornarValorDefinido() {
        TenantContext.setTenantId(99L);
        assertThat(TenantContext.getTenantId()).isEqualTo(99L);
    }

    @Test
    @DisplayName("setPlano/getPlano devem persistir valor na thread atual")
    void setGetPlano_deveRetornarValorDefinido() {
        TenantContext.setPlano("TRIAL");
        assertThat(TenantContext.getPlano()).isEqualTo("TRIAL");
    }

    @Test
    @DisplayName("clear() deve remover tenantId e plano")
    void clear_deveRemoverValores() {
        TenantContext.setTenantId(1L);
        TenantContext.setPlano("ATIVO");
        TenantContext.clear();

        assertThat(TenantContext.getTenantId()).isNull();
        assertThat(TenantContext.getPlano()).isNull();
    }

    @Test
    @DisplayName("valores devem ser isolados entre threads diferentes")
    void valores_devemSerIsoladosEntrethreads() throws InterruptedException {
        TenantContext.setTenantId(1L);

        AtomicReference<Long> tenantIdOutraThread = new AtomicReference<>();
        Thread outraThread = new Thread(() -> {
            tenantIdOutraThread.set(TenantContext.getTenantId());
        });
        outraThread.start();
        outraThread.join();

        // outra thread não deve ver o valor da thread principal
        assertThat(tenantIdOutraThread.get()).isNull();
        // thread principal ainda mantém o valor
        assertThat(TenantContext.getTenantId()).isEqualTo(1L);
    }

    @Test
    @DisplayName("getTenantId() deve retornar null quando não definido")
    void getTenantId_semValor_deveRetornarNull() {
        assertThat(TenantContext.getTenantId()).isNull();
    }
}
