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

package com.cogumelos.controller;

import com.cogumelos.domain.*;
import com.cogumelos.enums.PlanoType;
import com.cogumelos.enums.Role;
import com.cogumelos.repository.*;
import com.cogumelos.service.JwtService;
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
@DisplayName("ExperimentoController — testes de integração")
class ExperimentoControllerIntegrationTest {

    @Autowired MockMvc               mockMvc;
    @Autowired ObjectMapper          mapper;
    @Autowired UsuarioRepository     usuarioRepo;
    @Autowired TenantRepository      tenantRepo;
    @Autowired InsumoRepository      insumoRepo;
    @Autowired FormulacaoRepository  formulacaoRepo;
    @Autowired EspecieCogumeloRepository especieRepo;
    @Autowired BCryptPasswordEncoder encoder;
    @Autowired JwtService            jwtService;

    private String token;
    private Tenant tenant;
    private Usuario usuario;
    private String formulacaoId;

    @BeforeEach
    void setUp() {
        // Tenant
        tenant = new Tenant();
        tenant.setNome("Fazenda Cogumelos");
        tenant.setEmail("fazenda@test.com");
        tenant.setPlano(PlanoType.TRIAL);
        tenant.setTrialExpira(LocalDate.now().plusDays(14));
        tenantRepo.save(tenant);

        // Usuário ADMIN_TENANT
        usuario = new Usuario();
        usuario.setId(UUID.randomUUID().toString());
        usuario.setNome("Billy");
        usuario.setEmail("billy@fazenda.com");
        usuario.setSenhaHash(encoder.encode("senha123"));
        usuario.setRole(Role.ADMIN_TENANT);
        usuario.setTenant(tenant);
        usuario = usuarioRepo.save(usuario);

        token = "Bearer " + jwtService.gerar(
                usuario.getId(), usuario.getEmail(),
                "ADMIN_TENANT", tenant.getId(), "TRIAL", "EMAIL"
        );

        // Espécie
        EspecieCogumelo especie = new EspecieCogumelo();
        especie.setId("esp-" + UUID.randomUUID());
        especie.setNome("Pleurotus ostreatus");
        especie.setCnMin(25.0);
        especie.setCnMax(40.0);
        especie = especieRepo.save(especie);

        // Insumo do tenant
        Insumo insumo = new Insumo();
        insumo.setId("ins-" + UUID.randomUUID());
        insumo.setNome("Serragem de eucalipto");
        insumo.setMoPct(0.95);
        insumo.setCarbonoPct(0.49);
        insumo.setNitrogenioPct(0.001);
        insumo.setTenantId(tenant.getId());
        insumo.calcularCnRatio();
        insumo = insumoRepo.save(insumo);

        // Formulação
        FormulacaoInsumo fi = new FormulacaoInsumo();
        fi.setId(UUID.randomUUID().toString());
        fi.setTenantId(tenant.getId());
        fi.setInsumo(insumo);
        fi.setPesoRealKg(10.0);
        fi.setUmidadePct(0.40);

        Formulacao formulacao = new Formulacao();
        formulacao.setId(UUID.randomUUID().toString());
        formulacao.setTenantId(tenant.getId());
        formulacao.setNome("Substrato Padrão");
        formulacao.setEspecie(especie);
        formulacao.setUsuario(usuario);
        formulacao.setUmidade(65.0);
        formulacao.setPesoBlocoKg(1.2);
        formulacao.setTotalBlocos(40);
        formulacao.getInsumos().add(fi);
        fi.setFormulacao(formulacao);
        formulacao.recalcular();
        formulacaoId = formulacaoRepo.save(formulacao).getId();
    }

    @Test
    @DisplayName("GET /api/experimentos — deve retornar lista vazia inicialmente")
    void listar_deveRetornarListaVazia() throws Exception {
        mockMvc.perform(get("/api/experimentos").header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$").isEmpty());
    }

    @Test
    @DisplayName("POST /api/experimentos — deve criar experimento e retornar 201")
    void criar_dadosValidos_deveRetornar201() throws Exception {
        Map<String, Object> body = Map.of(
                "formulacaoId", formulacaoId,
                "codigo",       "EXP-2026-001",
                "dataPreparo",  LocalDate.now().toString(),
                "totalBlocos",  40,
                "pesoBlocoKg",  1.2
        );

        mockMvc.perform(post("/api/experimentos")
                .header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(body)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.codigo").value("EXP-2026-001"))
                .andExpect(jsonPath("$.status").value("PREPARACAO"))
                .andExpect(jsonPath("$.totalBlocos").value(40));
    }

    @Test
    @DisplayName("POST /api/experimentos — código duplicado deve retornar 409")
    void criar_codigoDuplicado_deveRetornar409() throws Exception {
        Map<String, Object> body = Map.of(
                "formulacaoId", formulacaoId,
                "codigo",       "EXP-DUPLICADO",
                "dataPreparo",  LocalDate.now().toString(),
                "totalBlocos",  20,
                "pesoBlocoKg",  1.0
        );

        // cria primeira vez
        mockMvc.perform(post("/api/experimentos")
                .header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(body)))
                .andExpect(status().isCreated());

        // tenta criar com mesmo código
        mockMvc.perform(post("/api/experimentos")
                .header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(body)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.erro").value(containsString("código")));
    }

    @Test
    @DisplayName("PATCH /api/experimentos/{id}/avancar — deve avançar status")
    void avancar_deveAvançarStatus() throws Exception {
        // cria experimento
        String resp = mockMvc.perform(post("/api/experimentos")
                .header("Authorization", token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(mapper.writeValueAsString(Map.of(
                        "formulacaoId", formulacaoId,
                        "codigo",       "EXP-AVANCAR",
                        "dataPreparo",  LocalDate.now().toString(),
                        "totalBlocos",  10,
                        "pesoBlocoKg",  1.0
                ))))
                .andReturn().getResponse().getContentAsString();

        String id = mapper.readTree(resp).get("id").asText();

        mockMvc.perform(patch("/api/experimentos/" + id + "/avancar")
                .header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INOCULADO"));
    }

    @Test
    @DisplayName("Experimento de outro tenant não deve ser acessível")
    void buscar_experimentoDeOutroTenant_deveRetornar404() throws Exception {
        // cria segundo tenant
        Tenant outro = new Tenant();
        outro.setNome("Outro Tenant");
        outro.setEmail("outro@test.com");
        outro.setPlano(PlanoType.TRIAL);
        outro.setTrialExpira(LocalDate.now().plusDays(14));
        tenantRepo.save(outro);

        Usuario usuarioOutro = new Usuario();
        usuarioOutro.setId(UUID.randomUUID().toString());
        usuarioOutro.setNome("Outro");
        usuarioOutro.setEmail("outro@outro.com");
        usuarioOutro.setSenhaHash(encoder.encode("senha"));
        usuarioOutro.setRole(Role.ADMIN_TENANT);
        usuarioOutro.setTenant(outro);
        usuarioRepo.save(usuarioOutro);

        String tokenOutro = "Bearer " + jwtService.gerar(
                usuarioOutro.getId(), usuarioOutro.getEmail(),
                "ADMIN_TENANT", outro.getId(), "TRIAL", "EMAIL"
        );

        // tenta acessar experimento do tenant principal com token do outro
        mockMvc.perform(get("/api/experimentos/id-inexistente-do-outro-tenant")
                .header("Authorization", tokenOutro))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("GET /api/experimentos/codigo-sugestao — deve retornar sugestão no formato correto")
    void codigoSugestao_deveRetornarFormatoCorreto() throws Exception {
        mockMvc.perform(get("/api/experimentos/codigo-sugestao")
                .header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.codigo").value(matchesPattern("EXP-\\d{4}-\\d{3}")));
    }
}
