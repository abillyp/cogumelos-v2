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

package com.cogumelos.security;

import com.cogumelos.domain.*;
import com.cogumelos.enums.PlanoType;
import com.cogumelos.enums.Role;
import com.cogumelos.enums.StatusTenant;
import com.cogumelos.repository.*;
import org.junit.jupiter.api.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.UUID;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
@DisplayName("TrialFilter — testes de integração")
class TrialFilterTest {

    @Autowired MockMvc              mockMvc;
    @Autowired TenantRepository     tenantRepo;
    @Autowired UsuarioRepository    usuarioRepo;
    @Autowired BCryptPasswordEncoder encoder;
    @Autowired JwtService           jwtService;

    private String gerarToken(Tenant tenant, Usuario usuario) {
        return "Bearer " + jwtService.gerar(
                usuario.getId(), usuario.getEmail(),
                usuario.getRole().name(), tenant.getId(), tenant.getPlano().name()
        );
    }

    private Tenant criarTenant(StatusTenant status, LocalDate trialExpira, LocalDate assinaturaExpira) {
        Tenant t = new Tenant();
        t.setNome("Tenant " + status);
        t.setEmail(UUID.randomUUID() + "@test.com");
        t.setPlano(PlanoType.TRIAL);
        t.setStatus(status);
        t.setTrialExpira(trialExpira);
        t.setAssinaturaExpira(assinaturaExpira);
        return tenantRepo.save(t);
    }

    private Usuario criarUsuario(Tenant tenant) {
        Usuario u = new Usuario();
        u.setId(UUID.randomUUID().toString());
        u.setNome("User");
        u.setEmail(UUID.randomUUID() + "@test.com");
        u.setSenhaHash(encoder.encode("senha"));
        u.setRole(Role.ADMIN_TENANT);
        u.setTenant(tenant);
        return usuarioRepo.save(u);
    }

    @Test
    @DisplayName("Tenant em trial válido deve ter acesso às rotas protegidas")
    void trialValido_devePermitirAcesso() throws Exception {
        Tenant t = criarTenant(StatusTenant.TRIAL, LocalDate.now().plusDays(10), null);
        Usuario u = criarUsuario(t);

        mockMvc.perform(get("/api/experimentos").header("Authorization", gerarToken(t, u)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Tenant com trial expirado deve receber 402")
    void trialExpirado_deveRetornar402() throws Exception {
        Tenant t = criarTenant(StatusTenant.TRIAL, LocalDate.now().minusDays(1), null);
        Usuario u = criarUsuario(t);

        mockMvc.perform(get("/api/experimentos").header("Authorization", gerarToken(t, u)))
                .andExpect(status().isPaymentRequired())
                .andExpect(jsonPath("$.erro").value(containsString("trial")));
    }

    @Test
    @DisplayName("Tenant cancelado deve receber 403")
    void tenantCancelado_deveRetornar403() throws Exception {
        Tenant t = criarTenant(StatusTenant.CANCELADO, null, null);
        Usuario u = criarUsuario(t);

        mockMvc.perform(get("/api/experimentos").header("Authorization", gerarToken(t, u)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.erro").value(containsString("cancelada")));
    }

    @Test
    @DisplayName("Tenant expirado deve receber 402")
    void tenantExpirado_deveRetornar402() throws Exception {
        Tenant t = criarTenant(StatusTenant.EXPIRADO, null, null);
        Usuario u = criarUsuario(t);

        mockMvc.perform(get("/api/experimentos").header("Authorization", gerarToken(t, u)))
                .andExpect(status().isPaymentRequired());
    }

    @Test
    @DisplayName("Rota /api/auth/login deve ser acessível mesmo com trial expirado")
    void rotaLogin_sempreAcessivel() throws Exception {
        // sem token — rota pública
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Tenant ativo com assinatura válida deve ter acesso")
    void tenantAtivo_assinaturaValida_devePermitirAcesso() throws Exception {
        Tenant t = criarTenant(StatusTenant.ATIVO, null, LocalDate.now().plusDays(30));
        t.setPlano(PlanoType.BASICO);
        tenantRepo.save(t);
        Usuario u = criarUsuario(t);

        mockMvc.perform(get("/api/experimentos").header("Authorization", gerarToken(t, u)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Tenant ativo com assinatura expirada deve receber 402")
    void tenantAtivo_assinaturaExpirada_deveRetornar402() throws Exception {
        Tenant t = criarTenant(StatusTenant.ATIVO, null, LocalDate.now().minusDays(1));
        Usuario u = criarUsuario(t);

        mockMvc.perform(get("/api/experimentos").header("Authorization", gerarToken(t, u)))
                .andExpect(status().isPaymentRequired());
    }
}
