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

package com.cogumelos.controller;

import com.cogumelos.domain.*;
import com.cogumelos.enums.PlanoType;
import com.cogumelos.enums.Role;
import com.cogumelos.repository.*;
import com.cogumelos.security.JwtService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@DisplayName("AuthController — testes de integração")
class AuthControllerIntegrationTest {

    @Autowired MockMvc         mockMvc;
    @Autowired ObjectMapper    mapper;
    @Autowired UsuarioRepository  usuarioRepo;
    @Autowired TenantRepository   tenantRepo;
    @Autowired RefreshTokenRepository refreshRepo;
    @Autowired BCryptPasswordEncoder encoder;
    @Autowired JwtService jwtService;

    private Tenant tenant;
    private Usuario usuario;

    @BeforeEach
    void setUp() {
        tenant = new Tenant();
        tenant.setNome("Tenant Teste");
        tenant.setEmail("teste@cogumelos.com");
        tenant.setPlano(PlanoType.TRIAL);
        tenant.setTrialExpira(LocalDate.now().plusDays(14));
        tenantRepo.save(tenant);

        usuario = new Usuario();
        usuario.setId(UUID.randomUUID().toString());
        usuario.setNome("Billy Teste");
        usuario.setEmail("billy@test.com");
        usuario.setSenhaHash(encoder.encode("senha123"));
        usuario.setRole(Role.ADMIN_TENANT);
        usuario.setTenant(tenant);
        usuarioRepo.save(usuario);
    }

    // ── Login ────────────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/auth/login — credenciais corretas devem retornar tokens")
    void login_credenciaisCorretas_deveRetornarTokens() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "email", "billy@test.com",
                        "senha", "senha123"
                ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty())
                .andExpect(jsonPath("$.email").value("billy@test.com"))
                .andExpect(jsonPath("$.role").value("ADMIN_TENANT"));
    }

    @Test
    @DisplayName("POST /api/auth/login — senha errada deve retornar 400")
    void login_senhaErrada_deveRetornar400() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "email", "billy@test.com",
                        "senha", "senha-errada"
                ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value(containsString("inválidos")));
    }

    @Test
    @DisplayName("POST /api/auth/login — email inexistente deve retornar 400")
    void login_emailInexistente_deveRetornar400() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "email", "nao-existe@test.com",
                        "senha", "qualquer"
                ))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("POST /api/auth/login — usuário inativo deve retornar 400")
    void login_usuarioInativo_deveRetornar400() throws Exception {
        usuario.setAtivo(false);
        usuarioRepo.save(usuario);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "email", "billy@test.com",
                        "senha", "senha123"
                ))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.erro").value(containsString("inativo")));
    }

    // ── Registro ─────────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/auth/registro — dados válidos devem criar conta e retornar 201")
    void registro_dadosValidos_deveRetornar201() throws Exception {
        mockMvc.perform(post("/api/auth/registro")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "nome",          "Novo Usuário",
                        "nomeProdutor",  "Cogumelos SP",
                        "email",         "novo@test.com",
                        "senha",         "senha123"
                ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.role").value("ADMIN_TENANT"));
    }

    @Test
    @DisplayName("POST /api/auth/registro — email duplicado deve retornar 400")
    void registro_emailDuplicado_deveRetornar400() throws Exception {
        mockMvc.perform(post("/api/auth/registro")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "nome",         "Billy Duplicado",
                        "nomeProdutor", "Empresa X",
                        "email",        "billy@test.com", // já existe
                        "senha",        "senha123"
                ))))
                .andExpect(status().isBadRequest());
    }

    // ── Refresh ──────────────────────────────────────────────────────────────

    @Test
    @DisplayName("POST /api/auth/refresh — token válido deve retornar novos tokens")
    void refresh_tokenValido_deveRetornarNovosTokens() throws Exception {
        // primeiro faz login para obter refresh token
        String loginResponse = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "email", "billy@test.com",
                        "senha", "senha123"
                ))))
                .andReturn().getResponse().getContentAsString();

        String refreshToken = mapper.readTree(loginResponse).get("refreshToken").asText();

        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("refreshToken", refreshToken))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").isNotEmpty())
                .andExpect(jsonPath("$.refreshToken").isNotEmpty());
    }

    @Test
    @DisplayName("POST /api/auth/refresh — token inválido deve retornar 400")
    void refresh_tokenInvalido_deveRetornar400() throws Exception {
        mockMvc.perform(post("/api/auth/refresh")
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of("refreshToken", "token-falso"))))
                .andExpect(status().isBadRequest());
    }

    // ── Proteção de rotas ────────────────────────────────────────────────────

    @Test
    @DisplayName("GET /api/experimentos — sem token deve retornar 401/403")
    void rotaProtegida_semToken_deveRetornar401ou403() throws Exception {
        mockMvc.perform(get("/api/experimentos"))
                .andExpect(status().is(anyOf(is(401), is(403))));
    }

    @Test
    @DisplayName("GET /api/experimentos — com token válido deve retornar 200")
    void rotaProtegida_comToken_deveRetornar200() throws Exception {
        String token = jwtService.gerar(
                usuario.getId(), usuario.getEmail(),
                usuario.getRole().name(), tenant.getId(), tenant.getPlano().name()
        );

        mockMvc.perform(get("/api/experimentos")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/insumos — PRODUTOR não deve ter acesso (403)")
    void insumos_produtor_deveRetornar403() throws Exception {
        // cria usuário PRODUTOR
        Usuario produtor = new Usuario();
        produtor.setId(UUID.randomUUID().toString());
        produtor.setNome("Produtor");
        produtor.setEmail("produtor@test.com");
        produtor.setSenhaHash(encoder.encode("senha"));
        produtor.setRole(Role.PRODUTOR);
        produtor.setTenant(tenant);
        usuarioRepo.save(produtor);

        String token = jwtService.gerar(
                produtor.getId(), produtor.getEmail(),
                "PRODUTOR", tenant.getId(), "TRIAL"
        );

        mockMvc.perform(post("/api/insumos")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{}"))
                .andExpect(status().isForbidden());
    }
}
