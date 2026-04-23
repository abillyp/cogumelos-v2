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

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.assertj.core.api.Assertions.*;

@DisplayName("JwtService — testes unitários")
class JwtServiceTest {

    private JwtService jwtService;

    private static final String SECRET = "test-secret-key-minimo-32-caracteres-seguro-ok";
    private static final long   EXPIRATION = 900_000L; // 15 min

    @BeforeEach
    void setUp() {
        jwtService = new JwtService();
        ReflectionTestUtils.setField(jwtService, "secret",     SECRET);
        ReflectionTestUtils.setField(jwtService, "expiration", EXPIRATION);
    }

    @Test
    @DisplayName("gerar() deve criar token com claims corretos")
    void gerar_deveConterClaims() {
        String token = jwtService.gerar("user-1", "billy@test.com", "ADMIN_TENANT", 42L, "TRIAL");

        assertThat(token).isNotBlank();
        assertThat(jwtService.getUserId(token)).isEqualTo("user-1");
        assertThat(jwtService.getEmail(token)).isEqualTo("billy@test.com");
        assertThat(jwtService.getRole(token)).isEqualTo("ADMIN_TENANT");
        assertThat(jwtService.extractTenantId(token)).isEqualTo(42L);
        assertThat(jwtService.extractPlano(token)).isEqualTo("TRIAL");
    }

    @Test
    @DisplayName("isValid() deve retornar true para token válido")
    void isValid_tokenValido_deveRetornarTrue() {
        String token = jwtService.gerar("user-1", "test@test.com", "PRODUTOR", 1L, "TRIAL");
        assertThat(jwtService.isValid(token)).isTrue();
    }

    @Test
    @DisplayName("isValid() deve retornar false para token adulterado")
    void isValid_tokenAdulterado_deveRetornarFalse() {
        String token = jwtService.gerar("user-1", "test@test.com", "PRODUTOR", 1L, "TRIAL");
        String adulterado = token.substring(0, token.length() - 5) + "XXXXX";
        assertThat(jwtService.isValid(adulterado)).isFalse();
    }

    @Test
    @DisplayName("isValid() deve retornar false para token expirado")
    void isValid_tokenExpirado_deveRetornarFalse() {
        ReflectionTestUtils.setField(jwtService, "expiration", -1000L); // já expirado
        String token = jwtService.gerar("user-1", "test@test.com", "PRODUTOR", 1L, "TRIAL");
        assertThat(jwtService.isValid(token)).isFalse();
    }

    @Test
    @DisplayName("isValid() deve retornar false para string vazia")
    void isValid_stringVazia_deveRetornarFalse() {
        assertThat(jwtService.isValid("")).isFalse();
        assertThat(jwtService.isValid("nao.e.um.token")).isFalse();
    }

    @Test
    @DisplayName("tokens gerados com secrets diferentes devem ser inválidos entre si")
    void isValid_secretDiferente_deveRetornarFalse() {
        String token = jwtService.gerar("user-1", "test@test.com", "PRODUTOR", 1L, "TRIAL");

        JwtService outro = new JwtService();
        ReflectionTestUtils.setField(outro, "secret", "outro-secret-completamente-diferente-ok");
        ReflectionTestUtils.setField(outro, "expiration", EXPIRATION);

        assertThat(outro.isValid(token)).isFalse();
    }
}
